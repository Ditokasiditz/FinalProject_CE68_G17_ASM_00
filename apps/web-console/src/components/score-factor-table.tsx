import * as React from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface IssueDef {
  id: number
  title: string
  severity: "Critical" | "High" | "Medium" | "Low"
  impact: number
  findingsCount: number
}

export interface FactorDef {
  id: number
  title: string
  score: number
  impact: number
  findingsCount: number
  issues: {
    critical: number
    high: number
    medium: number
    low: number
  }
  nestedIssues: IssueDef[]
}

interface ScoreFactorTableProps {
  data: FactorDef[]
  visibleColumns?: string[]
}

const GradeIcon = ({ score }: { score: number }) => {
  let color = "text-green-500 border-green-500"
  let grade = "A"
  if (score < 60) {
    color = "text-red-500 border-red-500"
    grade = "F"
  } else if (score < 80) {
    color = "text-orange-500 border-orange-500"
    grade = "C"
  } else if (score < 90) {
    color = "text-yellow-500 border-yellow-500"
    grade = "B"
  }

  return (
    <div className={`flex items-center space-x-2`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded border-2 font-bold ${color}`}>
        {grade}
      </span>
      <span className="font-medium text-foreground">{score}</span>
    </div>
  )
}

const SeverityCounts = ({ counts }: { counts: { critical: number, high: number, medium: number, low: number } }) => {
  return (
    <div className="flex items-center space-x-2 text-xs font-semibold">
      {counts.critical > 0 && <span className="px-2 py-1 rounded-full bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300">Critical: {counts.critical}</span>}
      {counts.high > 0 && <span className="px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">High: {counts.high}</span>}
      {counts.medium > 0 && <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Medium: {counts.medium}</span>}
      {counts.low > 0 && <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Low: {counts.low}</span>}
      {(counts.critical === 0 && counts.high === 0 && counts.medium === 0 && counts.low === 0) && (
        <span className="text-muted-foreground font-normal text-sm">0 Issues</span>
      )}
    </div>
  )
}

const ImpactBadge = ({ impact }: { impact: number }) => {
  return (
    <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-500/20">
      ↘ {impact.toFixed(1)}
    </span>
  )
}

export function ScoreFactorTable({ data, visibleColumns = ['Factor', 'Score', 'Impact', 'Issues', 'Findings'] }: ScoreFactorTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set())
  const router = useRouter()

  const toggleRow = (id: number) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  const handleIssueClick = (title: string) => {
    // Navigate to issue detail page
    const encodedTitle = encodeURIComponent(title)
    router.push(`/issues/${encodedTitle}`)
  }

  return (
    <div className="rounded-md border border-[#d4d4d8] dark:border-zinc-700 bg-card overflow-hidden">
      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-[#f9f9fb] dark:bg-[#27272a] border-b border-[#d4d4d8] dark:border-zinc-700 hover:bg-[#f9f9fb] dark:hover:bg-[#27272a]">
            <TableHead className="w-[50px]"></TableHead>
            {visibleColumns.includes('Factor') && <TableHead className="font-semibold">Factor</TableHead>}
            {visibleColumns.includes('Score') && <TableHead className="font-semibold">Score</TableHead>}
            {visibleColumns.includes('Impact') && <TableHead className="font-semibold">Impact</TableHead>}
            {visibleColumns.includes('Issues') && <TableHead className="font-semibold">Issues</TableHead>}
            {visibleColumns.includes('Findings') && <TableHead className="font-semibold">Findings</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((factor) => (
            <React.Fragment key={factor.id}>
              <TableRow className="hover:bg-muted/30 group border-b border-[#d4d4d8] dark:border-zinc-700/60">
                <TableCell className="cursor-pointer" onClick={() => toggleRow(factor.id)}>
                  {expandedRows.has(factor.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                  )}
                </TableCell>
                {visibleColumns.includes('Factor') && <TableCell className="font-medium">{factor.title}</TableCell>}
                {visibleColumns.includes('Score') && <TableCell><GradeIcon score={factor.score} /></TableCell>}
                {visibleColumns.includes('Impact') && <TableCell><ImpactBadge impact={factor.impact} /></TableCell>}
                {visibleColumns.includes('Issues') && <TableCell><SeverityCounts counts={factor.issues} /></TableCell>}
                {visibleColumns.includes('Findings') && (
                  <TableCell className="text-muted-foreground">
                    {factor.findingsCount > 0 ? (
                      <span className="font-medium text-foreground">{factor.findingsCount}</span>
                    ) : (
                      factor.findingsCount
                    )}
                  </TableCell>
                )}
              </TableRow>
              
              {/* Expanded Nested Issues */}
              {expandedRows.has(factor.id) && factor.nestedIssues && factor.nestedIssues.length > 0 && (
                factor.nestedIssues.map((issue, index) => (
                  <TableRow key={issue.id} className={`bg-muted/10 hover:bg-muted/20 text-xs ${index === factor.nestedIssues.length - 1 ? 'border-b border-[#d4d4d8] dark:border-zinc-700/60' : 'border-0'}`}>
                    <TableCell className="relative border-0">
                      {/* Vertical line connecting from the chevron above */}
                      <div className={`absolute left-[24px] top-0 w-px bg-border/50 ${index === factor.nestedIssues.length - 1 ? 'h-1/2' : 'bottom-0'}`} />
                      {/* Horizontal branch to the item */}
                      <div className="absolute left-[24px] top-1/2 w-4 h-px bg-border/50" />
                    </TableCell>
                    {visibleColumns.includes('Factor') && (
                      <TableCell className="pl-10">
                        <span 
                          onClick={() => handleIssueClick(issue.title)}
                          className="cursor-pointer text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 hover:underline font-medium truncate"
                          title={issue.title}
                        >
                          {issue.title}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes('Score') && <TableCell></TableCell>}
                    {visibleColumns.includes('Impact') && (
                      <TableCell>
                        {issue.impact > 0 ? <ImpactBadge impact={issue.impact} /> : <span className="text-muted-foreground/50">-</span>}
                      </TableCell>
                    )}
                    {visibleColumns.includes('Issues') && (
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          issue.severity === 'Critical' ? 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-300' :
                          issue.severity === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          issue.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {issue.severity}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes('Findings') && (
                      <TableCell>
                        <span 
                          onClick={() => handleIssueClick(issue.title)}
                          className="cursor-pointer text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100 hover:underline font-medium"
                        >
                          {issue.findingsCount}
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </React.Fragment>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
