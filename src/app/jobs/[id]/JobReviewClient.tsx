"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Send, FileText, Loader2, CheckCircle } from "lucide-react"
import { supabase } from '@/lib/supabase'

export default function JobReviewClient({ job }: { job: any }) {
  const [resume, setResume] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [loading, setLoading] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [status, setStatus] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    setStatus("Fetching base documents...")
    
    try {
      // 1. Fetch the user's base resume from Supabase
      const { data: baseDocs, error } = await supabase.from('base_documents').select('*')
      let baseResumeText = "Administrative Professional with 5 years of experience."
      let baseCoverLetterText = "I am writing to apply for the administrative role."
      
      if (baseDocs && baseDocs.length > 0) {
        const r = baseDocs.find(d => d.type === 'resume')
        const c = baseDocs.find(d => d.type === 'cover_letter')
        if (r && r.content_json?.text) baseResumeText = r.content_json.text
        if (c && c.content_json?.text) baseCoverLetterText = c.content_json.text
      }

      setStatus("Generating with Gemini API...")
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: job.description,
          baseResume: baseResumeText,
          baseCoverLetter: baseCoverLetterText
        })
      })
      
      const data = await res.json()
      if (data.tailoredResume) setResume(data.tailoredResume)
      if (data.tailoredCoverLetter) setCoverLetter(data.tailoredCoverLetter)
      
      setStatus("Documents generated successfully!")
      
      // Optionally save to applications table here
      await supabase.from('applications').insert({
        job_id: job.id,
        generated_resume: data.tailoredResume,
        generated_cover_letter: data.tailoredCoverLetter,
        status: 'pending_review'
      })

    } catch (e) {
      console.error(e)
      setStatus("Error generating documents.")
    } finally {
      setLoading(false)
    }
  }

  const handleDispatch = async () => {
    setDispatching(true)
    setStatus("Dispatching via Resend...")
    try {
      // For testing, sending to onboarding@resend.dev. In production, we extract the email.
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: "onboarding@resend.dev", // Using Resend testing email
          subject: `Application for ${job.title} - ${job.company}`,
          textBody: "Please find my application attached.",
          applicantName: "Surnoor_Singh",
          resumeBuffer: { data: Buffer.from(resume).toJSON().data }, // In real scenario, PDF stream goes here
          coverLetterBuffer: coverLetter ? { data: Buffer.from(coverLetter).toJSON().data } : null
        })
      })
      
      if (res.ok) {
        setStatus("Application Sent Successfully!")
        await supabase.from('jobs').update({ status: 'applied' }).eq('id', job.id)
      } else {
        setStatus("Error dispatching application.")
      }
    } catch (e) {
      console.error(e)
      setStatus("Error dispatching application.")
    } finally {
      setDispatching(false)
    }
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={handleGenerate}
          disabled={loading || dispatching}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors border border-slate-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
          Re-Generate Documents
        </button>
        <button 
          onClick={handleDispatch}
          disabled={!resume || loading || dispatching}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Dispatch Application
        </button>
        {status && <span className="text-sm text-slate-400 ml-4 animate-pulse">{status}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Tailored Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm text-slate-300">
              {coverLetter || "Click 'Re-Generate Documents' to write this based on your Base Profile."}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Tailored Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm text-slate-300">
              {resume || "Click 'Re-Generate Documents' to write this based on your Base Profile."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
