import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import _configData from '../../scraper_config.json';
interface ScraperConfig {
  keywords: string[];
  cities: string[];
  sources: { id: string; name: string; url: string; active: boolean }[];
  apifyEnabled?: boolean;
  apifyMaxItems?: number;
}
const configData = _configData as ScraperConfig;

// This file runs natively in Node.js server environments

export async function scrapeAll() {
  console.log("Starting master scraper process...");
  
  // 1. Run WorkBC synchronously
  let workbcResult = { success: true, message: "WorkBC skipped" };
  try {
    workbcResult = await scrapeWorkBC();
  } catch (e: any) {
    console.error("WorkBC scrape failed:", e);
    workbcResult = { success: false, message: e.message };
  }

  // 2. Trigger Apify scrapers asynchronously (Indeed/LinkedIn)
  let apifyResult = { success: true, message: "Apify skipped" };
  try {
    apifyResult = await triggerApifyScrapers();
  } catch (e: any) {
    console.error("Apify trigger failed:", e);
    apifyResult = { success: false, message: e.message };
  }

  return {
    success: true,
    message: `WorkBC: ${workbcResult.message}. Apify: ${apifyResult.message}`
  };
}

export async function scrapeWorkBC() {
  console.log("Starting native WorkBC Scraper...");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Cast or default the config
  const config = {
    keywords: configData.keywords || [],
    cities: configData.cities || [],
    sources: configData.sources || []
  };

  const TARGET_CITIES = new Set(config.cities.map(c => c.trim().toLowerCase()));
  const KEYWORDS = config.keywords;
  const ACTIVE_SOURCES = config.sources.filter(s => s.active).map(s => s.id);

  if (!ACTIVE_SOURCES.includes('workbc')) {
    console.log("WorkBC is disabled in the active scraper sources configuration. Skipping WorkBC scrape.");
    return { success: true, message: "WorkBC disabled" };
  }
  
  const searchUrl = 'https://workbc-jb.a55eb5-prod.stratus.cloud.gov.bc.ca/api/Search/JobSearch';
  const allJobsMap = new Map<string, any>();

  for (const keyword of KEYWORDS) {
    console.log(`Searching for keyword: "${keyword} full time"...`);
    const payload = {
      Page: 1,
      PageSize: 100,
      SalaryMin: "",
      SalaryMax: "",
      Keyword: `${keyword} full time`,
      SearchInField: "all",
      SearchIsPostingsInEnglish: true,
      SearchJobSource: "0"
    };

    try {
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json: any = await response.json();
      
      if (json && json.result) {
        console.log(`Found ${json.result.length} jobs for keyword "${keyword}".`);
        for (const job of json.result) {
          allJobsMap.set(job.JobId, job);
        }
      }
    } catch (e) {
      console.error(`Error searching keyword "${keyword}":`, e);
    }
  }

  const uniqueJobs = Array.from(allJobsMap.values());
  console.log(`Total unique jobs found across all keywords: ${uniqueJobs.length}`);

  const matchingJobs = uniqueJobs.filter(job => {
    const city = (job.City || '').trim().toLowerCase();
    return TARGET_CITIES.has(city);
  });

  console.log(`Filtered down to ${matchingJobs.length} jobs in RCIP target cities.`);

  if (matchingJobs.length === 0) {
    console.log("No matching jobs found in target RCIP regions.");
    return { success: true, message: "No matching jobs found" };
  }

  async function fetchJobDetail(jobId: string): Promise<any> {
    const url = `https://workbc-jb.a55eb5-prod.stratus.cloud.gov.bc.ca/api/Search/GetJobDetail?jobId=${jobId}&language=en&isToggle=false`;
    try {
      const res = await fetch(url);
      const json: any = await res.json();
      if (json && json.result && json.result.length > 0) {
        return json.result[0];
      }
    } catch (e) {
      console.error(`Error fetching details for job ID ${jobId}:`, e);
    }
    return null;
  }

  // Fetch all job details in parallel to save time (prevents Vercel timeout)
  console.log(`\nFetching details for ${matchingJobs.length} jobs in parallel...`);
  
  const detailedJobs = await Promise.all(
    matchingJobs.map(async (job) => {
      const details = await fetchJobDetail(job.JobId);
      return { job, details };
    })
  );

  for (const { job, details } of detailedJobs) {
    if (!details) {
      console.log(`Could not retrieve details for job ${job.JobId}. Skipping.`);
      continue;
    }

    // Format a beautiful description
    let description = "";
    if (details.SalaryDescription) {
      description += `### Salary & Hours\n- **Salary:** ${details.SalaryDescription}\n`;
      if (details.WorkHours) {
        description += `- **Hours:** ${details.WorkHours} hours per week\n`;
      }
      description += `\n`;
    }
    
    if (details.NocGroup) {
      description += `### Classification\n- **NOC Code:** ${details.Noc2021 || 'N/A'}\n- **NOC Group:** ${details.NocGroup}\n\n`;
    }

    if (details.SkillCategories && details.SkillCategories.length > 0) {
      description += `### Job Requirements & Specifications\n\n`;
      for (const cat of details.SkillCategories) {
        if (cat.Skills && cat.Skills.length > 0) {
          description += `**${cat.Category?.Name || 'Requirements'}**\n`;
          for (const skill of cat.Skills) {
            description += `- ${skill}\n`;
          }
          description += `\n`;
        }
      }
    }

    if (details.ApplyEmailAddress || details.ApplyWebsite) {
      description += `### How to Apply\n`;
      if (details.ApplyEmailAddress) {
        description += `- **Email:** ${details.ApplyEmailAddress}\n`;
      }
      if (details.ApplyWebsite) {
        description += `- **Website:** [Apply Online Here](${details.ApplyWebsite})\n`;
      }
      description += `\n`;
    }

    const jobUrl = `https://www.workbc.ca/jobs-careers/find-jobs/jobs.aspx#/job-details/${job.JobId}`;

    const jobRecord = {
      title: details.Title || job.Title,
      company: details.EmployerName || job.EmployerName,
      location: details.City || job.City,
      description: description,
      url: jobUrl,
      status: details.ApplyEmailAddress ? 'new' : 'web_form'
    };

    console.log(`Upserting job: ${jobRecord.title} at ${jobRecord.company}...`);
    const { error } = await supabase
      .from('jobs')
      .upsert(jobRecord, { onConflict: 'url' })
      .select();

    if (error) {
      console.error(`Error inserting ${jobRecord.title}:`, error);
    } else {
      console.log(`Successfully upserted: ${jobRecord.title} in ${jobRecord.location}`);
    }
  }

  console.log("\nWorkBC Scraping and DB populating completed successfully!");
  return { success: true, message: "WorkBC completed" };
}

