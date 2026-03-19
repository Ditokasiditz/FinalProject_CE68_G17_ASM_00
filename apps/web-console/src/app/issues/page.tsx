'use client'

import React, { useEffect, useState } from "react"
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, ShieldCheck, ChevronDown, X } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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

    // Filter states
    const [selectedFactor, setSelectedFactor] = useState("All")
    const [selectedSeverity, setSelectedSeverity] = useState("All")
    
    // Column visibility states
    const [visibleColumns, setVisibleColumns] = useState<string[]>(['Issue', 'Factor', 'Severity', 'Impact', 'Findings'])
    const [showColumnMenu, setShowColumnMenu] = useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)
  
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

    useEffect(() => {
        // Fetch dashboard summary for the Score and Grade
        fetch('http://localhost:3001/api/dashboard/summary')
            .then(res => res.json())
            .then(data => setDashboardData(data))
            .catch(err => console.error(err))

        // Fetch issues
        fetch('http://localhost:3001/api/issues')
            .then(res => res.json())
            .then((data: Issue[]) => setIssuesData(data))
            .catch(err => console.error(err))
    }, [])

    const navigations = [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Score Factor", href: "/score-factor", icon: ShieldCheck },
        { title: "Issues portfolio", href: "/issues", icon: ShieldAlert, isActive: true },
        { title: "Digital Footprint", href: "/digital-footprint", icon: Activity },
        { title: "Team", href: "/team", icon: Users },
        { title: "Settings", href: "/settings", icon: Settings },
    ]

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
    let colorClass = "text-muted-foreground"
    let bgClass = "bg-muted/10"
    let borderClass = "border-muted/20"

    if (grade === 'A' || grade === 'B') {
        colorClass = "text-green-500"
        bgClass = "bg-green-500/10"
        borderClass = "border-green-500/20"
    } else if (grade === 'C') {
        colorClass = "text-yellow-500"
        bgClass = "bg-yellow-500/10"
        borderClass = "border-yellow-500/20"
    } else if (grade === 'D' || grade === 'F') {
        colorClass = "text-red-500"
        bgClass = "bg-red-500/10"
        borderClass = "border-red-500/20"
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar navigations={navigations} />

            <main className="flex-1 overflow-y-auto p-8 bg-muted/10">
                <div className="mx-auto max-w-6xl">
                <h2 className="text-4xl font-extrabold tracking-tight mb-8 mt-2">Issues</h2>

                {/* Grade Summary Card Area */}
                <div className="flex items-center gap-6 mb-10">
                    <div className={cn("flex items-center justify-center w-16 h-16 rounded-full border-4 shadow-sm", bgClass, borderClass)}>
                        <span className={cn("text-3xl font-bold", colorClass)}>{grade}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-light text-muted-foreground">{dashboardData ? dashboardData.score : '--'}</span>
                    </div>
                    <div className="flex flex-col ml-2">
                        <span className="text-xl font-bold">Demo Organization</span>
                        <span className="text-sm text-muted-foreground">demo.example.com</span>
                    </div>
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
                <div className="shrink-0 rounded-md border border-[#d4d4d8] bg-card shadow-sm overflow-hidden">
                    <Table className="border-collapse">
                        <TableHeader>
                            <TableRow className="bg-[#f9f9fb] border-b-[#d4d4d8] hover:bg-[#f9f9fb]">
                                {visibleColumns.includes('Issue') && <TableHead className="font-bold text-foreground">Issue</TableHead>}
                                {visibleColumns.includes('Factor') && <TableHead className="font-bold text-foreground">Factor</TableHead>}
                                {visibleColumns.includes('Severity') && <TableHead className="font-bold text-foreground">Severity</TableHead>}
                                {visibleColumns.includes('Impact') && <TableHead className="font-bold text-foreground">Impact</TableHead>}
                                {visibleColumns.includes('Findings') && <TableHead className="font-bold text-foreground">Findings</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIssues.length > 0 ? filteredIssues.map((row, i) => (
                                <TableRow key={row.id} className={`${i % 2 === 0 ? "bg-background" : "bg-muted/20"} border-b-[#d4d4d8] hover:bg-muted/30`}>
                                    {visibleColumns.includes('Issue') && <TableCell className="font-medium text-muted-foreground">{row.title}</TableCell>}
                                    {visibleColumns.includes('Factor') && <TableCell className="text-muted-foreground">{row.factor}</TableCell>}
                                    {visibleColumns.includes('Severity') && (
                                        <TableCell className="text-muted-foreground">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.severity === 'Critical' || row.severity === 'High' ? 'bg-red-100 text-red-800' : row.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {row.severity}
                                            </span>
                                        </TableCell>
                                    )}
                                    {visibleColumns.includes('Impact') && <TableCell className="text-muted-foreground">{row.impact ?? '—'}</TableCell>}
                                    {visibleColumns.includes('Findings') && (
                                        <TableCell>
                                            <button
                                                onClick={() => router.push("/issues/" + encodeURIComponent(row.title))}
                                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
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
        </div>
    )
}
