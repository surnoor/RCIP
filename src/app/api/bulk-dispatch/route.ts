import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { jobIds } = await req.json();

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid jobIds array' }, { status: 400 });
    }

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
        const emailMatch = job.description.match(/- \*\*Email:\*\* ([\w.-]+@[\w.-]+\.\w+)/);
        if (!emailMatch) {
          throw new Error('No apply email found in description');
        }
        const applyEmail = emailMatch[1];

        // Generate tailored Resume
        const resumePrompt = `
You are an expert executive recruiter and resume writer.
I will provide you with a Job Description and a Base Resume. 
Your task is to tailor the Base Resume to strictly match the Job Description.
Focus on highlighting administrative skills.
Reorder and rewrite bullet points to align with the employer's needs.

Job Description:
${job.description}

Base Resume:
${baseResume}

Output the tailored resume in clean Markdown format. Do not use any markdown codeblocks like \`\`\`markdown, just output the raw markdown text.
`;
        const resumeRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: resumePrompt,
        });
        const tailoredResume = resumeRes.text;

        // Generate tailored Cover Letter
        const clPrompt = `
You are an expert cover letter writer.
Based on the following Job Description and my Base Cover Letter, write a tailored cover letter.
Match the tone, address the specific needs of the job, and emphasize my administrative capabilities.

Job Description:
${job.description}

Base Cover Letter:
${baseCoverLetter}

Output the tailored cover letter in clean plain text (no markdown formatting, just plain text ready for an email body).
`;
        const clRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: clPrompt,
        });
        const tailoredCoverLetter = clRes.text;

        // Send Email via Resend
        if (!process.env.RESEND_API_KEY) {
            console.warn("RESEND_API_KEY is missing. Skipping actual email send.");
        } else {
            // NOTE: In testing/development without a verified domain, Resend only allows sending to the verified email.
            // Using onboarding@resend.dev or your own email if unverified.
            const targetEmail = process.env.NODE_ENV === 'development' ? 'onboarding@resend.dev' : applyEmail;
            
            const emailData = await resend.emails.send({
              from: 'RCIP Tracker <onboarding@resend.dev>', // Must use verified domain in prod
              to: [targetEmail],
              subject: `Application for ${job.title} - ${job.company}`,
              text: tailoredCoverLetter || 'Please find my resume attached.',
              attachments: [
                {
                  filename: 'Resume.txt',
                  content: Buffer.from(tailoredResume || '', 'utf-8'),
                }
              ]
            });

            if (emailData.error) {
                throw new Error(`Resend Error: ${emailData.error.message}`);
            }
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
