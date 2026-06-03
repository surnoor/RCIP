import { NextResponse } from 'next/server';
import { scrapeAll } from '@/lib/scraper';

export async function POST(): Promise<Response> {
  console.log("API POST /api/scrape: Starting master scraper...");
  
  try {
    const result = await scrapeAll();
    console.log("API POST /api/scrape: Scraper processes completed.", result);
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
