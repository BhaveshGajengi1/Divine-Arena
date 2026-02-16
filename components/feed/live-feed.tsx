"use client"

import { useRef, useEffect } from "react"
import { FeedItem } from "./feed-item"
import type { ArenaEvent } from "@/lib/types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LiveFeedProps {
  events: ArenaEvent[]
  onViewReasoning?: (agentId: string) => void
  maxHeight?: string
}

export function LiveFeed({ events, onViewReasoning, maxHeight = "400px" }: LiveFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [events.length])

  return (
    <div className="flex flex-col">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground px-2 mb-2">
        Live Feed ({events.length})
      </h3>
      <ScrollArea className="border border-border/30 rounded-lg bg-card/20" style={{ maxHeight }}>
        <div className="py-1">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 italic text-center py-8">
              Awaiting arena events...
            </p>
          ) : (
            events.map((event) => (
              <FeedItem key={event.id} event={event} onViewReasoning={onViewReasoning} />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
