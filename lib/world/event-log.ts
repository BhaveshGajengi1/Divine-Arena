import type { TickSnapshot, WorldState, ArenaEvent, EconomySnapshot } from "../types"

// ==========================================
// Persistent Event Log for Replay
// ==========================================

const tickSnapshots: TickSnapshot[] = []

export function recordTickSnapshot(
  worldState: WorldState,
  events: ArenaEvent[],
  economy: EconomySnapshot
): void {
  tickSnapshots.push({
    tick: worldState.tick,
    worldState: JSON.parse(JSON.stringify(worldState)),
    events: [...events],
    economy: { ...economy },
    timestamp: Date.now(),
  })
}

export function getSnapshotAtTick(tick: number): TickSnapshot | undefined {
  return tickSnapshots.find((s) => s.tick === tick)
}

export function getAllSnapshots(): TickSnapshot[] {
  return tickSnapshots
}

export function getLatestSnapshot(): TickSnapshot | undefined {
  return tickSnapshots[tickSnapshots.length - 1]
}

export function getTotalTicks(): number {
  return tickSnapshots.length
}

export function getKeyEvents(): { tick: number; type: string; message: string }[] {
  const keyEvents: { tick: number; type: string; message: string }[] = []
  for (const snapshot of tickSnapshots) {
    for (const event of snapshot.events) {
      if (
        event.type === "game_resolve" ||
        event.type === "agent_fallen" ||
        event.type === "alliance_formed" ||
        event.type === "human_joined"
      ) {
        keyEvents.push({
          tick: snapshot.tick,
          type: event.type,
          message: event.message,
        })
      }
    }
  }
  return keyEvents
}

export function clearEventLog(): void {
  tickSnapshots.length = 0
}
