import { NextResponse } from 'next/server';
import { scrapeWorkBC } from '@/lib/scraper';

export async function POST(): Promise<Response> {
  console.log("API POST /api/scrape: Starting native scraper...");
  
  try {
    const result = await scrapeWorkBC();
    console.log("API POST /api/scrape: Scraper completed successfully.", result);
    return NextResponse.json({
      success: true,
      stdout: result?.message || "",
      stderr: ""
    });
  } catch (error: any) {
    console.error(`Scrape execution failed:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stdout: "",
        stderr: error.message
      },
      { status: 500 }
    );
  }
}
