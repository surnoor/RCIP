import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: baseDocs, error: baseDocsError } = await supabase.from('base_documents').select('*');
  console.log('Base Docs:', baseDocs, 'Error:', baseDocsError);
}

checkData().catch(console.error);
