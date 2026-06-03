"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2 } from "lucide-react"

export default function TestAIPage() {
  const [jobDesc, setJobDesc] = useState("")
  const [baseResume, setBaseResume] = useState("")
  const [baseCoverLetter, setBaseCoverLetter] = useState("")
  const [resultResume, setResultResume] = useState("")
  const [resultCoverLetter, setResultCoverLetter] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jobDesc,
          baseResume: baseResume,
          baseCoverLetter: baseCoverLetter
        })
      })
      
      const data = await res.json()
      if (data.tailoredResume) setResultResume(data.tailoredResume)
      if (data.tailoredCoverLetter) setResultCoverLetter(data.tailoredCoverLetter)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 lg:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <header>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-lg">
              <Sparkles className="text-indigo-400 w-6 h-6" />
            </div>
            AI Tailoring Sandbox
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Paste a job description and your base documents to test the Gemini generation.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
              <CardHeader>
                <CardTitle>Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-slate-300">Job Description</Label>
                  <Textarea 
                    className="h-32 bg-slate-950/50 border-slate-700 text-slate-200 focus:border-indigo-500 transition-colors" 
                    placeholder="Paste the job requirements here..."
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Base Resume (Markdown or Text)</Label>
                  <Textarea 
                    className="h-32 bg-slate-950/50 border-slate-700 text-slate-200 focus:border-indigo-500 transition-colors" 
                    placeholder="Paste your base resume here..."
                    value={baseResume}
                    onChange={(e) => setBaseResume(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Base Cover Letter (Optional)</Label>
                  <Textarea 
                    className="h-32 bg-slate-950/50 border-slate-700 text-slate-200 focus:border-indigo-500 transition-colors" 
                    placeholder="Paste your base cover letter here..."
                    value={baseCoverLetter}
                    onChange={(e) => setBaseCoverLetter(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={loading || !jobDesc || !baseResume}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  {loading ? "Generating Magic..." : "Generate Tailored Documents"}
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl h-full">
              <CardHeader>
                <CardTitle>Outputs</CardTitle>
                <CardDescription className="text-slate-400">Tailored Markdown ready for PDF compilation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label className="text-indigo-400 font-medium">Tailored Resume</Label>
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg h-64 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-slate-300 shadow-inner">
                    {resultResume || "Output will appear here..."}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-400 font-medium">Tailored Cover Letter</Label>
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg h-64 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-slate-300 shadow-inner">
                    {resultCoverLetter || "Output will appear here..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
