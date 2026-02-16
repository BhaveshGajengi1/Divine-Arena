"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, ChevronDown, ChevronUp } from "lucide-react"
import type { HealthStatus } from "@/lib/types"
import { useDemoMode } from "@/lib/demo/demo-context"
import { cn } from "@/lib/utils"

const STATUS_DOTS: Record<string, string> = {
  online: "bg-success",
  slow: "bg-gold",
  offline: "bg-destructive",
}

export function InfraBadge() {
  const [expanded, setExpanded] = useState(false)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const { mode } = useDemoMode()

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`/api/health?mode=${mode}`)
      if (res.ok) {
        setHealth(await res.json())
      }
    } catch {
      setHealth({
        llm: { status: "offline", latency: 0 },
        rpc: { status: "offline", latency: 0 },
        sse: { status: "offline" },
        tickSpeed: 0,
        mode,
      })
    }
  }, [mode])

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30_000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  const allOnline = health && health.llm.status === "online" && health.rpc.status === "online"

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono transition-all",
          "bg-card/60 border-border/40 hover:border-border/70"
        )}
      >
        <Activity className="h-3 w-3 text-muted-foreground" />
        {health ? (
          <div className="flex items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOTS[health.llm.status])} />
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOTS[health.rpc.status])} />
            <span className={cn("h-1.5 w-1.5 rounded-full", health.sse.status === "online" ? "bg-success" : "bg-destructive")} />
          </div>
        ) : (
          <span className="text-muted-foreground/40">...</span>
        )}
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      {expanded && health && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg z-50 animate-fade-in">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            System Health
          </p>
          <div className="space-y-1.5">
            <HealthRow label="LLM API" status={health.llm.status} detail={`${health.llm.latency}ms`} />
            <HealthRow label="Monad RPC" status={health.rpc.status} detail={`${health.rpc.latency}ms`} />
            <HealthRow label="SSE Stream" status={health.sse.status} />
            <HealthRow label="Tick Speed" status="online" detail={`${health.tickSpeed}ms`} />
          </div>
        </div>
      )}
    </div>
  )
}

function HealthRow({ label, status, detail }: { label: string; status: string; detail?: string }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <div className="flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOTS[status] || "bg-muted")} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="text-foreground/80 font-mono">{detail || status}</span>
    </div>
  )
}
