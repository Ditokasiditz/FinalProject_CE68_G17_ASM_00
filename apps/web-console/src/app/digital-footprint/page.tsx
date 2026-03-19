'use client'

import React, { useEffect, useState } from "react"
import { LayoutDashboard, Users, ShieldAlert, Settings, Activity, ShieldCheck, RefreshCw, Globe, MapPin } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { WorldMap } from "@/components/world-map"
import { cn } from "@/lib/utils"
import { ProtectedRoute } from "@/providers/auth-provider"

interface Asset {
  id: number
  hostname: string
  ipAddress: string | null
  type: string
  isExposed: boolean
  city: string | null
  country: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
  discoveredAt: string
  _count: {
    issues: number
  }
}

export default function DigitalFootprintPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<number | null>(null)

  const fetchAssets = async (fullSync: boolean = false) => {
    setLoading(true)
    try {
      if (fullSync) {
        // Trigger backend to scan all assets from Shodan
        await fetch('http://localhost:3001/api/assets/refresh-all', { method: 'POST' })
      }
      
      const res = await fetch('http://localhost:3001/api/assets')
      const data = await res.json()
      setAssets(data)
    } catch (error) {
      console.error('Error fetching/syncing assets', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleRefresh = async (id: number) => {
    setRefreshing(id)
    try {
      const response = await fetch(`http://localhost:3001/api/assets/${id}/refresh`, {
        method: 'POST',
      })
      if (response.ok) {
        // Update local state or re-fetch
        fetchAssets()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to refresh asset')
      }
    } catch (error) {
      console.error('Error refreshing asset', error)
    } finally {
      setRefreshing(null)
    }
  }

  const navigations = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Score Factor", href: "/score-factor", icon: ShieldCheck },
    { title: "Issues portfolio", href: "/issues", icon: ShieldAlert },
    { title: "Digital Footprint", href: "/digital-footprint", icon: Activity, isActive: true },
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#050B35]">
        <Sidebar navigations={navigations} />

        <main className="flex-1 overflow-y-auto p-8 relative">
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full -z-10 -translate-x-1/2 translate-y-1/2" />

          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Global Asset Inventory</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Digital Footprint</h1>
                <p className="text-white/60 mt-2 max-w-2xl">
                  Visualize and manage your external-facing assets across the globe. Powered by Shodan intelligence.
                </p>
              </div>
              <button 
                onClick={() => fetchAssets(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 text-sm font-medium transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                Sync Data
              </button>
            </div>

            {/* Map Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white/90 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Asset Geolocation
                </h2>
              </div>
              <WorldMap locations={assets} />
            </div>

            {/* Table Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white/90">Infrastructure Details</h2>
              <div className="bg-[#0B1247]/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Hostname</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">IP Address</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider text-center">Issues</th>
                        <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading && assets.length === 0 ? (
                         <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                             Loading asset footprint...
                           </td>
                         </tr>
                      ) : assets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                            No assets mapped yet. Add assets to see them here.
                          </td>
                        </tr>
                      ) : (
                        assets.map((asset) => (
                          <tr key={asset.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight text-sm">{asset.hostname}</span>
                                <span className="text-[10px] text-white/30 font-mono">{asset.type}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-white/70 font-mono">{asset.ipAddress || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              {asset.city ? (
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-sm",
                                    asset.city === 'Not Found' ? "text-white/40 italic" : "text-white/80"
                                  )}>
                                    {asset.city}{asset.country ? `, ${asset.country}` : ''}
                                  </span>
                                  {asset.countryCode && (
                                    <img 
                                      src={`https://flagcdn.com/w20/${asset.countryCode.toLowerCase()}.png`} 
                                      alt={asset.countryCode}
                                      className="w-4 h-auto opacity-80"
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-white/20 italic">Not scanned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold",
                                asset._count.issues > 0 ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-green-500/10 text-green-500/70"
                              )}>
                                {asset._count.issues}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleRefresh(asset.id)}
                                disabled={refreshing === asset.id || !asset.ipAddress}
                                className={cn(
                                  "p-2 rounded-lg transition-all",
                                  refreshing === asset.id ? "bg-blue-500/20 text-blue-400" : "hover:bg-white/10 text-white/40 hover:text-white"
                                )}
                                title="Refresh from Shodan"
                              >
                                <RefreshCw className={cn("w-4 h-4", refreshing === asset.id && "animate-spin")} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
