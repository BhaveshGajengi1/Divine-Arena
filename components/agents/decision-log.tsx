"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import type { DecisionTranscript, RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-gold/15 text-gold",
  high: "bg-destructive/15 text-destructive",
}

interface DecisionLogProps {
  transcripts: DecisionTranscript[]
  agentName?: string
}

export function DecisionLog({ transcripts, agentName }: DecisionLogProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const sorted = [...transcripts].sort((a, b) => b.tick - a.tick)

  return (
    <div className="flex flex-col gap-1">
      {agentName && (
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
          {agentName} Decisions ({sorted.length})
        </h3>
      )}
      <ScrollArea className="max-h-[350px]">
        <div className="flex flex-col gap-1.5 pr-2">
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic text-center py-6">
              No decisions recorded yet.
            </p>
          ) : (
            sorted.map((t, i) => {
              const isExpanded = expandedId === i
              return (
                <div
                  key={`${t.tick}-${i}`}
                  className="bg-card/40 border border-border/30 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : i)}
                    className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                        T{t.tick}
                      </span>
                      <span className="text-xs text-foreground truncate">{t.decision}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono", RISK_COLORS[t.risk])}>
                        {t.risk}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/20 animate-fade-in">
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">Context</p>
                        <p className="text-xs text-foreground/80">{t.gameContext}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">Reasoning</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{t.reasoning}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] font-mono text-muted-foreground uppercase">Expected</p>
                          <p className="text-xs text-foreground/80">{t.expectedOutcome}</p>
                        </div>
                        {t.actualOutcome && (
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Actual</p>
                            <p className="text-xs text-foreground/80">{t.actualOutcome}</p>
                          </div>
                        )}
                        {t.tokenDelta !== undefined && (
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Token Delta</p>
                            <p className={cn("text-xs font-mono", t.tokenDelta >= 0 ? "text-success" : "text-destructive")}>
                              {t.tokenDelta >= 0 ? "+" : ""}{t.tokenDelta}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
