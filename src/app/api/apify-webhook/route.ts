import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received Apify Webhook:", body);

    const { datasetId, source } = body;

    if (!datasetId) {
      return NextResponse.json({ error: "Missing datasetId" }, { status: 400 });
    }

    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      console.error("Missing APIFY_API_TOKEN in environment.");
      return NextResponse.json({ error: "Missing APIFY_API_TOKEN" }, { status: 500 });
    }

    const client = new ApifyClient({ token: apifyToken });
    const { items } = await client.dataset(datasetId).listItems();

    console.log(`Fetched ${items.length} items from dataset ${datasetId} (Source: ${source})`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let upsertedCount = 0;

    for (const item of items) {
      let jobRecord: any = null;

      if (source === 'indeed') {
        // hynek/indeed-scraper format
        jobRecord = {
          title: item.positionName,
          company: item.company,
          location: item.location,
          description: item.description || "No description available.",
          url: item.url,
          status: 'new'
        };
      } else if (source === 'linkedin') {
        // bebity/linkedin-jobs-scraper format
        jobRecord = {
          title: item.title,
          company: item.companyName,
          location: item.location,
          description: item.description || "No description available.",
          url: item.url,
          status: 'new'
        };
      } else {
        // Generic fallback if another scraper is used
        jobRecord = {
          title: item.title || item.positionName,
          company: item.company || item.companyName,
          location: item.location,
          description: item.description || "No description available.",
          url: item.url || item.jobUrl,
          status: 'new'
        };
      }

      if (jobRecord && jobRecord.title && jobRecord.url) {
        const { error } = await supabase
          .from('jobs')
          .upsert(jobRecord, { onConflict: 'url' });

        if (error) {
          console.error(`Failed to upsert job ${jobRecord.url}:`, error);
        } else {
          upsertedCount++;
        }
      }
    }

    console.log(`Successfully upserted ${upsertedCount} jobs into Supabase.`);
    return NextResponse.json({ success: true, processed: items.length, upserted: upsertedCount });

  } catch (err: any) {
    console.error("Apify Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
