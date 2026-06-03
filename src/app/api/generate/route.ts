import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { jobDescription, baseResume, baseCoverLetter } = await req.json();

    if (!jobDescription || !baseResume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resumePrompt = `
You are an expert executive recruiter and ATS (Applicant Tracking System) optimization specialist.
I will provide you with a Job Description and my Base Resume. 
Your task is to tailor my Base Resume to strictly match the Job Description, optimizing it to pass through ATS filters while retaining 100% of my factual employment history.

CRITICAL RULES YOU MUST FOLLOW EXACTLY:
1. YOU MUST NOT REMOVE OR CHANGE any Employer Names.
2. YOU MUST NOT REMOVE OR CHANGE any Locations of employment.
3. YOU MUST NOT REMOVE OR CHANGE any Positions/Titles I held.
4. YOU MUST NOT REMOVE OR CHANGE any Dates (Months and Years) of my employment.
5. You may ONLY change, optimize, re-order, and inject keywords into the bullet points and descriptions of what I did at those jobs, to perfectly align with the employer's needs in the Job Description.
6. Do not hallucinate skills, degrees, or experience that are not implied by or directly stated in the Base Resume.

Job Description:
${jobDescription}

Base Resume:
${baseResume}

CRITICAL: Output the tailored resume in strictly plain text formatting. DO NOT use any markdown tags, asterisks (*), hash symbols (#), bold tags, or any AI-like formatting. Format lists with simple dashes (-) or plain numbers (1. 2.). The output must look like a clean, professional plain text document.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: resumePrompt,
    });

    const tailoredResume = response.text || '';

    let tailoredCoverLetter = '';
    if (baseCoverLetter) {
       const clPrompt = `
You are an expert cover letter writer.
Based on the following Job Description and my Base Cover Letter, write a tailored cover letter.
Match the tone, address the specific needs of the job, and emphasize my administrative capabilities.

Job Description:
${jobDescription}

Base Cover Letter:
${baseCoverLetter}

CRITICAL: Output the tailored cover letter in strictly plain text formatting suitable for an email attachment. DO NOT use any markdown tags, asterisks (*), hash symbols (#), bold tags, or any AI-like formatting. The output must look like a clean, professional plain text business letter.
`;
      const clResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: clPrompt,
      });
      tailoredCoverLetter = clResponse.text || '';
    }

    const emailBodyPrompt = `
You are an expert professional applicant.
Based on the following Job Description, write a short, professional email body (3-5 sentences) introducing myself and stating that my resume and cover letter are attached.
Do not include subject line or placeholder blocks like [Your Name], just write the pure body.

Job Description:
${jobDescription}

CRITICAL: Output strictly plain text. NO markdown, NO asterisks. Keep it concise.
`;

    const emailBodyResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: emailBodyPrompt,
    });
    const emailBody = emailBodyResponse.text || '';

    return NextResponse.json({ tailoredResume, tailoredCoverLetter, emailBody });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate documents' }, { status: 500 });
  }
}
