'use client'

import React, { useEffect, useState } from "react"
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity } from "lucide-react"
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
        { title: "Dashboard", href: "/", icon: LayoutDashboard },
        { title: "Issues portfolio", href: "/issues", icon: ShieldAlert, isActive: true },
        { title: "Digital Footprint", href: "/assets", icon: Activity },
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

            <main className="flex-1 overflow-y-auto flex flex-col p-8 bg-muted/10">
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

                {/* Filters Row */}
                <div className="flex items-end gap-4 mb-6">
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
                    <button
                        onClick={() => { setSelectedFactor("All"); setSelectedSeverity("All") }}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-6 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700">
                        Clear
                    </button>
                </div>

                {/* Data Table */}
                <div className="rounded-md border bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-bold text-foreground">Issue</TableHead>
                                <TableHead className="font-bold text-foreground">Factor</TableHead>
                                <TableHead className="font-bold text-foreground">Severity</TableHead>
                                <TableHead className="font-bold text-foreground">Impact</TableHead>
                                <TableHead className="font-bold text-foreground">Findings</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIssues.length > 0 ? filteredIssues.map((row, i) => (
                                <TableRow key={row.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                    <TableCell className="font-medium text-muted-foreground">{row.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{row.factor}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.severity === 'Critical' || row.severity === 'High' ? 'bg-red-100 text-red-800' : row.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {row.severity}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{row.impact ?? '—'}</TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => router.push("/issues/" + encodeURIComponent(row.title))}
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                        >
                                            {row.findingsCount}
                                        </button>
                                    </TableCell>
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
            </main>
        </div>
    )
}
