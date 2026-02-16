# Divine Arena -- 2-Minute Demo Video Script

## Pre-Recording Checklist
- [ ] Open the deployed app URL in Chrome with MetaMask installed
- [ ] MetaMask has Monad Testnet added (the app auto-prompts if not)
- [ ] MetaMask wallet has some Monad testnet MON tokens (get from faucet: https://faucet.monad.xyz)
- [ ] Screen recorder ready (OBS, Loom, or macOS screen record)
- [ ] Browser at 1280x720 or 1920x1080 resolution
- [ ] Close other tabs for a clean look

---

## SCENE 1: Opening Hook (0:00 -- 0:15)
**What to show:** The Welcome screen with the animated title "Welcome to the Divine Arena" and the floating particles background.

**What to say:**
> "This is Divine Arena -- a fully real-time, AI-powered metaverse where six autonomous agents with mythological personas compete in strategic games, wager tokens, and record every transaction live on the Monad blockchain."

**Action:** Hover over the "Enter the Arena" button to show the hover animation, then click it.

---

## SCENE 2: The Pantheon -- Meet the Agents (0:15 -- 0:35)
**What to show:** Step 2 with the six agent cards sliding in from alternating sides.

**What to say:**
> "Each agent has a unique mythological identity. Athena is the strategic mastermind, Loki is the chaos trickster, Anubis is the risk-averse judge. They each have different token balances, personalities, and decision-making styles -- all powered by GPT-4o-mini making real-time decisions."

**Action:** Click on 2-3 agent cards to show their stats (tokens, wins, strategy). Then click "Enter the Battlefield."

---

## SCENE 3: Connect MetaMask (0:35 -- 0:50)
**What to show:** The header area with the "Connect Wallet" button.

**What to say:**
> "Before we start the simulation, let me connect my MetaMask wallet on the Monad testnet. Every in-game wager and token transfer will require my manual confirmation -- real transactions, real blockchain."

**Action:** Click "Connect Wallet" in the top-right. MetaMask popup appears. Approve the connection. Show the wallet address and MON balance appear in the header.

---

## SCENE 4: Live Simulation (0:50 -- 1:20)
**What to show:** Step 3 -- The Arena view with the live feed, world map, game lobby, and metrics bar.

**What to say:**
> "Now watch the arena come alive. I'll hit Run Tick to advance the simulation. Each tick, every agent autonomously decides whether to challenge another agent, transfer tokens, move zones, or observe. The AI makes these decisions in real-time."

**Action:**
1. Click "Run Tick" -- watch the live feed populate with events
2. Point out the metrics bar at the top showing "Live" indicator, tick count, active agents, and game count
3. Click "Run Tick" 2-3 more times
4. Point out the game lobby showing active games being created and resolved
5. Show the world map with agents positioned in different zones

> "Notice the MetaMask popup -- every wager and transfer triggers a real on-chain transaction that I approve manually."

**Action:** When MetaMask popup appears, click Confirm. Show the transaction confirmation in the floating panel.

---

## SCENE 5: Force a Game (1:20 -- 1:30)
**What to show:** Click "Force Game" button to create a dramatic matchup.

**What to say:**
> "I can also force specific games. Watch -- Athena versus Loki in a Prisoner's Dilemma. The AI decides their moves based on personality and past history."

**Action:** Click "Force Game," show the game appear in the lobby, resolve, and the MetaMask popup for the wager transaction.

---

## SCENE 6: The Treasury -- Token Economy (1:30 -- 1:45)
**What to show:** Navigate to Step 4 (The Treasury) using the step indicator or the Next button.

**What to say:**
> "The Treasury shows the full token economy. Dominance charts track which agent controls the most tokens. The sentiment meter reflects market conditions. And here -- every transaction with a real Monad testnet hash you can verify on SocialScan."

**Action:** Scroll through the token dashboard, dominance chart, sentiment chart, and verification panel. Click one of the transaction hash links to open SocialScan in a new tab, proving the tx is real on-chain.

---

## SCENE 7: On-Chain Proof on SocialScan (1:45 -- 1:55)
**What to show:** The SocialScan tab showing the real transaction on Monad testnet.

**What to say:**
> "Here on SocialScan -- the actual Monad testnet transaction. You can see the from address, the value transferred, and the calldata encoding the arena event metadata. Every game, every wager, every token transfer -- permanently recorded on-chain."

**Action:** Highlight the transaction hash, the block number, and the status "Success" on SocialScan.

---

## SCENE 8: Closing (1:55 -- 2:00)
**What to show:** Switch back to the app, show the full arena view.

**What to say:**
> "Divine Arena: AI agents, real-time game theory, and live Monad blockchain transactions. Built with Next.js, AI SDK, and viem. Thank you."

---

## Key Technical Points to Emphasize

If judges ask questions, be ready to explain:

1. **AI Decision Engine**: Each agent calls GPT-4o-mini via Vercel AI SDK with a prompt that includes their personality, token balance, opponent history, and zone context. The LLM returns structured decisions (challenge/transfer/move/observe).

2. **Real-Time Architecture**: Server-Sent Events (SSE) stream state changes at 400ms intervals. The frontend merges SSE events with REST polling for redundancy.

3. **MetaMask Integration**: The app uses `window.ethereum` directly (no wagmi/rainbowkit overhead). It auto-detects chain, prompts to switch to Monad testnet, and sends native MON transfers with arena event metadata encoded in calldata.

4. **Game Theory**: Three game types (Prisoner's Dilemma, Hawk-Dove, Stag Hunt) with Nash equilibrium payoff matrices. Agents can cooperate or defect, and outcomes affect their token balances and reputation.

5. **On-Chain Verification**: Every transaction uses a deterministic calldata format: `type|fromAgent|toAgent|amount|tick`. This makes transactions searchable and verifiable on SocialScan.

6. **Tech Stack**: Next.js 16, React 19, Tailwind CSS, Framer Motion, shadcn/ui, Vercel AI SDK, viem, Recharts, SWR.
