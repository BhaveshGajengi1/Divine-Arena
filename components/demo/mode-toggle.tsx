"use client"

import { useDemoMode } from "@/lib/demo/demo-context"
import { cn } from "@/lib/utils"
import { Radio, FlaskConical } from "lucide-react"

export function ModeToggle() {
  const { mode, toggleMode } = useDemoMode()
  const isLive = mode === "live"

  return (
    <button
      onClick={toggleMode}
      aria-label={`Switch to ${isLive ? "simulated" : "live"} mode`}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-mono transition-all",
        isLive
          ? "bg-success/10 border-success/30 text-success hover:bg-success/15"
          : "bg-gold/10 border-gold/30 text-gold hover:bg-gold/15"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full shrink-0",
          isLive ? "bg-success animate-pulse" : "bg-gold animate-pulse-gold"
        )}
      />
      {isLive ? <Radio className="h-3 w-3" /> : <FlaskConical className="h-3 w-3" />}
    </button>
  )
}
