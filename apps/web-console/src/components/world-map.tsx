'use client'

import React from "react"
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json"

interface Location {
  id: number
  hostname: string
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
}

interface WorldMapProps {
  locations: Location[]
}

export function WorldMap({ locations }: WorldMapProps) {
  // Filter only locations with valid coordinates
  const validLocations = locations.filter(
    (loc) => loc.latitude !== null && loc.longitude !== null && loc.latitude !== undefined && loc.longitude !== undefined
  )

  return (
    <div className="w-full h-[500px] bg-[#050B35]/50 border border-white/10 rounded-2xl overflow-hidden shadow-xl relative backdrop-blur-sm">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-sm font-semibold text-white/90">Global Presence</h3>
        <p className="text-xs text-white/50">Tracking assets across geographic boundaries</p>
      </div>

      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 147
        }}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={1}>
          <Geographies geography={geoUrl}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#0B1247"
                  stroke="#1a237e"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { fill: "#1a237e", outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
          {validLocations.map((loc) => (
            <Marker key={loc.id} coordinates={[loc.longitude as number, loc.latitude as number]}>
              <circle r={4} fill="#F00" stroke="#FFF" strokeWidth={1} className="animate-pulse" />
              <text
                textAnchor="middle"
                y={-10}
                style={{ fontFamily: "Inter, system-ui", fill: "#FFF", fontSize: "10px", fontWeight: "bold" }}
                className="pointer-events-none drop-shadow-md"
              >
                {loc.hostname}
              </text>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/70">
        Showing {validLocations.length} active asset points
      </div>
    </div>
  )
}
