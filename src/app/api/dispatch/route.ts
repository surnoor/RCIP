import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { toEmail, subject, textBody, applicantName, resumeBuffer, coverLetterBuffer } = await req.json();

    if (!toEmail || !subject || !textBody || !resumeBuffer) {
      return NextResponse.json({ error: 'Missing required fields for dispatch' }, { status: 400 });
    }

    const attachments = [
      {
        filename: `${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`,
        content: Buffer.from(resumeBuffer.data),
      }
    ];

    if (coverLetterBuffer) {
      attachments.push({
        filename: `${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}_CoverLetter.pdf`,
        content: Buffer.from(coverLetterBuffer.data),
      });
    }

    const data = await resend.emails.send({
      from: 'Job Tracker <onboarding@resend.dev>', // You should change this to your verified domain later
      to: [toEmail],
      subject: subject,
      text: textBody,
      attachments: attachments,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Dispatch Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
