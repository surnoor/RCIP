import { NextResponse } from 'next/server';

function replacePlaceholders(text: string, title: string, company: string): string {
  if (!text) return '';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return text
    .replace(/\[JOB_TITLE\]/gi, title || 'the open position')
    .replace(/\[COMPANY_NAME\]/gi, company || 'your company')
    .replace(/\[DATE\]/gi, dateStr);
}

export async function POST(req: Request) {
  try {
    const { jobTitle, companyName, baseResume, baseCoverLetter } = await req.json();

    if (!baseResume) {
      return NextResponse.json({ error: 'Missing base resume content' }, { status: 400 });
    }

    // Process templates
    const tailoredResume = replacePlaceholders(baseResume, jobTitle, companyName);
    const tailoredCoverLetter = replacePlaceholders(baseCoverLetter || '', jobTitle, companyName);

    // Generate standard email body
    const emailBody = `Dear Hiring Manager,

Please find attached my resume and cover letter for the ${jobTitle || 'open'} position at ${companyName || 'your company'}. 

I am very interested in this opportunity and believe my administrative background aligns perfectly with your needs. I look forward to the possibility of discussing this role further.

Best regards,
Surnoor Singh`;

    // Add a slight fake delay so the UI still feels like it's "doing work" (optional but good for UX)
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ tailoredResume, tailoredCoverLetter, emailBody });
  } catch (error: any) {
    console.error('Template Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate documents' }, { status: 500 });
  }
}
