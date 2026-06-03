import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { scrapeAll } from './src/lib/scraper';

async function main() {
  console.log('Starting local test scrape...');
  try {
    const res = await scrapeAll();
    console.log('Result:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
main();
