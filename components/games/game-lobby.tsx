"use client"

import { GameCard } from "./game-card"
import type { Game, Agent } from "@/lib/types"

interface GameLobbyProps {
  games: Game[]
  agents: Record<string, Agent>
}

export function GameLobby({ games, agents }: GameLobbyProps) {
  const activeGames = games.filter((g) => g.status !== "resolved")
  const recentResolved = games.filter((g) => g.status === "resolved").slice(-5).reverse()

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Active Games ({activeGames.length})
      </h3>
      {activeGames.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic py-4 text-center">
          No active games. Run a tick or force a game creation.
        </p>
      )}
      {activeGames.map((game) => (
        <GameCard key={game.id} game={game} agents={agents} />
      ))}

      {recentResolved.length > 0 && (
        <>
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-2">
            Recent Results
          </h3>
          {recentResolved.map((game) => (
            <GameCard key={game.id} game={game} agents={agents} />
          ))}
        </>
      )}
    </div>
  )
}
