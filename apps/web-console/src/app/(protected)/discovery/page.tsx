'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  Search, Download, Copy, CheckCheck,
  Globe, Layers, AlertTriangle, Loader2, X
} from 'lucide-react'
import { API_BASE } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SubdomainRecord {
  domain: string
}

interface DiscoveryResult {
  domain: string
  total: number
  subdomains: SubdomainRecord[]
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function DiscoveryPage() {
  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [filter, setFilter] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* ------------------------------------------------------------------ */
  /*  Core fetch logic                                                     */
  /* ------------------------------------------------------------------ */
  const handleDiscover = useCallback(async () => {
    const domain = inputValue.trim()
    if (!domain) return

    setStatus('loading')
    setResult(null)
    setErrorMsg('')
    setFilter('')

    try {
      const res = await fetch(`${API_BASE}/api/discovery/subdomains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}`)
      }

      setResult(data as DiscoveryResult)
      setStatus('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setErrorMsg(message)
      setStatus('error')
    }
  }, [inputValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDiscover()
  }

  /* ------------------------------------------------------------------ */
  /*  Copy helper                                                          */
  /* ------------------------------------------------------------------ */
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 1800)
  }

  /* ------------------------------------------------------------------ */
  /*  Export .txt                                                          */
  /* ------------------------------------------------------------------ */
  const handleExport = () => {
    if (!result) return
    const content = result.subdomains.map(s => s.domain).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${result.domain}_subdomains.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ------------------------------------------------------------------ */
  /*  Filtered view                                                        */
  /* ------------------------------------------------------------------ */
  const filtered = result
    ? result.subdomains.filter(s =>
        filter === '' || s.domain.toLowerCase().includes(filter.toLowerCase())
      )
    : []

  /* ------------------------------------------------------------------ */
  /*  Render                                                               */
  /* ------------------------------------------------------------------ */
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative bg-gradient-to-br from-[#050B35] via-[#0B1247] to-[#1a188b] min-h-screen">
      {/* Ambient glow blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#1a188b]/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-5xl space-y-10 relative z-10">

        {/* ── Header ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Reconnaissance
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Domain Discovery
          </h1>
          <p className="text-white/50 mt-2 max-w-2xl">
            Enumerate subdomains of any organization by entering its root domain.
            Powered by WhoisXML Subdomain Lookup API.
          </p>
        </div>

        {/* ── Search card ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
          <label htmlFor="domain-input" className="block text-sm font-semibold text-white/70 mb-3">
            Target Domain
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="domain-input"
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. kmitl.ac.th"
                disabled={status === 'loading'}
                className={cn(
                  'w-full pl-11 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/20 text-sm font-mono',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
                  'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                  'border-white/10'
                )}
              />
            </div>
            <button
              id="discover-btn"
              onClick={handleDiscover}
              disabled={status === 'loading' || !inputValue.trim()}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all',
                'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20',
                'hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600'
              )}
            >
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Discover
            </button>
          </div>

          {/* Hint strip */}
          <p className="mt-3 text-xs text-white/30 font-mono">
            Tip: enter the root domain only — no <span className="text-white/50">http://</span> or paths.
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">Enter</kbd> to search.
          </p>
        </div>

        {/* ── Loading state ── */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
              <Layers className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="text-white/80 font-semibold text-lg">Scanning subdomains…</p>
              <p className="text-white/40 text-sm mt-1">
                Querying WhoisXML for <span className="text-cyan-400 font-mono">{inputValue.trim()}</span>
              </p>
              <p className="text-white/30 text-xs mt-2 animate-pulse">
                Large organisations may take a moment
              </p>
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {status === 'error' && (
          <div className="flex items-start gap-4 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl backdrop-blur-md">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-red-400 font-semibold mb-1">Discovery failed</p>
              <p className="text-red-400/70 text-sm font-mono">{errorMsg}</p>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {status === 'success' && result && (
          <div className="space-y-4">

            {/* Stats row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white/90">
                  Results for{' '}
                  <span className="text-cyan-400 font-mono">{result.domain}</span>
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
                  {result.total} found
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    id="filter-input"
                    type="text"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="Filter results…"
                    className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder-white/20 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/40 w-44"
                  />
                </div>

                {/* Copy all */}
                <button
                  id="copy-all-btn"
                  onClick={() => handleCopy(result.subdomains.map(s => s.domain).join('\n'))}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-xs font-medium transition-all"
                >
                  {copied === result.subdomains.map(s => s.domain).join('\n') ? (
                    <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  Copy all
                </button>

                {/* Export */}
                <button
                  id="export-btn"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 text-xs font-medium transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .txt
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#0B1247]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-white/5 bg-white/5 backdrop-blur-md">
                      <th className="px-6 py-3 text-xs font-bold text-white/40 uppercase tracking-wider w-12">#</th>
                      <th className="px-6 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Subdomain</th>
                      <th className="px-6 py-3 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-white/40 italic">
                          {filter
                            ? `No subdomains match "${filter}"`
                            : 'No subdomains found for this domain.'}
                        </td>
                      </tr>
                    ) : (
                      filtered.map((sub, idx) => (
                        <tr
                          key={sub.domain}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-3 text-white/20 text-xs font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-6 py-3">
                            <span className="text-sm text-white/80 font-mono group-hover:text-cyan-300 transition-colors">
                              {sub.domain}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleCopy(sub.domain)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/0 hover:bg-white/10 text-white/30 hover:text-white/80 transition-all text-xs"
                              title="Copy to clipboard"
                            >
                              {copied === sub.domain ? (
                                <CheckCheck className="w-3.5 h-3.5 text-green-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer count */}
              <div className="px-6 py-3 border-t border-white/5 bg-white/3 flex items-center justify-between">
                <span className="text-xs text-white/30">
                  Showing <span className="text-white/60 font-semibold">{filtered.length}</span> of{' '}
                  <span className="text-white/60 font-semibold">{result.total}</span> subdomains
                </span>
                <span className="text-xs text-white/20 font-mono">
                  Source: WhoisXML API
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ── Idle placeholder ── */}
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
              <Search className="w-9 h-9 text-white/20" />
            </div>
            <p className="text-white/40 text-sm">
              Enter a root domain above to start enumerating its subdomains.
            </p>
            <div className="flex items-center gap-2 mt-2">
              {['kmitl.ac.th', 'google.com', 'github.com'].map(d => (
                <button
                  key={d}
                  onClick={() => setInputValue(d)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 text-xs font-mono transition-all"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
