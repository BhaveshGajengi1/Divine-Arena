import { generateText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import type { Agent, DecisionTranscript, GameType, GameMove, RiskLevel } from "../types"
import { getAgentContext, addToAgentMemory } from "./agent-system"
import { getWorldState } from "../world/world-state"

function getModel() {
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    const openai = createOpenAI({ apiKey })
    return openai("gpt-4o-mini")
  }
  // Fallback to AI Gateway string (works on Vercel with gateway configured)
  return "openai/gpt-4o-mini" as Parameters<typeof generateText>[0]["model"]
}

// ==========================================
// AI Agent Decision Engine
// ==========================================

interface AgentDecision {
  action: "challenge" | "accept" | "wager" | "move" | "transfer" | "observe"
  targetAgentId?: string
  gameType?: GameType
  move?: GameMove
  amount?: number
  zone?: string
  transcript: DecisionTranscript
}

export async function getAgentDecision(
  agent: Agent,
  mode: "live" | "demo",
  demoDecision?: Partial<DecisionTranscript> & { action?: string }
): Promise<AgentDecision> {
  const state = getWorldState()

  // Demo mode — return scripted decision
  if (mode === "demo" && demoDecision) {
    const transcript: DecisionTranscript = {
      agentId: agent.id,
      agentName: agent.persona.name,
      tick: state.tick,
      gameContext: demoDecision.gameContext || "Free action",
      decision: demoDecision.decision || "observe",
      reasoning: demoDecision.reasoning || `${agent.persona.name} carefully observes the arena.`,
      risk: demoDecision.risk || "low",
      expectedOutcome: demoDecision.expectedOutcome || "Information gathering",
      timestamp: Date.now(),
    }
    addToAgentMemory(agent.id, transcript)

    return {
      action: (demoDecision.action as AgentDecision["action"]) || "observe",
      targetAgentId: demoDecision.agentId !== agent.id ? demoDecision.agentId : undefined,
      transcript,
    }
  }

  // Live mode — call LLM
  try {
    const context = getAgentContext(agent.id)
    const prompt = `${agent.persona.systemPrompt}

${context}

Based on your persona and the current world state, decide your next action. Choose ONE of:
1. CHALLENGE <agent_name> <game_type> <wager_amount> — Challenge another agent to a game
2. MOVE <zone_name> — Move to a different zone
3. TRANSFER <agent_name> <amount> — Send tokens to another agent
4. OBSERVE — Watch and gather information

Respond in this exact JSON format:
{
  "action": "challenge|move|transfer|observe",
  "target": "agent_name or zone_name",
  "game_type": "sacrifice_duel|oracles_gambit|tribute_war",
  "amount": number,
  "move": "sacrifice|hoard|bet_yes|bet_no|contribute",
  "reasoning": "2-3 sentences explaining your strategic thinking",
  "risk": "low|medium|high",
  "expected_outcome": "what you expect to happen"
}`

    const result = await generateText({
      model: getModel(),
      prompt,
      maxTokens: 500,
      temperature: 0.8,
    })

    const parsed = parseDecisionResponse(result.text, agent, state.tick)
    addToAgentMemory(agent.id, parsed.transcript)
    return parsed
  } catch {
    // Fallback to observe on error
    const transcript: DecisionTranscript = {
      agentId: agent.id,
      agentName: agent.persona.name,
      tick: state.tick,
      gameContext: "Free action",
      decision: "observe",
      reasoning: `${agent.persona.name} pauses to assess the situation.`,
      risk: "low",
      expectedOutcome: "Gather information",
      timestamp: Date.now(),
    }
    addToAgentMemory(agent.id, transcript)
    return { action: "observe", transcript }
  }
}

function parseDecisionResponse(
  text: string,
  agent: Agent,
  tick: number
): AgentDecision {
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")

    const data = JSON.parse(jsonMatch[0])

    const transcript: DecisionTranscript = {
      agentId: agent.id,
      agentName: agent.persona.name,
      tick,
      gameContext: data.game_type
        ? `${data.game_type} vs ${data.target || "unknown"}`
        : "Free action",
      decision: data.action || "observe",
      reasoning: data.reasoning || "No reasoning provided.",
      risk: (data.risk as RiskLevel) || "medium",
      expectedOutcome: data.expected_outcome || "Unknown",
      timestamp: Date.now(),
    }

    return {
      action: data.action || "observe",
      targetAgentId: data.target,
      gameType: data.game_type,
      move: data.move,
      amount: data.amount,
      zone: data.target,
      transcript,
    }
  } catch {
    const transcript: DecisionTranscript = {
      agentId: agent.id,
      agentName: agent.persona.name,
      tick,
      gameContext: "Free action",
      decision: "observe",
      reasoning: `${agent.persona.name} contemplates their next move.`,
      risk: "low",
      expectedOutcome: "Strategic observation",
      timestamp: Date.now(),
    }
    return { action: "observe", transcript }
  }
}

// --- Forced Event Creators ---

export function createForcedDecision(
  type: "persuasion" | "alliance" | "transfer",
  agent: Agent,
  target: Agent
): AgentDecision {
  const state = getWorldState()
  const narratives: Record<string, { decision: string; reasoning: string; risk: RiskLevel }> = {
    persuasion: {
      decision: "persuade",
      reasoning: `${agent.persona.name} attempts to sway ${target.persona.name} through eloquent rhetoric and promises of shared prosperity.`,
      risk: "medium",
    },
    alliance: {
      decision: "form_alliance",
      reasoning: `${agent.persona.name} extends an olive branch to ${target.persona.name}, proposing a strategic alliance for mutual protection.`,
      risk: "low",
    },
    transfer: {
      decision: "transfer",
      reasoning: `${agent.persona.name} sends a token gift to ${target.persona.name} as a gesture of goodwill or strategic investment.`,
      risk: "low",
    },
  }

  const narr = narratives[type] || narratives.transfer

  const transcript: DecisionTranscript = {
    agentId: agent.id,
    agentName: agent.persona.name,
    tick: state.tick,
    gameContext: `${type} targeting ${target.persona.name}`,
    decision: narr.decision,
    reasoning: narr.reasoning,
    risk: narr.risk,
    expectedOutcome: `Strengthen relationship with ${target.persona.name}`,
    timestamp: Date.now(),
  }

  addToAgentMemory(agent.id, transcript)

  return {
    action: type === "transfer" ? "transfer" : "observe",
    targetAgentId: target.id,
    amount: type === "transfer" ? Math.min(50, Math.floor(agent.balance * 0.1)) : undefined,
    transcript,
  }
}
