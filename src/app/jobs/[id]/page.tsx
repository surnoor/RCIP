import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, MapPin, ArrowLeft } from "lucide-react"
import Link from 'next/link'
import JobReviewClient from './JobReviewClient'

export default async function JobReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  // Fetch job details
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !job) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-8 lg:p-12 relative overflow-hidden">
      
      {/* Glow */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-slate-400">
              <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {job.company}</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Job Details Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl h-full">
              <CardHeader>
                <CardTitle className="text-lg">Job Description</CardTitle>
                <CardDescription>Requirements and duties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm text-slate-300">
                  <p>{job.description || "No detailed description provided by the scraper."}</p>
                </div>
                <div className="mt-8">
                  <a href={job.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline text-sm font-medium">
                    View Original Posting &rarr;
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Documents Column (Client Component) */}
          <div className="lg:col-span-2">
            <JobReviewClient job={job} />
          </div>

        </div>
      </div>
    </div>
  )
}
