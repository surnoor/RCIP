-- Create jobs table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  url TEXT UNIQUE,
  status TEXT DEFAULT 'new', -- 'new', 'tailoring', 'applied', 'rejected', 'web_form'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW())
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  tags TEXT[]
);

-- Create base_documents table
CREATE TABLE public.base_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'resume', 'cover_letter'
  content_json JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW())
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  generated_resume TEXT,
  generated_cover_letter TEXT,
  status TEXT DEFAULT 'pending_review', -- 'pending_review', 'sent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, NOW())
);

-- Enable Row Level Security (we will just allow all for now since it's a personal app, but good practice to enable)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for anon/authenticated access
CREATE POLICY "Allow all access to jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to base_documents" ON public.base_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
