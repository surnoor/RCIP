import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Delete all jobs. Supabase requires a filter for delete(), so we use inq or not.is.null
    const { error } = await supabase
      .from('jobs')
      .delete()
      .not('id', 'is', null);

    if (error) {
      console.error('Error clearing jobs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'All jobs cleared successfully.' });
  } catch (error: any) {
    console.error('API /api/jobs/clear error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
