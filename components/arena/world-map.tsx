"use client"

import { ZONE_POSITIONS, ZONES } from "@/lib/constants"
import type { Agent, ZoneId } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Flame, Shield, Swords, Wind, Eye, Crown, User, Skull } from "lucide-react"

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  shield: Shield,
  sword: Swords,
  wind: Wind,
  eye: Eye,
  crown: Crown,
  user: User,
}

interface WorldMapProps {
  agents: Record<string, Agent>
  zones: Record<ZoneId, { agents: string[] }>
  onAgentClick?: (agentId: string) => void
}

export function WorldMap({ agents, zones, onAgentClick }: WorldMapProps) {
  return (
    <div className="relative w-full aspect-[4/3] bg-card/30 rounded-lg border border-border/50 overflow-hidden ornate-corners">
      {/* Background grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Connection lines between zones */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {Object.entries(ZONE_POSITIONS).map(([zoneA, posA], i) => {
          const others = Object.entries(ZONE_POSITIONS).slice(i + 1)
          return others.map(([zoneB, posB]) => (
            <line
              key={`${zoneA}-${zoneB}`}
              x1={`${posA.x}%`}
              y1={`${posA.y}%`}
              x2={`${posB.x}%`}
              y2={`${posB.y}%`}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          ))
        })}
      </svg>

      {/* Zone nodes */}
      {(Object.entries(ZONE_POSITIONS) as [ZoneId, { x: number; y: number }][]).map(([zoneId, pos]) => {
        const zoneAgents = (zones[zoneId]?.agents || [])
          .map((id) => agents[id])
          .filter(Boolean)
        const zoneInfo = ZONES[zoneId]

        return (
          <div
            key={zoneId}
            className="absolute flex flex-col items-center"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Zone label */}
            <div className="mb-2 px-2 py-1 rounded bg-card/80 border border-border/40 backdrop-blur-sm">
              <p className="text-[10px] font-serif font-medium text-primary whitespace-nowrap">
                {zoneInfo.name}
              </p>
            </div>

            {/* Agent avatars */}
            <div className="flex items-center gap-1">
              {zoneAgents.slice(0, 6).map((agent) => {
                const Icon = agent.status === "fallen" ? Skull : ICON_MAP[agent.persona.icon] || User
                return (
                  <button
                    key={agent.id}
                    onClick={() => onAgentClick?.(agent.id)}
                    className={cn(
                      "flex items-center justify-center h-7 w-7 rounded-full border transition-transform hover:scale-110",
                      agent.status === "fallen"
                        ? "bg-muted/40 border-destructive/30 opacity-40"
                        : "border-border/60 hover:border-primary/60"
                    )}
                    style={{
                      backgroundColor: agent.status !== "fallen" ? agent.persona.color + "22" : undefined,
                    }}
                    title={`${agent.persona.name} (${agent.balance} tokens)`}
                  >
                    <Icon
                      className="h-3 w-3"
                      style={{ color: agent.status !== "fallen" ? agent.persona.color : undefined }}
                    />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
