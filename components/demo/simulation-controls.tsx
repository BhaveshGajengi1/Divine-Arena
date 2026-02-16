"use client"

import { useState, useCallback } from "react"
import {
  Swords, CheckCircle2, MessageSquare, ArrowRightLeft,
  Handshake, Play, ChevronRight, ChevronLeft, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDemoMode } from "@/lib/demo/demo-context"
import { cn } from "@/lib/utils"

interface SimulationControlsProps {
  onRunTick: () => Promise<void>
  onForceGame: () => Promise<void>
  onForceResolve: () => Promise<void>
  onTriggerPersuasion: () => Promise<void>
  onTriggerTransfer: () => Promise<void>
  onTriggerAlliance: () => Promise<void>
  disabled?: boolean
}

export function SimulationControls({
  onRunTick,
  onForceGame,
  onForceResolve,
  onTriggerPersuasion,
  onTriggerTransfer,
  onTriggerAlliance,
  disabled,
}: SimulationControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const { mode } = useDemoMode()

  const handleAction = useCallback(async (name: string, fn: () => Promise<void>) => {
    if (loadingAction) return
    setLoadingAction(name)
    try {
      await fn()
    } finally {
      setTimeout(() => setLoadingAction(null), 500)
    }
  }, [loadingAction])

  const actions = [
    { name: "Run Tick", icon: <Play className="h-3.5 w-3.5" />, fn: onRunTick, accent: true },
    { name: "Force Game", icon: <Swords className="h-3.5 w-3.5" />, fn: onForceGame },
    { name: "Resolve Game", icon: <CheckCircle2 className="h-3.5 w-3.5" />, fn: onForceResolve },
    { name: "Persuasion", icon: <MessageSquare className="h-3.5 w-3.5" />, fn: onTriggerPersuasion },
    { name: "Transfer", icon: <ArrowRightLeft className="h-3.5 w-3.5" />, fn: onTriggerTransfer },
    { name: "Alliance", icon: <Handshake className="h-3.5 w-3.5" />, fn: onTriggerAlliance },
  ]

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-card border border-border/50 border-r-0 rounded-l-lg p-2 hover:bg-muted transition-colors"
      >
        {isOpen ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronLeft className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-card/95 backdrop-blur-sm border border-border/50 border-r-0 rounded-l-xl p-3 shadow-lg transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Controls ({mode})
        </p>
        <div className="flex flex-col gap-2 w-36">
          {actions.map((action) => {
            const isLoading = loadingAction === action.name
            return (
              <Button
                key={action.name}
                variant={action.accent ? "default" : "outline"}
                size="sm"
                disabled={disabled || !!loadingAction}
                onClick={() => handleAction(action.name, action.fn)}
                className={cn(
                  "justify-start gap-2 text-xs h-8",
                  action.accent && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action.icon}
                {action.name}
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
