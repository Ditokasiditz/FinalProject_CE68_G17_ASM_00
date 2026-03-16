'use client'

import React, { useEffect, useState } from "react"
import { ShieldAlert, LayoutDashboard, Activity, Users, Settings, ShieldCheck, ChevronDown } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { ScoreFactorTable, FactorDef } from "@/components/score-factor-table"
import { ScoreGrade } from "@/components/score-grade"

export default function ScoreFactorPage() {
  const [data, setData] = useState<FactorDef[]>([])
  const [dashboardData, setDashboardData] = useState<{ score: number, grade: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['Factor', 'Score', 'Impact', 'Issues', 'Findings'])
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
    fetch('http://localhost:3001/api/factors')
      .then(res => res.json())
      .then((factors: FactorDef[]) => {
        setData(factors)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching factors data', error)
        setLoading(false)
      })

    fetch('http://localhost:3001/api/dashboard/summary')
      .then(res => res.json())
      .then(dashboardData => {
        setDashboardData(dashboardData)
      })
      .catch(error => console.error('Error fetching dashboard summary', error))
  }, [])

  const navigations = [
    { title: "Dashboard", href: "/", icon: LayoutDashboard },
    { title: "Score Factor", href: "/score-factor", icon: ShieldCheck, isActive: true },
    { title: "Issues portfolio", href: "/issues", icon: ShieldAlert },
    { title: "Digital Footprint", href: "/assets", icon: Activity },
    { title: "Team", href: "/team", icon: Users },
    { title: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navigations={navigations} />

      <main className="flex-1 overflow-y-auto bg-muted/10 p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Score Factor</h1>
              <p className="text-muted-foreground mt-2">
                Detailed breakdown of factors and their associated issues.
              </p>
            </div>
          </div>

          {dashboardData && (
            <div className="grid gap-6 md:grid-cols-2">
              <ScoreGrade score={dashboardData.score} grade={dashboardData.grade} />
            </div>
          )}

          {loading ? (
            <div className="h-64 flex items-center justify-center border rounded-md bg-card animate-pulse">
              <p className="text-muted-foreground">Loading factors...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-end space-x-4">
                <span className="text-sm font-medium text-muted-foreground mr-4">
                  {data.length} rows
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
                        {['Score', 'Impact', 'Issues', 'Findings'].map(col => (
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
              <ScoreFactorTable data={data} visibleColumns={visibleColumns} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