export async function triggerApifyScrapers() {
  if (configData.apifyEnabled === false) {
    console.log("Apify integration is globally disabled in settings. Skipping.");
    return { success: true, message: "Apify disabled" };
  }
  
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
    console.warn("APIFY_API_TOKEN is not set. Skipping Apify scrapers.");
    return { success: false, message: "Missing Apify token" };
  }

  // Construct Webhook URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const webhookUrl = `${baseUrl}/api/apify-webhook`;

  const client = new ApifyClient({ token: apifyToken });

  const config = {
    keywords: configData.keywords || [],
    cities: configData.cities || [],
    sources: configData.sources || [],
    apifyEnabled: Boolean(configData.apifyEnabled) !== false,
    apifyMaxItems: configData.apifyMaxItems || 50
  };

  const ACTIVE_SOURCES = config.sources.filter(s => s.active).map(s => s.id);
  const searchQueries = [];
  for (const keyword of config.keywords) {
    for (const city of config.cities) {
      searchQueries.push(`${keyword} in ${city}, BC`);
    }
  }

  let triggered = 0;
  const errors: string[] = [];

  // 1. Indeed Scraper (borderline/indeed-scraper)
  if (ACTIVE_SOURCES.includes('indeed') && searchQueries.length > 0) {
    console.log("Triggering Apify Indeed Scraper...");
    try {
      await client.actor('borderline/indeed-scraper').start({
        position: config.keywords.map(k => `${k} full time`).join(', '),
        location: config.cities.join(' BC, '),
        maxItems: config.apifyMaxItems || 50,
        sort: "date",
        saveOnlyUniqueItems: true
      }, {
        webhooks: [{
          eventTypes: ["ACTOR.RUN.SUCCEEDED"],
          requestUrl: webhookUrl,
          payloadTemplate: `{"datasetId": "{{resource.defaultDatasetId}}", "source": "indeed"}`
        }]
      });
      triggered++;
    } catch (e: any) {
      console.error("Failed to trigger Indeed scraper:", e);
      errors.push(`Indeed: ${e.message || 'Unknown error'} ${e.data?.approvalUrl ? `(Approve here: ${e.data.approvalUrl})` : ''}`);
    }
  }

  // 2. LinkedIn Scraper (harvestapi/linkedin-job-search)
  if (ACTIVE_SOURCES.includes('linkedin') && config.keywords.length > 0) {
    console.log("Triggering Apify LinkedIn Scraper (HarvestAPI)...");
    try {
      await client.actor('harvestapi/linkedin-job-search').start({
        queries: config.keywords,
        locations: config.cities.map(c => `${c}, British Columbia, Canada`),
        postedLimit: "week",
        employmentType: ["full-time"],
        maxItemsPerQuery: config.apifyMaxItems || 50
      }, {
        webhooks: [{
          eventTypes: ["ACTOR.RUN.SUCCEEDED"],
          requestUrl: webhookUrl,
          payloadTemplate: `{"datasetId": "{{resource.defaultDatasetId}}", "source": "linkedin"}`
        }]
      });
      triggered++;
    } catch (e: any) {
      console.error("Failed to trigger LinkedIn scraper:", e);
      errors.push(`LinkedIn: ${e.message || 'Unknown error'} ${e.data?.approvalUrl ? `(Approve here: ${e.data.approvalUrl})` : ''}`);
    }
  }

  // 3. Google Dorks Scraper (apify/google-search-scraper)
  if (ACTIVE_SOURCES.includes('google_dorks') && config.keywords.length > 0) {
    console.log("Triggering Apify Google Search Scraper for local careers...");
    try {
      // Build clever queries: site:*.ca/careers OR site:*.com/jobs "administrative" "North Bay"
      const dorkQueries = [];
      const siteOperators = "site:*.ca/careers OR site:*.com/jobs OR site:*.ca/opportunities OR site:*.com/opportunities OR inurl:careers OR inurl:jobs";
      
      for (const keyword of config.keywords) {
        for (const city of config.cities) {
          dorkQueries.push({
            searchQuery: `${siteOperators} "${keyword}" "${city}"`
          });
        }
      }

      await client.actor('apify/google-search-scraper').start({
        queries: dorkQueries.map(q => q.searchQuery).join('\n'),
        maxPagesPerQuery: 1,
        resultsPerPage: 10,
        countryCode: "ca"
      }, {
        webhooks: [{
          eventTypes: ["ACTOR.RUN.SUCCEEDED"],
          requestUrl: webhookUrl,
          payloadTemplate: `{"datasetId": "{{resource.defaultDatasetId}}", "source": "google_dorks"}`
        }]
      });
      triggered++;
    } catch (e: any) {
      console.error("Failed to trigger Google Dorks scraper:", e);
      errors.push(`Google Dorks: ${e.message || 'Unknown error'} ${e.data?.approvalUrl ? `(Approve here: ${e.data.approvalUrl})` : ''}`);
    }
  }

  if (triggered > 0) {
    return { success: true, message: `Started ${triggered} Apify runs. Webhook: ${webhookUrl}` };
  } else {
    return { success: false, message: `Apify triggers failed. Errors: ${errors.join(' | ')}` };
  }
}
