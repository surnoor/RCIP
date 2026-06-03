import { chromium } from 'playwright';

async function testRequests() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api')) {
      console.log('API Request:', request.method(), url);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api')) {
      console.log('API Response:', url, response.status());
      try {
        const text = await response.text();
        console.log('Response sample (first 400 chars):', text.substring(0, 400));
      } catch (e) {
        console.log('Failed to read response body');
      }
    }
  });

  console.log("Navigating to WorkBC job details...");
  await page.goto('https://www.workbc.ca/jobs-careers/find-jobs/jobs.aspx#/job-details/49628825', { waitUntil: 'networkidle' });
  console.log("Waiting 5 seconds for network events...");
  await page.waitForTimeout(5000);
  await browser.close();
  console.log("Done.");
}

testRequests().catch(console.error);
