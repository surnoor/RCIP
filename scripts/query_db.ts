import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: locations, error: locError } = await supabase.from('locations').select('*');
  console.log('Locations:', locations, 'Error:', locError);

  const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*');
  console.log('Jobs:', jobs, 'Error:', jobsError);
}

checkData().catch(console.error);
