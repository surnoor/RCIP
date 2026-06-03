import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { jobDescription, baseResume, baseCoverLetter } = await req.json();

    if (!jobDescription || !baseResume) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `
You are an expert executive recruiter and resume writer.
I will provide you with a Job Description and a Base Resume. 
Your task is to tailor the Base Resume to strictly match the Job Description.
Focus on highlighting administrative skills.
Reorder and rewrite bullet points to align with the employer's needs.
Do not hallucinate skills or experience that are not in the Base Resume.

Job Description:
${jobDescription}

Base Resume:
${baseResume}

Output the tailored resume in clean Markdown format. Do not use any markdown codeblocks like \`\`\`markdown, just output the raw markdown text.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const tailoredResume = response.text;

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

Output the tailored cover letter in clean Markdown format. Do not use any markdown codeblocks like \`\`\`markdown, just output the raw markdown text.
`;
      const clResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: clPrompt,
      });
      tailoredCoverLetter = clResponse.text || '';
    }

    return NextResponse.json({ tailoredResume, tailoredCoverLetter });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate documents' }, { status: 500 });
  }
}
