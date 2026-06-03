import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase, Settings, FileText } from "lucide-react"
import Link from 'next/link'
import BulkApplyButton from '@/components/BulkApplyButton'
import WebFormActionButtons from '@/components/WebFormActionButtons'
import ClearJobsButton from '@/components/ClearJobsButton'

// Set this page to dynamically render so it fetches fresh data on load
export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });

  const totalScraped = jobs?.length || 0;
  
  // Categorize jobs
  const emailJobs = jobs?.filter(j => j.status === 'new') || [];
  const webFormJobs = jobs?.filter(j => j.status === 'web_form') || [];
  const appliedJobs = jobs?.filter(j => j.status === 'applied') || [];
  const successfullyApplied = appliedJobs.length;
  
  const emailJobIds = emailJobs.map(j => j.id);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/60 bg-slate-900/50 backdrop-blur-xl p-6 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
            RCIP Tracker
          </h1>
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium transition-colors">
            <Briefcase className="w-4 h-4" />
            Jobs Queue
          </Link>
          <Link href="/test-ai" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors">
            <FileText className="w-4 h-4" />
            AI Sandbox
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 relative overflow-hidden overflow-y-auto">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          <header>
            <h2 className="text-3xl font-bold tracking-tight">Job Queue</h2>
            <p className="text-slate-400 mt-2">Manage your RCIP administrative job applications.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Total Scraped</CardDescription>
                <CardTitle className="text-4xl text-slate-50">{totalScraped}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Email Queue</CardDescription>
                <CardTitle className="text-4xl text-amber-400">{emailJobs.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Web Form Queue</CardDescription>
                <CardTitle className="text-4xl text-orange-400">{webFormJobs.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="text-slate-400">Applied</CardDescription>
                <CardTitle className="text-4xl text-emerald-400">{successfullyApplied}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Email Applications Queue */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-xl">
              <CardHeader className="flex flex-row items-start sm:items-center justify-between">
                <div>
                  <CardTitle>Email Queue</CardTitle>
                  <CardDescription className="text-slate-400 mt-1">Jobs accepting email applications.</CardDescription>
                </div>
                <BulkApplyButton jobIds={emailJobIds} />
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <Table>
                    <TableHeader className="border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                      <TableRow className="hover:bg-transparent border-slate-800">
                        <TableHead className="text-slate-400">Role & Company</TableHead>
                        <TableHead className="text-slate-400">Location</TableHead>
                        <TableHead className="text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailJobs.length > 0 ? emailJobs.map((job) => (
                        <TableRow key={job.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <TableCell className="py-3">
                            <div className="font-medium text-slate-200">{job.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{job.company}</div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">{job.location}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                              Review
                            </Link>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                            Queue is empty.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Web Form Applications Queue */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Web Form Queue</CardTitle>
                <CardDescription className="text-slate-400 mt-1">Jobs requiring manual website application.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  <Table>
                    <TableHeader className="border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                      <TableRow className="hover:bg-transparent border-slate-800">
                        <TableHead className="text-slate-400">Role & Company</TableHead>
                        <TableHead className="text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webFormJobs.length > 0 ? webFormJobs.map((job) => (
                        <TableRow key={job.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <TableCell className="py-3">
                            <div className="font-medium text-slate-200">{job.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{job.company} • {job.location}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <WebFormActionButtons jobId={job.id} url={job.url} />
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                            Queue is empty.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applied Applications Queue */}
          <div className="pt-8">
            <Card className="bg-slate-900/60 border-slate-800 shadow-2xl backdrop-blur-xl opacity-80 hover:opacity-100 transition-opacity">
              <CardHeader>
                <CardTitle className="text-emerald-400">Completed Applications</CardTitle>
                <CardDescription className="text-slate-400 mt-1">Review and re-send your successfully applied jobs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <Table>
                    <TableHeader className="border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
                      <TableRow className="hover:bg-transparent border-slate-800">
                        <TableHead className="text-slate-400">Role & Company</TableHead>
                        <TableHead className="text-slate-400">Location</TableHead>
                        <TableHead className="text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appliedJobs.length > 0 ? appliedJobs.map((job) => (
                        <TableRow key={job.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <TableCell className="py-3">
                            <div className="font-medium text-slate-200">{job.title}</div>
                            <div className="text-xs text-slate-500 mt-1">{job.company}</div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">{job.location}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/jobs/${job.id}`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                              Review Again
                            </Link>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                            No applied jobs yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  )
}
