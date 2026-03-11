'use client'

import React, { useState } from "react"
import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    navigations: {
        title: string
        icon: LucideIcon
        href: string
        isActive?: boolean
    }[]
}

export function Sidebar({ className, navigations }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div 
            className={cn(
                "sticky top-0 pb-6 h-screen border-r border-[#1a237e]/30 bg-gradient-to-b from-[#050B35] to-[#0B1247] flex flex-col text-white transition-all duration-300 ease-in-out relative z-20 shrink-0", 
                isCollapsed ? "w-20" : "w-64",
                className
            )}
        >
            {/* Collapse Toggle Button - customized to dark blue #0B1247 to match sidebar and slightly larger */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-4 top-7 flex h-8 w-8 items-center justify-center rounded-full border border-[#1a237e]/50 bg-[#0B1247] shadow-md text-white/70 hover:text-white hover:bg-[#1a237e] transition-colors z-30"
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            <div className="space-y-4 py-4 flex-1 overflow-hidden">
                <div className="px-3 py-2">
                    {/* Header Logo area matching the design */}
                    <div className={cn("flex items-center gap-3 mb-8 px-2 mt-2 transition-all duration-300", isCollapsed ? "justify-center" : "")}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner shrink-0">
                            <span className="text-xl font-bold text-white">E</span>
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-300 opacity-100">
                                <span className="text-lg font-extrabold tracking-tight text-white leading-tight">EASM</span>
                                <span className="text-xs text-white/70">Demo Organization</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5 mt-4">
                        {navigations.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.title : undefined}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl py-3 text-sm font-medium transition-all duration-200",
                                    isCollapsed ? "px-0 justify-center mx-1" : "px-4",
                                    item.isActive 
                                        ? "bg-white/10 text-white shadow-sm border border-white/10" 
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 shrink-0", item.isActive ? "text-blue-400" : "text-white/60")} />
                                {!isCollapsed && (
                                    <span className="whitespace-nowrap transition-opacity duration-300 opacity-100">
                                        {item.title}
                                    </span>
                                )}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <div className={cn("py-4 border-t border-white/10 mt-auto transition-all duration-300", isCollapsed ? "px-0 flex justify-center" : "px-6")}>
                <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
                    <div className="h-8 w-8 shrink-0 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                        <span className="text-xs font-semibold text-white">SC</span>
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col whitespace-nowrap overflow-hidden transition-opacity duration-300 opacity-100">
                            <span className="text-sm font-medium text-white">Sec Team</span>
                            <span className="text-xs text-white/60">Admin</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
