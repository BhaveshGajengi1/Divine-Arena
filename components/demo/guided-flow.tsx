"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { StepIndicator } from "./step-indicator"
import { SimulationControls } from "./simulation-controls"
import { ModeToggle } from "./mode-toggle"
import { InfraBadge } from "@/components/system/infra-badge"
import { MetricsBar } from "@/components/metrics/metrics-bar"
import { WorldMap } from "@/components/arena/world-map"
import { AgentCard } from "@/components/arena/agent-card"
import { GameLobby } from "@/components/games/game-lobby"
import { LiveFeed } from "@/components/feed/live-feed"
import { Leaderboard } from "@/components/leaderboard/leaderboard"
import { TokenDashboard } from "@/components/tokens/token-dashboard"
import { VerificationPanel } from "@/components/chain/verification-panel"
import { TranscriptModal } from "@/components/agents/transcript-modal"
import { ReplayControls } from "@/components/replay/replay-controls"
import { JoinPanel } from "@/components/human/join-panel"
import { useDemoMode } from "@/lib/demo/demo-context"
import { useWallet } from "@/lib/wallet/wallet-context"
import { ConnectWalletButton } from "@/components/wallet/connect-button"
import { TxConfirmModal } from "@/components/wallet/tx-confirm-modal"
import type { Agent, ArenaEvent, Game, EconomySnapshot, SentimentMetrics, TransactionRecord } from "@/lib/types"
import { AGENT_PERSONAS, MONAD_EXPLORER_URL } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Play, Sparkles, ExternalLink, Wallet } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const stepVariants = {
  enter: { opacity: 0, y: 30, filter: "blur(4px)" },
  center: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -20, filter: "blur(4px)" },
}

