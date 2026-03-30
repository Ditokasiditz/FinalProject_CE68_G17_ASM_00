'use client'

import React, { useEffect, useState } from "react"
import { ChevronDown, X, Activity, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { API_BASE } from "@/lib/api"
import { ScoreGrade } from "@/components/score-grade"

interface Issue {
    id: number
    title: string
    factor: string
    severity: string
    impact: number | null
    status: string
    findingsCount: number
}

interface DashboardData {
    score: number
    grade: string
}

export default function IssuesPage() {
    const router = useRouter()
    const [issuesData, setIssuesData] = useState<Issue[]>([])
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [isScanning, setIsScanning] = useState(false)

    // Filter states
    const [selectedFactor, setSelectedFactor] = useState("All")
    const [selectedSeverity, setSelectedSeverity] = useState("All")
    
    // Column visibility states
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['Issue', 'Factor', 'Severity', 'Impact', 'Findings'])
    const [showColumnMenu, setShowColumnMenu] = useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)
  
        const fetchIssues = () => {
        fetch(`${API_BASE}/api/issues`)
            .then(res => res.json())
            .then((data: Issue[]) => setIssuesData(data))
            .catch(err => console.error(err))
    }

    const handleScanAll = async () => {
        if (isScanning) return
        setIsScanning(true)
        try {
            const res = await fetch(`${API_BASE}/api/scanner/run-all`, { method: 'POST' })
            if (!res.ok && res.status !== 202) throw new Error('Scan failed')
            // Don't auto-fetch here, the polling system inside useEffect handles completion!
        } catch (error) {
            console.error('Error running scan:', error)
            setIsScanning(false)
        }
    }

    
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setShowColumnMenu(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

        // Auto-polling the scanner endpoint globally
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/scanner/status`)
                const data = await res.json()
                
                setIsScanning((prev) => {
                    // if it WAS scanning but now is NOT scanning, trigger table refresh immediately!
                    if (prev && !data.isScanning) {
                        fetchIssues()
                    }
                    return data.isScanning
                })
            } catch (err) {
                console.error("Failed to check scanner status", err)
            }
        }
        
        // Initial dashboard & base issues grid fetches
        fetch(`${API_BASE}/api/dashboard/summary`)
            .then(r => r.json())
            .then(d => setDashboardData(d))
            .catch(e => console.error(e))
        fetchIssues()
        
        // Poll scanner status every 3 seconds
        checkStatus()
        const interval = setInterval(checkStatus, 3000)
        
        return () => clearInterval(interval)
    }, [])


    // Filter options derived dynamically from data
    const availableFactors = ["All", ...Array.from(new Set(issuesData.map(i => i.factor)))]
    const availableSeverities = ["All", ...Array.from(new Set(issuesData.map(i => i.severity)))]

    // Apply filters
    const filteredIssues = issuesData.filter(i => {
        if (selectedFactor !== "All" && i.factor !== selectedFactor) return false
        if (selectedSeverity !== "All" && i.severity !== selectedSeverity) return false
        return true
    })

    const grade = dashboardData ? dashboardData.grade : '-'

    return (
        <main className="flex-1 overflow-y-auto p-8 bg-muted/10">
            <div className="mx-auto max-w-6xl">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
                        <h2 className="text-4xl font-extrabold tracking-tight">Issues</h2>
                        
                        <div className="flex flex-col items-end">
                            <button 
                                onClick={handleScanAll}
                                disabled={isScanning}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isScanning ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Activity className="w-5 h-5" />
                                )}
                                {isScanning ? 'Scanning All Assets...' : 'Run Auto-Scan'}
                            </button>
                            <span className="text-[11px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
                                Find vulnerability of every asset
                            </span>
                        </div>
                    </div>


                    {/* Grade Summary Card Area */}
                    <div className="mb-10 max-w-sm">
                        <ScoreGrade score={dashboardData?.score ?? 0} grade={grade} />
                    </div>

                    <div className="flex items-end justify-between mb-6">
                        <div className="flex items-end gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Factor</label>
                                <select
                                    value={selectedFactor}
                                    onChange={(e) => setSelectedFactor(e.target.value)}
                                    className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    {availableFactors.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Severity</label>
                                <select
                                    value={selectedSeverity}
                                    onChange={(e) => setSelectedSeverity(e.target.value)}
                                    className="flex h-10 w-[200px] items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    {availableSeverities.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            {(selectedFactor !== "All" || selectedSeverity !== "All") && (
                                <button
                                    onClick={() => { setSelectedFactor("All"); setSelectedSeverity("All") }}
                                    className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-muted-foreground mr-4">
                                {filteredIssues.length} rows
                            </span>
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                                    className="flex items-center space-x-2 text-sm font-medium px-4 py-1.5 border border-input bg-background hover:bg-blue-600 hover:text-white rounded-md transition-colors shadow-sm"
                                >
                                    <span>Columns</span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                                {showColumnMenu && (
                                    <div className="absolute right-0 top-full pt-1 z-50">
                                        <div className="w-48 rounded-md border bg-white dark:bg-zinc-950 text-card-foreground shadow-xl p-2 opacity-100">
                                            {['Severity', 'Impact', 'Findings'].map(col => (
                                                <label key={col} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer transition-colors bg-white dark:bg-zinc-950">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col)}
                                                        onChange={() => {
                                                            if (visibleColumns.includes(col)) {
                                                                setVisibleColumns(visibleColumns.filter(c => c !== col))
                                                            } else {
                                                                setVisibleColumns([...visibleColumns, col])
                                                            }
                                                        }}
                                                        className="rounded border-primary text-primary"
                                                    />
                                                    <span className="text-sm font-medium">{col}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="shrink-0 rounded-md border border-[#d4d4d8] dark:border-zinc-700 bg-card shadow-sm overflow-hidden">
                        <Table className="border-collapse">
                            <TableHeader>
                                <TableRow className="bg-[#f9f9fb] dark:bg-[#27272a] border-b border-[#d4d4d8] dark:border-zinc-700 hover:bg-[#f9f9fb] dark:hover:bg-[#27272a]">
                                    {visibleColumns.includes('Issue') && <TableHead className="font-bold text-foreground">Issue</TableHead>}
                                    {visibleColumns.includes('Factor') && <TableHead className="font-bold text-foreground">Factor</TableHead>}
                                    {visibleColumns.includes('Severity') && <TableHead className="font-bold text-foreground">Severity</TableHead>}
                                    {visibleColumns.includes('Impact') && <TableHead className="font-bold text-foreground">Impact</TableHead>}
                                    {visibleColumns.includes('Findings') && <TableHead className="font-bold text-foreground">Findings</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredIssues.length > 0 ? filteredIssues.map((row, i) => (
                                    <TableRow key={row.id} className={`${i % 2 === 0 ? "bg-background" : "bg-muted/20"} border-b border-[#d4d4d8] dark:border-zinc-700/60 hover:bg-muted/30`}>
                                        {visibleColumns.includes('Issue') && <TableCell className="font-medium text-muted-foreground">{row.title}</TableCell>}
                                        {visibleColumns.includes('Factor') && <TableCell className="text-muted-foreground">{row.factor}</TableCell>}
                                        {visibleColumns.includes('Severity') && (
                                            <TableCell className="text-muted-foreground">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    row.severity === 'Critical' ? 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300' :
                                                    row.severity === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                    row.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                    {row.severity}
                                                </span>
                                            </TableCell>
                                        )}
                                        {visibleColumns.includes('Impact') && <TableCell className="text-muted-foreground">{row.impact ?? '—'}</TableCell>}
                                        {visibleColumns.includes('Findings') && (
                                            <TableCell>
                                                <button
                                                    onClick={() => router.push("/issues/" + encodeURIComponent(row.title))}
                                                    className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                                                >
                                                    {row.findingsCount}
                                                </button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No issues found matching your filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
            </div>
        </main>
    )
}
