'use client'

import React, { useEffect, useState } from "react"
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, ShieldCheck } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { ScoreGrade } from "@/components/score-grade"
import { FactorBreakdown } from "@/components/factor-breakdown"
import { SeverityPieChart } from "@/components/severity-pie-chart"

interface Factor {
  title: string
  score: number
  issueCount: number
}

interface DashboardData {
  score: number
  grade: string
  factors: Factor[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3001/api/dashboard/summary')
      .then(res => res.json())
      .then(dashboardData => {
        setData(dashboardData)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching dashboard data', error)
        setLoading(false)
      })
  }, [])

  const navigations = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard, isActive: true },
    { title: "Score Factor", href: "/score-factor", icon: ShieldCheck },
    { title: "Issues portfolio", href: "/issues", icon: ShieldAlert },
    { title: "Digital Footprint", href: "/assets", icon: Activity },
    { title: "Team", href: "/team", icon: Users },
    { title: "Settings", href: "/settings", icon: Settings },
  ]

  if (loading || !data) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar navigations={navigations} />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-8 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navigations={navigations} />

      <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attack Surface Summary</h1>
            <p className="text-muted-foreground mt-2">
              Continuous monitoring of your external attack surface and threat landscape.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ScoreGrade score={data.score} grade={data.grade} />
            <SeverityPieChart />
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 tracking-tight text-foreground/80">Factor Breakdown</h2>
            <FactorBreakdown factorData={data.factors} />
          </div>
        </div>
      </main>
    </div>
  )
}
