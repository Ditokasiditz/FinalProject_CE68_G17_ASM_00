'use client'

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, ArrowLeft, Tag, MessageSquare, X, Loader2 } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const API = 'http://localhost:3001'
const MAX_COMMENT = 500

interface FindingAsset {
    assetId: number
    hostname: string
    ipAddress: string | null
    type: string
    isExposed: boolean
    status: string
    lastObserved: string
    comment: string | null
}

interface IssueDetail {
    id: number
    title: string
    description: string | null
    severity: string
    impact: number | null
    factor: string
    findingsCount: number
    findings: FindingAsset[]
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SEVERITY_COLORS: Record<string, string> = {
    Critical: "bg-red-100 text-red-800",
    High: "bg-orange-100 text-orange-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-blue-100 text-blue-800",
}

// ─── Comment Popup ────────────────────────────────────────────────────────────
function CommentPopup({
    issueId,
    assetId,
    comment,
    onSave,
    onDiscard,
    onRemove,
}: {
    issueId: string
    assetId: number
    comment: string
    onSave: (text: string) => void
    onDiscard: () => void
    onRemove: () => void
}) {
    const [text, setText] = useState(comment)
    const [saving, setSaving] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => { textareaRef.current?.focus() }, [])

    async function patchComment(value: string | null) {
        await fetch(`${API}/api/issues/${issueId}/findings/${assetId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: value }),
        })
    }

    async function handleSave() {
        setSaving(true)
        await patchComment(text.trim() || null)
        setSaving(false)
        onSave(text.trim())
    }

    async function handleRemove() {
        setSaving(true)
        await patchComment(null)
        setSaving(false)
        onRemove()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onDiscard}
        >
            <div
                className="relative bg-white dark:bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-base font-semibold text-foreground">Comment on finding</h2>
                    <button
                        onClick={onDiscard}
                        className="text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Textarea */}
                <div className="px-5 pb-2">
                    <div className="relative">
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value.slice(0, MAX_COMMENT))}
                            placeholder="Add your comment here..."
                            rows={4}
                            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground select-none">
                            {MAX_COMMENT - text.length}
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        You can write comments here — use it to make a review note, track progress, flag for follow-up, or leave any relevant observations.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4">
                    <button
                        onClick={handleRemove}
                        disabled={saving}
                        className="text-sm text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                        Remove
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onDiscard}
                            disabled={saving}
                            className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                        >
                            Discard Changes
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || text.trim() === comment.trim()}
                            className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IssueFindingsPage() {
    const params = useParams()
    const router = useRouter()
    const issueName = decodeURIComponent(params.issueName as string)

    const [issue, setIssue] = useState<IssueDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Map from assetId → saved comment text (seeded from API, updated on Save/Remove)
    const [comments, setComments] = useState<Record<number, string>>({})
    const [activeCommentAssetId, setActiveCommentAssetId] = useState<number | null>(null)

    useEffect(() => {
        if (!issueName) return
        fetch(`${API}/api/issues/by-name/${encodeURIComponent(issueName)}`)
            .then(res => {
                if (!res.ok) throw new Error('Issue not found')
                return res.json()
            })
            .then((data: IssueDetail) => {
                setIssue(data)
                // Seed comment state from DB
                const initial: Record<number, string> = {}
                data.findings.forEach(f => { if (f.comment) initial[f.assetId] = f.comment })
                setComments(initial)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError('Failed to load issue details.')
                setLoading(false)
            })
    }, [issueName])

    const navigations = [
        { title: "Dashboard", href: "/", icon: LayoutDashboard },
        { title: "Issues portfolio", href: "/issues", icon: ShieldAlert, isActive: true },
        { title: "Digital Footprint", href: "/assets", icon: Activity },
        { title: "Team", href: "/team", icon: Users },
        { title: "Settings", href: "/settings", icon: Settings },
    ]

    const activeAsset = issue?.findings.find(f => f.assetId === activeCommentAssetId) ?? null

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar navigations={navigations} />

            {/* Comment popup */}
            {activeCommentAssetId !== null && activeAsset && issue && (
                <CommentPopup
                    issueId={issue.id.toString()}
                    assetId={activeCommentAssetId}
                    comment={comments[activeCommentAssetId] ?? ''}
                    onSave={(text) => {
                        setComments(prev => ({ ...prev, [activeCommentAssetId]: text }))
                        setActiveCommentAssetId(null)
                    }}
                    onDiscard={() => setActiveCommentAssetId(null)}
                    onRemove={() => {
                        setComments(prev => {
                            const next = { ...prev }
                            delete next[activeCommentAssetId]
                            return next
                        })
                        setActiveCommentAssetId(null)
                    }}
                />
            )}

            <main className="flex-1 overflow-y-auto flex flex-col p-8 bg-muted/10">
                {/* Back button */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Issues
                </button>

                {loading ? (
                    <p className="text-muted-foreground animate-pulse">Loading...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : issue ? (
                    <>
                        {/* Issue Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold tracking-tight">{issue.title}</h1>
                                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", SEVERITY_COLORS[issue.severity] ?? "bg-gray-100 text-gray-800")}>
                                    {issue.severity}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{issue.description ?? 'No description available.'}</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span>Factor: <strong className="text-foreground">{issue.factor}</strong></span>
                                {issue.impact && <span>CVSS: <strong className="text-foreground">{issue.impact.toFixed(1)}</strong></span>}
                                <span><strong className="text-foreground">{issue.findingsCount}</strong> affected asset{issue.findingsCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Findings table */}
                        <div className="rounded-md border bg-card shadow-sm">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    {issue.findingsCount} row{issue.findingsCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-semibold text-foreground w-32">Status</TableHead>
                                        <TableHead className="font-semibold text-foreground w-52">Domain</TableHead>
                                        <TableHead className="font-semibold text-foreground">URL</TableHead>
                                        <TableHead className="font-semibold text-foreground w-36 text-right">Last Observed</TableHead>
                                        <TableHead className="font-semibold text-foreground w-24 text-center">Comment</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {issue.findings.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                                No affected assets found.
                                            </TableCell>
                                        </TableRow>
                                    ) : issue.findings.map((finding) => {
                                        const url = finding.isExposed
                                            ? `https://${finding.hostname}/`
                                            : `http://${finding.hostname}/`
                                        const hasComment = !!comments[finding.assetId]

                                        return (
                                            <TableRow key={finding.assetId} className="border-b border-border hover:bg-muted/20 transition-colors">
                                                {/* Status — read from finding.status in the DB */}
                                                <TableCell>
                                                    <span className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "w-2.5 h-2.5 rounded-full flex-shrink-0",
                                                            finding.status === 'Open' ? "bg-red-500" : "bg-green-500"
                                                        )} />
                                                        <span className="text-sm font-medium">{finding.status}</span>
                                                    </span>
                                                </TableCell>

                                                {/* Domain */}
                                                <TableCell>
                                                    <div className="flex items-start gap-2">
                                                        <div className="w-5 h-5 rounded flex items-center justify-center bg-red-100 flex-shrink-0 mt-0.5">
                                                            <span className="text-red-600 text-xs font-bold">■</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-blue-500 hover:underline cursor-pointer">
                                                                {finding.hostname}
                                                            </p>
                                                            <button className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                                                                <Tag className="w-2.5 h-2.5" />
                                                                Add Tag
                                                            </button>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* URL */}
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground font-mono">{url}</span>
                                                </TableCell>

                                                {/* Last Observed */}
                                                <TableCell className="text-right text-sm text-muted-foreground">
                                                    {formatDate(finding.lastObserved)}
                                                </TableCell>

                                                {/* Comment icon */}
                                                <TableCell className="text-center">
                                                    <button
                                                        onClick={() => setActiveCommentAssetId(finding.assetId)}
                                                        title={hasComment ? comments[finding.assetId] : 'Add comment'}
                                                        className={cn(
                                                            "inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors",
                                                            hasComment
                                                                ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                                : "text-muted-foreground hover:text-blue-500 hover:bg-muted"
                                                        )}
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : null}
            </main>
        </div>
    )
}
