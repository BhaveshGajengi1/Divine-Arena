"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, SkipBack, SkipForward, Rewind } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ReplayControlsProps {
  maxTick: number
  currentTick: number
  onTickChange: (tick: number) => void
  keyEvents?: number[] // ticks with notable events
}

export function ReplayControls({ maxTick, currentTick, onTickChange, keyEvents = [] }: ReplayControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const stop = useCallback(() => {
    setIsPlaying(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const play = useCallback(() => {
    if (currentTick >= maxTick) {
      onTickChange(0)
    }
    setIsPlaying(true)
  }, [currentTick, maxTick, onTickChange])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onTickChange(currentTick + 1)
      }, 1000 / speed)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, currentTick, speed, onTickChange])

  useEffect(() => {
    if (currentTick >= maxTick) stop()
  }, [currentTick, maxTick, stop])

  if (maxTick === 0) {
    return (
      <div className="text-xs text-muted-foreground/40 italic text-center py-6">
        No replay data. Complete a simulation first.
      </div>
    )
  }

  return (
    <div className="bg-card/40 border border-border/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex-1">
          Arena Replay
        </h4>
        <span className="text-[10px] font-mono text-muted-foreground">
          Tick {currentTick} / {maxTick}
        </span>
      </div>

      {/* Scrubber */}
      <div className="relative mb-4">
        <Slider
          value={[currentTick]}
          min={0}
          max={maxTick}
          step={1}
          onValueChange={([v]) => { stop(); onTickChange(v) }}
          className="w-full"
        />
        {/* Key event markers */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none">
          {keyEvents.map((tick) => (
            <div
              key={tick}
              className="absolute w-1.5 h-1.5 rounded-full bg-gold"
              style={{ left: `${(tick / maxTick) * 100}%`, transform: "translateX(-50%)" }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => { stop(); onTickChange(0) }} className="h-8 w-8 p-0">
          <Rewind className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { stop(); onTickChange(Math.max(0, currentTick - 1)) }} className="h-8 w-8 p-0">
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={isPlaying ? stop : play}
          className="h-8 px-4"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { stop(); onTickChange(Math.min(maxTick, currentTick + 1)) }} className="h-8 w-8 p-0">
          <SkipForward className="h-3.5 w-3.5" />
        </Button>

        {/* Speed */}
        <div className="flex items-center gap-1 ml-3">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "text-[10px] font-mono px-2 py-1 rounded transition-colors",
                speed === s ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
