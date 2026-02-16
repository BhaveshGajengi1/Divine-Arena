"use client"

import { useState } from "react"
import { UserPlus, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDemoMode } from "@/lib/demo/demo-context"
import { ENTRY_FEE } from "@/lib/constants"

interface JoinPanelProps {
  onJoined?: (agentId: string) => void
  hasJoined?: boolean
}

export function JoinPanel({ onJoined, hasJoined }: JoinPanelProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(hasJoined || false)
  const { isDemo } = useDemoMode()

  const handleJoin = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/human/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          walletAddress: isDemo ? "0xDEMO" + Math.random().toString(16).slice(2, 10) : "0x0000",
          mode: isDemo ? "demo" : "live",
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setJoined(true)
        onJoined?.(data.agent.id)
      }
    } finally {
      setLoading(false)
    }
  }

  if (joined) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
        <Check className="h-4 w-4 text-success" />
        <span className="text-xs text-success">You have joined the arena!</span>
      </div>
    )
  }

  return (
    <div className="bg-card/40 border border-primary/20 rounded-lg p-4 divine-border">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-4 w-4 text-primary" />
        <span className="text-sm font-serif text-foreground">Join the Arena</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Enter as a human champion. Entry fee: {ENTRY_FEE} tokens.
        {isDemo && " (Demo mode - no real tokens required)"}
      </p>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Your champion name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs bg-background/50"
        />
        <Button size="sm" onClick={handleJoin} disabled={loading || !name.trim()} className="h-8 px-4 shrink-0">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Join"}
        </Button>
      </div>
    </div>
  )
}
