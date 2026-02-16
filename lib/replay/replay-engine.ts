import type { WorldState, ArenaEvent, EconomySnapshot, TickSnapshot } from "../types"
import { getSnapshotAtTick, getAllSnapshots, getKeyEvents } from "../world/event-log"

// ==========================================
// Replay Engine — Deterministic State Reconstruction
// ==========================================

export function getStateAtTick(tick: number): {
  worldState: WorldState
  events: ArenaEvent[]
  economy: EconomySnapshot
} | null {
  const snapshot = getSnapshotAtTick(tick)
  if (!snapshot) return null

  return {
    worldState: snapshot.worldState,
    events: snapshot.events,
    economy: snapshot.economy,
  }
}

export function getEventsForTick(tick: number): ArenaEvent[] {
  const snapshot = getSnapshotAtTick(tick)
  return snapshot?.events || []
}

export function getReplayTimeline(): {
  totalTicks: number
  keyMoments: { tick: number; type: string; message: string }[]
  snapshots: TickSnapshot[]
} {
  const snapshots = getAllSnapshots()
  return {
    totalTicks: snapshots.length,
    keyMoments: getKeyEvents(),
    snapshots,
  }
}

export function getTickRange(start: number, end: number): TickSnapshot[] {
  return getAllSnapshots().filter((s) => s.tick >= start && s.tick <= end)
}
