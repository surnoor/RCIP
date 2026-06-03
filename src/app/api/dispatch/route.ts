import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { generatePdfBuffer } from '@/lib/pdf';

export async function POST(req: Request) {
  try {
    const { toEmail, subject, textBody, applicantName, resumeContent, coverLetterContent } = await req.json();

    if (!toEmail || !subject || !textBody || !resumeContent) {
      return NextResponse.json({ error: 'Missing required fields for dispatch' }, { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        return NextResponse.json({ error: 'Gmail credentials not configured in environment (EMAIL_USER, EMAIL_APP_PASSWORD).' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });

    const resumeBuffer = await generatePdfBuffer(resumeContent);
    const attachments = [
      {
        filename: `${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`,
        content: resumeBuffer,
      }
    ];

    if (coverLetterContent) {
      const coverLetterBuffer = await generatePdfBuffer(coverLetterContent);
      attachments.push({
        filename: `${applicantName.replace(/[^a-zA-Z0-9]/g, '_')}_CoverLetter.pdf`,
        content: coverLetterBuffer,
      });
    }

    const info = await transporter.sendMail({
      from: `"Job Tracker" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      text: textBody,
      attachments: attachments,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Dispatch Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
