import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(): Promise<Response> {
  console.log("API POST /api/scrape: Starting scraper child process...");
  
  return new Promise<Response>((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'scripts/scrape.ts');
    const command = `npx tsx "${scriptPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Scrape execution failed:`, error);
        resolve(
          NextResponse.json(
            {
              success: false,
              error: error.message,
              stdout: stdout || "",
              stderr: stderr || ""
            },
            { status: 500 }
          )
        );
        return;
      }
      
      console.log("API POST /api/scrape: Scraper child process completed successfully.");
      resolve(
        NextResponse.json({
          success: true,
          stdout: stdout || "",
          stderr: stderr || ""
        })
      );
    });
  });
}
