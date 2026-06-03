"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Send, FileText, Loader2, CheckCircle } from "lucide-react"
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function JobReviewClient({ job }: { job: any }) {
  const [resume, setResume] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [emailBody, setEmailBody] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const [status, setStatus] = useState("")

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [toEmail, setToEmail] = useState("")
  const [subject, setSubject] = useState("")

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
          jobTitle: job.title,
          companyName: job.company,
          baseResume: baseResumeText,
          baseCoverLetter: baseCoverLetterText
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate documents");
      }
      
      if (data.tailoredResume) setResume(data.tailoredResume)
      if (data.tailoredCoverLetter) setCoverLetter(data.tailoredCoverLetter)
      if (data.emailBody) setEmailBody(data.emailBody)
      
      setStatus("Documents generated successfully!")
      
      // Optionally save to applications table here
      await supabase.from('applications').insert({
        job_id: job.id,
        generated_resume: data.tailoredResume,
        generated_cover_letter: data.tailoredCoverLetter,
        status: 'pending_review'
      })

    } catch (e: any) {
      console.error(e)
      setStatus(`Error: ${e.message || "Failed to generate documents."}`)
    } finally {
      setLoading(false)
    }
  }

  const openDispatchDialog = () => {
    // Extract email from description
    const emailMatch = job.description?.match(/- \*\*Email:\*\* ([\w.-]+@[\w.-]+\.\w+)/) || job.description?.match(/[\w.-]+@[\w.-]+\.\w+/);
    const extractedEmail = emailMatch ? (emailMatch[1] || emailMatch[0]) : "";

    setToEmail(extractedEmail);
    setSubject(`Application for ${job.title} - ${job.company}`);
    setIsDialogOpen(true);
  }

  const confirmDispatch = async () => {
    setIsDialogOpen(false)
    setDispatching(true)
    setStatus("Dispatching via Gmail...")
    try {
      const res = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: toEmail,
          subject: subject,
          textBody: emailBody,
          applicantName: "Surnoor_Singh", // Or fetch from user profile
          resumeContent: resume,
          coverLetterContent: coverLetter
        })
      })
      
      if (res.ok) {
        setStatus("Application Sent Successfully!")
        await supabase.from('jobs').update({ status: 'applied' }).eq('id', job.id)
      } else {
        const errorData = await res.json()
        setStatus(`Error: ${errorData.error || 'Failed to dispatch application.'}`)
      }
    } catch (e) {
      console.error(e)
      setStatus("Error dispatching application.")
    } finally {
      setDispatching(false)
    }
  }

  const handlePreview = async (content: string, type: string) => {
    setPreviewing(type)
    try {
      const res = await fetch("/api/pdf-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })
      if (!res.ok) throw new Error("Failed to generate preview")
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch (e) {
      console.error(e)
      alert("Error generating PDF preview. Check console.")
    } finally {
      setPreviewing(null)
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
          onClick={openDispatchDialog}
          disabled={!resume || loading || dispatching}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Dispatch Application
        </button>
        {status && <span className="text-sm text-slate-400 ml-4 animate-pulse">{status}</span>}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Review Email Dispatch</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="toEmail" className="text-slate-300">To Email</Label>
              <Input
                id="toEmail"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
                placeholder="employer@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject" className="text-slate-300">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emailBody" className="text-slate-300">Email Body</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-200 min-h-[150px]"
                placeholder="Write your email body here..."
              />
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-sm text-slate-300 font-medium">Attachments Preview</span>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" onClick={() => handlePreview(resume, 'resume')} disabled={previewing === 'resume'} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                  {previewing === 'resume' ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <FileText className="w-3 h-3 mr-2 text-emerald-400" />}
                  Preview Resume.pdf
                </Button>
                {coverLetter && (
                  <Button variant="secondary" size="sm" onClick={() => handlePreview(coverLetter, 'coverLetter')} disabled={previewing === 'coverLetter'} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                    {previewing === 'coverLetter' ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <FileText className="w-3 h-3 mr-2 text-indigo-400" />}
                    Preview CoverLetter.pdf
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                * These PDFs will be generated exactly as previewed and attached automatically.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={confirmDispatch} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              Confirm & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Tailored Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap">
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
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto font-mono text-sm text-slate-300 whitespace-pre-wrap">
              {resume || "Click 'Re-Generate Documents' to write this based on your Base Profile."}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