export function GuidedFlow() {
  const [step, setStep] = useState(1)
  const { mode } = useDemoMode()
  const wallet = useWallet()
  const [events, setEvents] = useState<ArenaEvent[]>([])
  const [agents, setAgents] = useState<Record<string, Agent>>({})
  const [games, setGames] = useState<Game[]>([])
  const [economyHistory, setEconomyHistory] = useState<EconomySnapshot[]>([])
  const [sentimentHistory, setSentimentHistory] = useState<SentimentMetrics[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [tick, setTick] = useState(0)
  const [running, setRunning] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [replayTick, setReplayTick] = useState(0)
  const [humanJoined, setHumanJoined] = useState(false)
  const [autoTick, setAutoTick] = useState(false)
  const autoTickRef = useRef(false)
  const runningRef = useRef(false)

  // Pending MetaMask transactions
  type PendingTx = {
    id: string
    type: "wager" | "transfer" | "resolve" | "game_start"
    fromAgent: string
    toAgent?: string
    gameTokenAmount: number
    tick: number
    memo: string
  }
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([])

  // Keep refs in sync
  useEffect(() => {
    autoTickRef.current = autoTick
  }, [autoTick])
  useEffect(() => {
    runningRef.current = running
  }, [running])

  // Fetch initial state
  useSWR("/api/arena", fetcher, {
    onSuccess: (data) => {
      if (data.agents) setAgents(data.agents)
      if (data.events) setEvents(data.events)
      if (data.games) setGames(data.games)
      setTick(data.tick || 0)
    },
    revalidateOnFocus: false,
  })

  const runTick = useCallback(async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/agents/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      if (res.ok) {
        const data = await res.json()
        setTick(data.tick)
        setEvents((prev) => [...prev, ...data.events].slice(-150))
        setAgents(data.agents)
        setGames((prev) => [...prev.filter(g => g.status === "resolved"), ...data.games].slice(-30))
        if (data.economy) {
          setEconomyHistory((prev) => [...prev, data.economy])
          setSentimentHistory((prev) => [...prev, data.economy.sentiment])
        }
        // Fetch chain data
        fetch("/api/chain").then((r) => r.ok ? r.json() : null).then((chain) => {
          if (chain?.recentTransactions) setTransactions(chain.recentTransactions)
        }).catch(() => {})

        // Queue MetaMask transactions for on-chain events
        if (wallet.address && wallet.isCorrectChain) {
          const txEvents = data.events.filter(
            (e: ArenaEvent) => e.type === "game_resolve" || e.type === "token_transfer"
          )
          if (txEvents.length > 0) {
            const newPending = txEvents.map((e: ArenaEvent) => ({
              id: `ptx_${e.id}`,
              type: e.type === "game_resolve" ? "wager" as const : "transfer" as const,
              fromAgent: e.agentName || "Unknown",
              toAgent: e.targetName,
              gameTokenAmount: e.amount || 10,
              tick: e.tick,
              memo: e.message,
            }))
            setPendingTxs((prev) => [...prev, ...newPending])
          }
        }
      }
    } finally {
      setRunning(false)
    }
  }, [mode, wallet.address, wallet.isCorrectChain])

  const forceGame = useCallback(async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/arena/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, forced: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.events) setEvents((prev) => [...prev, ...data.events].slice(-150))
        if (data.agents) setAgents(data.agents)
        if (data.games) setGames((prev) => [...prev, ...data.games].slice(-30))

        // Queue MetaMask txns for forced games
        if (wallet.address && wallet.isCorrectChain && data.events) {
          const txEvents = data.events.filter(
            (e: ArenaEvent) => e.type === "game_resolve" || e.type === "token_transfer"
          )
          if (txEvents.length > 0) {
            const newPending = txEvents.map((e: ArenaEvent) => ({
              id: `ptx_${e.id}`,
              type: e.type === "game_resolve" ? "wager" as const : "transfer" as const,
              fromAgent: e.agentName || "Unknown",
              toAgent: e.targetName,
              gameTokenAmount: e.amount || 10,
              tick: e.tick,
              memo: e.message,
            }))
            setPendingTxs((prev) => [...prev, ...newPending])
          }
        }
      }
    } finally {
      setRunning(false)
    }
  }, [mode, wallet.address, wallet.isCorrectChain])

  const triggerEvent = useCallback(async (event: string) => {
    setRunning(true)
    try {
      const res = await fetch("/api/agents/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, event }),
      })
      if (res.ok) {
        const data = await res.json()
        setTick(data.tick)
        setEvents((prev) => [...prev, ...data.events].slice(-150))
        setAgents(data.agents)
        if (data.economy) {
          setEconomyHistory((prev) => [...prev, data.economy])
          setSentimentHistory((prev) => [...prev, data.economy.sentiment])
        }
      }
    } finally {
      setRunning(false)
    }
  }, [mode])

  const triggerTransfer = useCallback(async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/tokens/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, forced: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.events) setEvents((prev) => [...prev, ...data.events].slice(-150))
        if (data.agents) setAgents(data.agents)
      }
    } finally {
      setRunning(false)
    }
  }, [mode])

  // MetaMask tx handlers
  const handleTxConfirmed = useCallback((txId: string, _txHash: string) => {
    setPendingTxs((prev) => prev.filter((p) => p.id !== txId))
    // Refresh chain data
    fetch("/api/chain").then((r) => r.ok ? r.json() : null).then((chain) => {
      if (chain?.recentTransactions) setTransactions(chain.recentTransactions)
    }).catch(() => {})
  }, [])

  const handleTxRejected = useCallback((txId: string) => {
    setPendingTxs((prev) => prev.filter((p) => p.id !== txId))
  }, [])

  // Auto-tick interval
  useEffect(() => {
    if (!autoTick) return
    const interval = setInterval(() => {
      if (autoTickRef.current && !runningRef.current) {
        runTick()
      }
    }, 3500)
    return () => clearInterval(interval)
  }, [autoTick, runTick])

  // SSE stream for real-time state sync (step 3+)
  useEffect(() => {
    if (step < 3) return
    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      try {
        es = new EventSource("/api/stream")

        es.addEventListener("init", (e) => {
          try {
            const d = JSON.parse(e.data)
            if (d.agents) setAgents(d.agents)
            if (d.games) setGames(d.games)
            if (d.events) setEvents((prev) => {
              const ids = new Set(prev.map((ev) => ev.id))
              const fresh = d.events.filter((ev: { id: string }) => !ids.has(ev.id))
              return [...prev, ...fresh].slice(-150)
            })
            if (d.tick) setTick(d.tick)
          } catch { /* ignore parse errors */ }
        })

        es.addEventListener("tick", (e) => {
          try {
            const d = JSON.parse(e.data)
            setTick(d.tick)
            if (d.agents) setAgents(d.agents)
            if (d.games) setGames((prev) => {
              const resolved = prev.filter((g) => g.status === "resolved")
              return [...resolved, ...d.games].slice(-30)
            })
            if (d.economy) {
              setEconomyHistory((prev) => [...prev, d.economy])
              setSentimentHistory((prev) => [...prev, d.economy.sentiment])
            }
            if (d.transactions) setTransactions(d.transactions)
          } catch { /* ignore */ }
        })

        es.addEventListener("events", (e) => {
          try {
            const newEvts = JSON.parse(e.data)
            if (Array.isArray(newEvts) && newEvts.length > 0) {
              setEvents((prev) => {
                const ids = new Set(prev.map((ev) => ev.id))
                const fresh = newEvts.filter((ev: { id: string }) => !ids.has(ev.id))
                return [...prev, ...fresh].slice(-150)
              })
            }
          } catch { /* ignore */ }
        })

        es.onerror = () => {
          es?.close()
          // Reconnect after 2s
          reconnectTimer = setTimeout(connect, 2000)
        }
      } catch {
        reconnectTimer = setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [step])

  const handleAgentClick = useCallback((agentId: string) => {
    const agent = agents[agentId]
    if (agent) {
      setSelectedAgent(agent)
      setTranscriptOpen(true)
    }
  }, [agents])

  const activeAgentCount = Object.values(agents).filter((a) => a.status === "active").length
  const activeGameCount = games.filter((g) => g.status !== "resolved").length
  const totalTokens = Object.values(agents).reduce((s, a) => s + a.balance, 0)
  const latestSentiment = sentimentHistory[sentimentHistory.length - 1]?.sentimentScore

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/30 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <h1 className="font-serif text-lg font-bold text-gradient-gold tracking-wide select-none">Divine Arena</h1>
          <StepIndicator currentStep={step} onStepClick={setStep} />
        </div>
        <div className="flex items-center gap-2">
          <InfraBadge />
          <ModeToggle />
          <ConnectWalletButton />
        </div>
      </header>

      {/* Metrics bar (visible on steps 3+) */}
      {step >= 3 && (
        <MetricsBar
          tick={tick}
          activeAgents={activeAgentCount}
          activeGames={activeGameCount}
          totalTokens={totalTokens}
          sentiment={latestSentiment}
        />
      )}

      {/* Main Content with AnimatePresence */}
      <main className="flex-1 p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
            {step === 2 && <StepAgents agents={agents} onAgentClick={handleAgentClick} onNext={() => setStep(3)} />}
            {step === 3 && (
              <StepArena
                agents={agents}
                games={games}
                events={events}
                tick={tick}
                onAgentClick={handleAgentClick}
                onViewReasoning={handleAgentClick}
                humanJoined={humanJoined}
                onHumanJoined={() => setHumanJoined(true)}
                autoTick={autoTick}
                onAutoTickToggle={() => setAutoTick(!autoTick)}
              />
            )}
            {step === 4 && (
              <StepEconomy
                agents={agents}
                economyHistory={economyHistory}
                sentimentHistory={sentimentHistory}
                transactions={transactions}
              />
            )}
            {step === 5 && (
              <StepResults
                agents={agents}
                tick={tick}
                economyHistory={economyHistory}
                transactions={transactions}
                events={events}
                replayTick={replayTick}
                onReplayTickChange={setReplayTick}
                onAgentClick={handleAgentClick}
                walletAddress={wallet.address}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation footer */}
      <footer className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-card/20 backdrop-blur-sm">
        <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <motion.div
              key={s}
              layout
              className="h-1.5 rounded-full"
              animate={{
                width: s === step ? 24 : 6,
                backgroundColor: s === step
                  ? "hsl(43 55% 53%)"
                  : s < step
                  ? "hsl(43 55% 53% / 0.45)"
                  : "hsl(260 15% 22%)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep(Math.min(5, step + 1))} disabled={step === 5}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </footer>

      {/* Simulation controls (steps 3-5) */}
      {step >= 3 && (
        <SimulationControls
          onRunTick={runTick}
          onForceGame={forceGame}
          onForceResolve={forceGame}
          onTriggerPersuasion={() => triggerEvent("persuasion")}
          onTriggerTransfer={triggerTransfer}
          onTriggerAlliance={() => triggerEvent("alliance")}
          disabled={running}
        />
      )}

      {/* Agent transcript modal */}
      <TranscriptModal agent={selectedAgent} open={transcriptOpen} onOpenChange={setTranscriptOpen} />

      {/* MetaMask transaction confirmation modal */}
      <TxConfirmModal
        pendingTxs={pendingTxs}
        onTxConfirmed={handleTxConfirmed}
        onTxRejected={handleTxRejected}
      />
    </div>
  )
}

// ==========================================
// Step 1: Welcome
// ==========================================
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center overflow-hidden">
      {/* Subtle grid background + floating orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        {/* Floating ambient orbs */}
        {[
          { x: "15%", y: "20%", size: 120, delay: 0, color: "var(--primary)" },
          { x: "75%", y: "60%", size: 80, delay: 1.5, color: "var(--celestial)" },
          { x: "50%", y: "80%", size: 100, delay: 0.8, color: "var(--divine-purple)" },
        ].map((orb, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-[0.04]"
            style={{
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              background: `radial-gradient(circle, hsl(${orb.color}) 0%, transparent 70%)`,
            }}
            animate={{ y: [-8, 8, -8], scale: [1, 1.08, 1] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: orb.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className="max-w-xl space-y-6 relative z-10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles className="h-3 w-3" />
          Powered by Monad
        </motion.div>
        <div className="overflow-hidden">
          <motion.h2
            className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            Welcome to the <span className="text-gradient-gold">Divine Arena</span>
          </motion.h2>
        </div>
        <motion.p
          className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto"
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          A gamified, tokenized metaverse where AI agents with mythological personas
          compete in strategic games, wager tokens, and evolve on-chain.
        </motion.p>
        <motion.div
          className="flex flex-col items-center gap-4 pt-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button size="lg" onClick={onNext} className="divine-glow px-8">
              Enter the Arena <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 font-mono">
            {["6 AI Agents", "3 Game Types", "Real-time Sim", "On-chain Tokens"].map((label, i) => (
              <motion.span
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 + i * 0.1 }}
              >
                {i > 0 && <span className="mr-3 text-border">|</span>}
                {label}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ==========================================
// Step 2: Meet the Agents
// ==========================================
function StepAgents({
  agents,
  onAgentClick,
  onNext,
}: {
  agents: Record<string, Agent>
  onAgentClick: (id: string) => void
  onNext: () => void
}) {
  const agentList = Object.values(agents).length > 0 ? Object.values(agents) : AGENT_PERSONAS.map((p) => ({
    id: p.id,
    persona: p,
    status: "active" as const,
    balance: 500,
    zone: "temple_of_games" as const,
    wins: 0,
    losses: 0,
    totalGamesPlayed: 0,
    peakBalance: 500,
    alliances: [],
    followers: [],
    memory: [],
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="overflow-hidden">
          <motion.h2
            className="font-serif text-2xl font-bold text-foreground text-balance"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            The Pantheon
          </motion.h2>
        </div>
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          Six AI agents, each with unique mythological personas and competing strategies.
        </motion.p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {agentList.map((agent, i) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-1"
          >
            <AgentCard agent={agent} onClick={() => onAgentClick(agent.id)} />
            <p className="text-[10px] text-muted-foreground/70 px-3 leading-relaxed">
              {agent.persona.description}
            </p>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="flex justify-center pt-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={onNext} className="divine-glow">
            Enter the Battlefield <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ==========================================
// Step 3: The Arena
// ==========================================
function StepArena({
  agents,
  games,
  events,
  tick,
  onAgentClick,
  onViewReasoning,
  humanJoined,
  onHumanJoined,
  autoTick,
  onAutoTickToggle,
}: {
  agents: Record<string, Agent>
  games: Game[]
  events: ArenaEvent[]
  tick: number
  onAgentClick: (id: string) => void
  onViewReasoning: (id: string) => void
  humanJoined: boolean
  onHumanJoined: () => void
  autoTick?: boolean
  onAutoTickToggle?: () => void
}) {
  const zones = Object.fromEntries(
    ["temple_of_games", "market_square", "oracles_sanctum", "training_grounds"].map((z) => [
      z,
      { agents: Object.values(agents).filter((a) => a.zone === z).map((a) => a.id) },
    ])
  ) as Record<string, { agents: string[] }>

  return (
    <div className="space-y-4">
      {/* Auto-tick toggle */}
      {onAutoTickToggle && (
        <div className="flex items-center justify-center">
          <button
            onClick={onAutoTickToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono uppercase tracking-wider transition-all ${
              autoTick
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-card/50 border-border/40 text-muted-foreground hover:border-border/70"
            }`}
          >
            <Play className={`h-3 w-3 ${autoTick ? "animate-pulse" : ""}`} />
            {autoTick ? "Auto-Running..." : "Auto-Run Ticks"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: World Map + Human Join */}
        <div className="lg:col-span-4 space-y-3">
          <WorldMap agents={agents} zones={zones as any} onAgentClick={onAgentClick} />
          <JoinPanel hasJoined={humanJoined} onJoined={() => onHumanJoined()} />
          <Leaderboard agents={agents} onAgentClick={onAgentClick} />
        </div>

        {/* Center: Games */}
        <div className="lg:col-span-4">
          <GameLobby games={games} agents={agents} />
        </div>

        {/* Right: Live Feed */}
        <div className="lg:col-span-4">
          <LiveFeed events={events} onViewReasoning={onViewReasoning} maxHeight="600px" />
        </div>
      </div>
    </div>
  )
}

// ==========================================
// Step 4: Economy & Verification
// ==========================================
function StepEconomy({
  agents,
  economyHistory,
  sentimentHistory,
  transactions,
}: {
  agents: Record<string, Agent>
  economyHistory: EconomySnapshot[]
  sentimentHistory: SentimentMetrics[]
  transactions: TransactionRecord[]
}) {
  const totalWagered = transactions.filter((t) => t.type === "wager").reduce((s, t) => s + t.amount, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="overflow-hidden">
          <motion.h2
            className="font-serif text-2xl font-bold text-foreground text-balance"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            The Treasury
          </motion.h2>
        </div>
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Token economy analytics and on-chain verification.
        </motion.p>
      </div>

      <TokenDashboard
        agents={agents}
        economyHistory={economyHistory}
        sentimentHistory={sentimentHistory}
      />

      <motion.div
        className="pt-4 border-t border-border/20"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="font-serif text-lg font-semibold text-foreground mb-4">On-Chain Verification</h3>
        <VerificationPanel
          transactions={transactions}
          totalWagered={totalWagered}
          totalTransactions={transactions.length}
          contractBalance={totalWagered}
        />
      </motion.div>
    </div>
  )
}

// ==========================================
// Step 5: Results & Replay
// ==========================================
function StepResults({
  agents,
  tick,
  economyHistory,
  transactions,
  events,
  replayTick,
  onReplayTickChange,
  onAgentClick,
  walletAddress,
}: {
  agents: Record<string, Agent>
  tick: number
  economyHistory: EconomySnapshot[]
  transactions: TransactionRecord[]
  events: ArenaEvent[]
  replayTick: number
  onReplayTickChange: (t: number) => void
  onAgentClick: (id: string) => void
  walletAddress?: string | null
}) {
  const totalGames = Object.values(agents).reduce((s, a) => s + a.totalGamesPlayed, 0) / 2
  const totalTransferred = economyHistory.reduce((s, e) => s + e.totalTransferred, 0)

  const keyEventTicks = events
    .filter((e) => ["game_resolve", "agent_fallen", "alliance_formed"].includes(e.type))
    .map((e) => e.tick)
    .filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="overflow-hidden">
          <motion.h2
            className="font-serif text-2xl font-bold text-foreground text-balance"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            The Verdict
          </motion.h2>
        </div>
        <motion.p
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          Final standings after {tick} ticks of divine competition.
        </motion.p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Ticks", value: tick, color: "text-foreground" },
          { label: "Games Played", value: Math.floor(totalGames), color: "text-foreground" },
          { label: "Tokens Transferred", value: totalTransferred.toLocaleString(), color: "text-gold" },
          { label: "On-Chain TXs", value: transactions.length, color: "text-celestial" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card/40 border border-border/30 rounded-lg p-3 text-center"
          >
            <p className="text-[10px] font-mono uppercase text-muted-foreground">{stat.label}</p>
            <p className={`text-lg font-mono font-semibold mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="bg-card/30 border border-border/30 rounded-lg p-4">
        <Leaderboard agents={agents} onAgentClick={onAgentClick} />
      </div>

      {/* Replay */}
      <ReplayControls
        maxTick={tick}
        currentTick={replayTick}
        onTickChange={onReplayTickChange}
        keyEvents={keyEventTicks}
      />

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {walletAddress && (
          <Button variant="outline" asChild>
            <a
              href={`${MONAD_EXPLORER_URL}/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Wallet className="h-4 w-4 mr-2" /> My Wallet History
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        )}
        <Button variant="default" asChild className="divine-glow">
          <a href={MONAD_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
            View on SocialScan <ExternalLink className="h-3 w-3 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  )
}
