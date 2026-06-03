"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Settings as SettingsIcon, FileText, Plus, Trash2, Play, CheckCircle2, Loader2, Globe, Sparkles } from "lucide-react"
import Link from 'next/link'

interface Source {
  id: string
  name: string
  url: string
  active: boolean
}

export default function ScraperSettingsPage() {
  const [keywords, setKeywords] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [sources, setSources] = useState<Source[]>([])
  
  const [newKeyword, setNewKeyword] = useState("")
  const [newCity, setNewCity] = useState("")
  
  // New source form state
  const [newSourceName, setNewSourceName] = useState("")
  const [newSourceUrl, setNewSourceUrl] = useState("")
  
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  
  // Scraper execution state
  const [scraping, setScraping] = useState(false)
  const [scrapeLog, setScrapeLog] = useState("")
  const [scrapeSuccess, setScrapeSuccess] = useState<boolean | null>(null)

  // Fetch initial config
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/scraper-settings')
        const data = await res.json()
        if (data && !data.error) {
          setKeywords(data.keywords || [])
          setCities(data.cities || [])
          setSources(data.sources || [])
        }
      } catch (e) {
        console.error('Failed to load scraper config:', e)
      }
    }
    fetchConfig()
  }, [])

  // Auto-save helper
  const saveConfig = async (updatedKeywords: string[], updatedCities: string[], updatedSources: Source[]) => {
    setSaving(true)
    setSaveStatus("Saving changes...")
    try {
      const res = await fetch('/api/scraper-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: updatedKeywords,
          cities: updatedCities,
          sources: updatedSources
        })
      })
      const data = await res.json()
      if (data.success) {
        setSaveStatus("All changes saved.")
        setTimeout(() => setSaveStatus(""), 2000)
      } else {
        setSaveStatus("Error saving changes")
      }
    } catch (e) {
      console.error(e)
      setSaveStatus("Error saving changes")
    } finally {
      setSaving(false)
    }
  }

  // Keywords management
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newKeyword.trim().toLowerCase()
    if (trimmed && !keywords.includes(trimmed)) {
      const updated = [...keywords, trimmed]
      setKeywords(updated)
      setNewKeyword("")
      saveConfig(updated, cities, sources)
    }
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const updated = keywords.filter(k => k !== keywordToRemove)
    setKeywords(updated)
    saveConfig(updated, cities, sources)
  }

  // Cities management
  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCity.trim().toLowerCase()
    if (trimmed && !cities.includes(trimmed)) {
      const updated = [...cities, trimmed]
      setCities(updated)
      setNewCity("")
      saveConfig(keywords, updated, sources)
    }
  }

  const handleRemoveCity = (cityToRemove: string) => {
    const updated = cities.filter(c => c !== cityToRemove)
    setCities(updated)
    saveConfig(keywords, updated, sources)
  }

  // Sources management
  const handleToggleSource = (sourceId: string) => {
    const updated = sources.map(s => {
      if (s.id === sourceId) {
        return { ...s, active: !s.active }
      }
      return s
    })
    setSources(updated)
    saveConfig(keywords, cities, updated)
  }

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newSourceName.trim()
    const url = newSourceUrl.trim()
    
    if (name && url) {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      if (sources.some(s => s.id === id)) {
        alert("A source with this name already exists.")
        return
      }
      
      const newSourceObj: Source = {
        id,
        name,
        url,
        active: true
      }
      
      const updated = [...sources, newSourceObj]
      setSources(updated)
      setNewSourceName("")
      setNewSourceUrl("")
      saveConfig(keywords, cities, updated)
    }
  }

  const handleRemoveSource = (sourceId: string) => {
    if (confirm("Are you sure you want to remove this source?")) {
      const updated = sources.filter(s => s.id !== sourceId)
      setSources(updated)
      saveConfig(keywords, cities, updated)
    }
  }

  // Scraper Trigger
  const triggerScrape = async () => {
    setScraping(true)
    setScrapeSuccess(null)
    setScrapeLog("Initializing Scraper child process...\nConnecting to WorkBC Jobs Board API...\nSearching for keywords and target cities...\nThis may take up to 15 seconds...\n\n")
    
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        setScrapeSuccess(true)
        setScrapeLog(prev => prev + `[SUCCESS] Scrape Executed Successfully!\n\nExecution Logs:\n${data.stdout}`)
      } else {
        setScrapeSuccess(false)
        setScrapeLog(prev => prev + `[ERROR] Scraper failed with error:\n${data.error}\n\nExecution Logs:\n${data.stdout}\n${data.stderr}`)
      }
    } catch (e: any) {
      setScrapeSuccess(false)
      setScrapeLog(prev => prev + `[FATAL] Network error triggering scraper: ${e.message}`)
    } finally {
      setScraping(false)
    }
  }

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
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors">
            <Briefcase className="w-4 h-4" />
            Jobs Queue
          </Link>
          <Link href="/test-ai" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors">
            <FileText className="w-4 h-4" />
            AI Sandbox
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium transition-colors">
            <SettingsIcon className="w-4 h-4" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
              <p className="text-slate-400 mt-2">Edit your scraper targets, keywords, and trigger runs.</p>
            </div>
            
            {/* Auto-save status */}
            {saveStatus && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full shadow-lg">
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="text-xs font-medium text-slate-300">{saveStatus}</span>
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Scraper Config Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Keywords Card */}
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Search Keywords</CardTitle>
                  <CardDescription className="text-slate-400">Manage job keywords targeted by the scraper.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddKeyword} className="flex gap-2">
                    <input 
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="e.g. administrative, receptionist..."
                      className="flex-1 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-4 py-2.5 rounded-lg text-sm transition-colors text-slate-200 placeholder:text-slate-550"
                    />
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {keywords.map(kw => (
                      <span 
                        key={kw} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      >
                        {kw}
                        <button 
                          onClick={() => handleRemoveKeyword(kw)} 
                          className="hover:text-rose-400 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {keywords.length === 0 && (
                      <span className="text-xs text-slate-500">No keywords added yet. Scraper will fetch all jobs.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Target Cities Card */}
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Target Cities (RCIP/RNIP Regions)</CardTitle>
                  <CardDescription className="text-slate-400">Jobs in these municipalities will be imported.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddCity} className="flex gap-2">
                    <input 
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="e.g. Vernon, Nelson, Trail..."
                      className="flex-1 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-4 py-2.5 rounded-lg text-sm transition-colors text-slate-200 placeholder:text-slate-550"
                    />
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/10"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </form>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {cities.map(ct => (
                      <span 
                        key={ct} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize"
                      >
                        {ct}
                        <button 
                          onClick={() => handleRemoveCity(ct)} 
                          className="hover:text-rose-400 transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {cities.length === 0 && (
                      <span className="text-xs text-slate-500">No target cities added. Scraper will match everything.</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scraper Output Console Card */}
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Scraper Output & Logs</CardTitle>
                    <CardDescription className="text-slate-400">View real-time or final execution results.</CardDescription>
                  </div>
                  {scrapeSuccess !== null && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${scrapeSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {scrapeSuccess ? 'Scrape Succeeded' : 'Scrape Failed'}
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-slate-950 border border-slate-850 rounded-lg p-5 font-mono text-xs text-slate-300 h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner shadow-black/40">
                      {scrapeLog || "Console idle. Click 'Trigger Scrape Now' to run a new scrape job."}
                    </pre>
                    {scraping && (
                      <div className="absolute inset-0 bg-slate-950/70 rounded-lg flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-xs text-indigo-400 animate-pulse font-medium">Scraping targeted sites...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Targeted Sources and Trigger Column */}
            <div className="space-y-8">
              
              {/* Trigger Scrape Card */}
              <Card className="bg-gradient-to-br from-indigo-950/30 to-slate-900 border-indigo-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Toggle Scraper Run
                  </CardTitle>
                  <CardDescription className="text-slate-300/80">Trigger a manual extraction job instantly using your custom inputs.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <button 
                    onClick={triggerScrape}
                    disabled={scraping || sources.filter(s => s.active).length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-indigo-600/35 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {scraping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    {scraping ? "Extracting Jobs..." : "Trigger Scrape Now"}
                  </button>
                </CardContent>
              </Card>

              {/* Targeted Sources Card */}
              <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg">Targeted Sources</CardTitle>
                  <CardDescription className="text-slate-400">Toggle or add sources to target.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Sources List */}
                  <div className="space-y-4">
                    {sources.map(src => (
                      <div 
                        key={src.id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/60 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm text-slate-200">{src.name}</span>
                          <a 
                            href={src.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                          >
                            <Globe className="w-3 h-3" /> {src.url}
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* Toggle Switch */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={src.active} 
                              onChange={() => handleToggleSource(src.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white peer-checked:after:border-indigo-500" />
                          </label>
                          
                          {/* Remove button for user-added sources (workbc is built-in, others can be custom) */}
                          {src.id !== 'workbc' && (
                            <button 
                              onClick={() => handleRemoveSource(src.id)} 
                              className="text-slate-550 hover:text-rose-400 transition-colors p-1"
                              title="Delete source"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Source Form */}
                  <div className="border-t border-slate-800/80 pt-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Add Custom Source</h4>
                    <form onSubmit={handleAddSource} className="space-y-3">
                      <div className="space-y-1">
                        <input 
                          type="text"
                          required
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          placeholder="Source Name (e.g. Glassdoor)"
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 rounded-lg text-sm transition-colors text-slate-200 placeholder:text-slate-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <input 
                          type="url"
                          required
                          value={newSourceUrl}
                          onChange={(e) => setNewSourceUrl(e.target.value)}
                          placeholder="Source URL (e.g. https://glassdoor.ca)"
                          className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-3.5 py-2.5 rounded-lg text-sm transition-colors text-slate-200 placeholder:text-slate-600"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Save Source
                      </button>
                    </form>
                  </div>

                </CardContent>
              </Card>

            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
