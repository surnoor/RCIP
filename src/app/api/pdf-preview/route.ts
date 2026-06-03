import { NextResponse } from 'next/server';
import { generatePdfBuffer } from '@/lib/pdf';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Missing markdown content for PDF generation' }, { status: 400 });
    }

    const pdfBuffer = await generatePdfBuffer(content);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"'
      }
    });

  } catch (error: any) {
    console.error('PDF Preview Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate PDF preview' }, { status: 500 });
  }
}
