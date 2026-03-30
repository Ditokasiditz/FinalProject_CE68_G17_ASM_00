'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShieldAlert,
  Settings, Activity, ShieldCheck, Search,
} from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { ProtectedRoute } from '@/providers/auth-provider'

const NAV_ITEMS = [
  { title: 'Dashboard',        href: '/dashboard',        icon: LayoutDashboard },
  { title: 'Domain Discovery', href: '/discovery',        icon: Search },
  { title: 'Score Factor',     href: '/score-factor',     icon: ShieldCheck },
  { title: 'Issues portfolio', href: '/issues',           icon: ShieldAlert },
  { title: 'Digital Footprint',href: '/digital-footprint',icon: Activity },
  { title: 'User Management',  href: '/admin/users',      icon: Users },
  { title: 'Settings',         href: '/settings',         icon: Settings },
]

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Mark the active item based on the current URL
  const navigations = NAV_ITEMS.map((item) => ({
    ...item,
    // issues sub-pages (/issues/xxx) should also highlight the Issues nav item
    isActive: pathname === item.href || pathname.startsWith(item.href + '/'),
  }))

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar is rendered ONCE here – it never remounts on navigation */}
        <Sidebar navigations={navigations} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  )
}
