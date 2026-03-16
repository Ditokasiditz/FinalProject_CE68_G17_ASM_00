'use client'

import React, { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SeverityData {
  level: string
  count: number
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High:     '#f97316',
  Medium:   '#facc15',
  Low:      '#3b82f6',
}

interface CustomLegendPayload {
  color: string
  value: string
}

const LEGEND_ORDER = ['Critical', 'High', 'Medium', 'Low']

function CustomLegend({ payload }: { payload?: CustomLegendPayload[] }) {
  if (!payload) return null
  const sorted = [...payload].sort(
    (a, b) => LEGEND_ORDER.indexOf(a.value) - LEGEND_ORDER.indexOf(b.value)
  )
  return (
    <ul className="flex flex-col justify-center gap-3 pl-4">
      {sorted.map((entry, index) => (
        <li key={index} className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-foreground/80">{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-lg border bg-white dark:bg-zinc-900 px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground">{value} device{value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export function SeverityPieChart() {
  const [data, setData] = useState<SeverityData[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('http://localhost:3001/api/issues/severity')
      .then(res => res.json())
      .then((result: SeverityData[]) => {
        setData(result)
        setTotal(result.reduce((sum: number, d: SeverityData) => sum + d.count, 0))
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching severity data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="h-52 bg-muted rounded-lg" />
      </div>
    )
  }

  const hasData = data.some(d => d.count > 0)

  return (
    <Card className="overflow-hidden border-2 border-zinc-500/20 bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Vulnerability</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {total} total finding{total !== 1 ? 's' : ''} by severity
        </p>
      </CardHeader>

      <CardContent className="mt-4 h-56">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="40%"
                cy="50%"
                innerRadius={0}
                outerRadius={85}
                paddingAngle={1}
                dataKey="count"
                nameKey="level"
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.level}
                    fill={SEVERITY_COLORS[entry.level] ?? '#94a3b8'}
                  />
                ))}
              </Pie>

              <Tooltip content={<CustomTooltip />} />

              <Legend
                content={({ payload }) => (
                  <CustomLegend payload={payload as CustomLegendPayload[]} />
                )}
                layout="vertical"
                verticalAlign="middle"
                align="right"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No issues found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
