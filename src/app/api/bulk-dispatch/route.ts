import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generatePdfBuffer } from '@/lib/pdf';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const { jobIds } = await req.json();

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid jobIds array' }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'Gmail credentials not configured in environment.' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });

    // 1. Fetch the jobs from Supabase
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .in('id', jobIds);

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
    }

    // 2. Fetch base documents
    const { data: docs, error: docsError } = await supabase
      .from('user_documents')
      .select('*')
      .limit(1)
      .single();

    if (docsError && docsError.code !== 'PGRST116') {
      console.warn("Could not fetch user documents:", docsError);
    }

    const baseResume = docs?.base_resume || 'Base resume not set.';
    const baseCoverLetter = docs?.base_cover_letter || 'Base cover letter not set.';

    const successful = [];
    const failed = [];

    // 3. Process each job sequentially
    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.id} (${job.title})...`);

        // Extract email address from description
        const emailMatch = job.description.match(/- \*\*Email:\*\* ([\w.-]+@[\w.-]+\.\w+)/) || job.description.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (!emailMatch) {
          throw new Error('No apply email found in description');
        }
        const applyEmail = emailMatch[1] || emailMatch[0]; // Fallback to raw match if group 1 fails

        // Generate tailored Resume
        const resumePrompt = `
You are an expert executive recruiter and resume writer.
I will provide you with a Job Description and a Base Resume. 
Your task is to tailor the Base Resume to strictly match the Job Description.
Focus on highlighting administrative skills.
Reorder and rewrite bullet points to align with the employer's needs.
Do not hallucinate skills or experience that are not in the Base Resume.

Job Description:
${job.description}

Base Resume:
${baseResume}

CRITICAL: Output the tailored resume in strictly plain text formatting. DO NOT use any markdown tags, asterisks (*), hash symbols (#), bold tags, or any AI-like formatting. Format lists with simple dashes (-) or plain numbers (1. 2.).
`;
        const resumeRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: resumePrompt,
        });
        const tailoredResume = resumeRes.text || '';

        // Generate tailored Cover Letter
        const clPrompt = `
You are an expert cover letter writer.
Based on the following Job Description and my Base Cover Letter, write a tailored cover letter.
Match the tone, address the specific needs of the job, and emphasize my administrative capabilities.

Job Description:
${job.description}

Base Cover Letter:
${baseCoverLetter}

CRITICAL: Output the tailored cover letter in strictly plain text formatting suitable for an email attachment. DO NOT use any markdown tags, asterisks (*), hash symbols (#), bold tags, or any AI-like formatting.
`;
        const clRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: clPrompt,
        });
        const tailoredCoverLetter = clRes.text || '';

        const emailBodyPrompt = `
You are an expert professional applicant.
Based on the following Job Description, write a short, professional email body (3-5 sentences) introducing myself and stating that my resume and cover letter are attached.
Do not include subject line or placeholder blocks like [Your Name], just write the pure body.

Job Description:
${job.description}

CRITICAL: Output strictly plain text. NO markdown, NO asterisks. Keep it concise.
`;
        const emailBodyRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: emailBodyPrompt,
        });
        const tailoredEmailBody = emailBodyRes.text || 'Please find my application attached.';

        // Create PDFs
        const resumeBuffer = await generatePdfBuffer(tailoredResume);
        const coverLetterBuffer = await generatePdfBuffer(tailoredCoverLetter);

        const attachments = [
            {
              filename: 'Resume.pdf',
              content: resumeBuffer,
            },
            {
              filename: 'CoverLetter.pdf',
              content: coverLetterBuffer,
            }
        ];

        // Send Email via Nodemailer
        const info = await transporter.sendMail({
            from: `"Surnoor Singh" <${process.env.EMAIL_USER}>`,
            to: applyEmail,
            subject: `Application for ${job.title} - ${job.company}`,
            text: tailoredEmailBody,
            attachments: attachments,
        });

        if (!info.messageId) {
            throw new Error(`Nodemailer Error: Failed to get messageId`);
        }

        // Update Job Status
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ status: 'applied' })
          .eq('id', job.id);

        if (updateError) throw updateError;

        // Optionally, record in applications table
        await supabase.from('applications').insert({
            job_id: job.id,
            tailored_resume: tailoredResume,
            tailored_cover_letter: tailoredCoverLetter,
            status: 'submitted',
            submitted_at: new Date().toISOString()
        });

        successful.push(job.id);
        console.log(`Successfully dispatched application for job ${job.id}`);

      } catch (jobErr: any) {
        console.error(`Failed to dispatch job ${job.id}:`, jobErr);
        failed.push({ id: job.id, error: jobErr.message });
      }
    }

    return NextResponse.json({
      success: true,
      successful,
      failed
    });

  } catch (error: any) {
    console.error('Bulk Dispatch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute bulk dispatch' }, { status: 500 });
  }
}
