import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'scraper_config.json');

export async function GET() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return NextResponse.json(config);
  } catch (e) {
    console.error('Failed to read scraper configuration:', e);
    return NextResponse.json({ error: 'Failed to read scraper configuration' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body.keywords || !body.cities || !body.sources) {
      return NextResponse.json({ error: 'Invalid configuration payload: keywords, cities, and sources are required' }, { status: 400 });
    }

    fs.writeFileSync(configPath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true, config: body });
  } catch (e) {
    console.error('Failed to save scraper configuration:', e);
    return NextResponse.json({ error: 'Failed to save scraper configuration' }, { status: 500 });
  }
}
