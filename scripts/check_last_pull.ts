import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLastPull() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching jobs:', error);
    return;
  }

  if (jobs && jobs.length > 0) {
    console.log('Last job pulled at:', jobs[0].created_at);
  } else {
    console.log('No jobs found in the database.');
  }
}

checkLastPull().catch(console.error);
