# R.A.K.S.H.A.K.
**Rapid Autonomous Kill-chain Simulation for Hostile Aerial Kontrol**

> Counter-Unmanned Aerial System (C-UAS) tactical training simulator. No backend. No cloud. No latency. All judgment.

---

## What It Is

A browser-native military training environment that simulates live C-UAS decision cycles — from detection to kinetic/non-kinetic response — with real-time scoring, after-action review, and zero infrastructure overhead.

Built for operators who need to think in seconds, not minutes.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                     │
│                                                         │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────┐  │
│  │  Zustand FSM │──▶│  Mission Engine│──▶│  Scoring │  │
│  │  Game State  │   │  (Phases 0-5)  │   │  + AAR   │  │
│  └──────────────┘   └────────────────┘   └──────────┘  │
│          │                   │                          │
│  ┌───────▼──────┐   ┌────────▼───────┐                 │
│  │  Three.js 3D │   │  Web Audio API │                 │
│  │  Scene + EW  │   │  Oscillator    │                 │
│  │  Emulation   │   │  Synthesis     │                 │
│  └──────────────┘   └────────────────┘                 │
│          │                                              │
│  ┌───────▼──────────────────────────────────────┐      │
│  │         Canvas 2D — Radar / Particle HUD      │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Core Systems

| System | Implementation | Notes |
|--------|---------------|-------|
| **State Machine** | Zustand store with typed phase enum (`BRIEFING → ACTIVE → DEBRIEF`) | Cancelable timer refs, no memory leaks |
| **3D Simulation** | Three.js + `@react-three/fiber` | Physics-approximated drone trajectories, EW jamming cone geometry |
| **Procedural Audio** | Web Audio API — `OscillatorNode` + `GainNode` synthesis chains | Zero audio files shipped. All sound generated at runtime |
| **Sensor Emulation** | Canvas 2D radar with sweep animation, signal-strength decay curves | Models RF detection envelope |
| **Particle Engine** | Custom Canvas 2D particle system for explosion/EW burst effects | No external animation lib |
| **Scoring Engine** | Weighted decision-tree evaluator — accuracy × speed × ROE compliance | Produces percentile score + mission grade |
| **AAR Analytics** | Chart.js radar (competency map) + bar (decision timeline) | Identifies operator blind spots |
| **Boot Sequence** | Staged terminal emulator with real asset preloading gated behind it | No placeholder stubs |

---

## Scenarios

### `SCENARIO-001` — Silent Intruder
Fiber-optic FPV drone. No RF signature. Visual detection only. Tests: target acquisition under RF-null conditions.

### `SCENARIO-002` — Swarm Storm
12-drone autonomous swarm with distributed tasking. Tests: priority triage, simultaneous engagement, kill-chain saturation.

### `SCENARIO-003` — Urban Ambush
Civilian airspace overlap. Hard ROE constraints. Tests: IFF (Identification Friend or Foe), proportional response, escalation authority.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, fully static) |
| Language | TypeScript 5 (strict) |
| State | Zustand 5 (FSM pattern) |
| 3D | Three.js 0.186 + React Three Fiber 9 |
| Charts | Chart.js 4 + react-chartjs-2 |
| Animation | Framer Motion 14 |
| Styling | Tailwind CSS v4 |
| Audio | Web Audio API (native, no polyfill) |
| Fonts | Orbitron (tactical display) + JetBrains Mono (data readout) |
| Deploy | Vercel (static export, zero serverless) |

---

## Run Locally

```bash
git clone https://github.com/mayankcodes-dev/R.A.K.S.H.A.K.git
cd R.A.K.S.H.A.K
npm install
npm run dev
# → http://localhost:3000
```

**Build for production:**
```bash
npm run build   # outputs to .next/ — all 4 routes static
npm start
```

**Type check:**
```bash
npx tsc --noEmit   # must exit 0
```

---

## Design Principles

- **No backend** — every computation runs in the operator's browser
- **No external assets** — audio synthesized at runtime, no CDN dependencies in critical path
- **No emoji** — military terminal aesthetic enforced throughout
- **Accessible** — keyboard-navigable decision panels, ARIA labels on interactive elements

---

## Project Structure

```
rakshak/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing — boot sequence + scenario select
│   │   ├── simulation/       # Live mission environment
│   │   ├── aar/              # After-action review + analytics
│   │   └── layout.tsx
│   ├── components/
│   │   ├── tactical-ui/      # HUD, radar, status feed, decision panels
│   │   ├── ui/               # Visual effects, glitch text, particles
│   │   └── three/            # 3D scene components
│   ├── lib/
│   │   └── gameStore.ts      # Zustand FSM — single source of truth
│   └── data/
│       └── scenarios/        # Scenario definitions + decision trees
├── public/
└── next.config.ts
```

---

*R.A.K.S.H.A.K. is a training simulation system. All scenarios are fictional. No classified information is used or implied.*
