'use client';

/**
 * KillChainIndicator — horizontal progress strip showing the 5-phase kill-chain.
 * Reads current phase from gameStore and maps it to the DETECT→CLASSIFY→TRACK→ENGAGE→ASSESS model.
 *
 * Visual: [DETECT] ——— [CLASSIFY] ——— [TRACK] ——— [ENGAGE] ——— [ASSESS]
 *          ✓ done       ✓ done        ● active      ○ pending    ○ pending
 */

import { useGameStore, type GamePhase } from '@/lib/gameStore';

const KILL_CHAIN = [
  { id: 'DETECT',   label: 'DETECT',   abbr: 'D' },
  { id: 'CLASSIFY', label: 'CLASSIFY', abbr: 'C' },
  { id: 'TRACK',    label: 'TRACK',    abbr: 'T' },
  { id: 'ENGAGE',   label: 'ENGAGE',   abbr: 'E' },
  { id: 'ASSESS',   label: 'ASSESS',   abbr: 'A' },
] as const;

/** Map GamePhase → kill-chain step index (0-based) */
function phaseToKillChainIdx(phase: GamePhase): number {
  switch (phase) {
    case 'BRIEFING':
    case 'SCANNING':
      return -1; // not started
    case 'DETECTED':
      return 0; // DETECT active
    case 'CLASSIFYING':
      return 1; // CLASSIFY active
    case 'AWAITING_ACTION':
    case 'WRONG_ACTION':
      return 2; // TRACK active (pre-engage)
    case 'CORRECT_ACTION':
    case 'ENGAGEMENT':
      return 3; // ENGAGE active
    case 'NEUTRALIZED':
      return 4; // ASSESS active
    default:
      return -1;
  }
}

export function KillChainIndicator() {
  const phase = useGameStore((s) => s.phase);
  const activeIdx = phaseToKillChainIdx(phase);

  return (
    <div className="flex items-center gap-0">
      {KILL_CHAIN.map((step, i) => {
        const isDone    = i < activeIdx;
        const isActive  = i === activeIdx;
        const isPending = i > activeIdx;

        const dotColor = isDone
          ? '#00ff41'
          : isActive
          ? (step.id === 'ENGAGE' ? '#ff6600' : '#00ff41')
          : '#1a2535';

        const labelColor = isDone
          ? '#224433'
          : isActive
          ? (step.id === 'ENGAGE' ? '#ff6600' : '#00ff41')
          : '#223344';

        const lineColor = isDone ? 'rgba(0,255,65,0.25)' : 'rgba(255,255,255,0.04)';

        return (
          <div key={step.id} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'animate-pulse' : ''}`}
                style={{
                  background: isDone ? 'rgba(0,255,65,0.1)' : isActive ? `${dotColor}20` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isDone ? 'rgba(0,255,65,0.3)' : isActive ? dotColor : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: isActive ? `0 0 8px ${dotColor}60` : 'none',
                }}
              >
                {isDone ? (
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <path d="M1.5 4l2 2L6.5 2" stroke="#00ff41" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isActive ? dotColor : '#1a2535' }}
                  />
                )}
              </div>
              <span
                className="text-[7px] tracking-widest leading-none"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  color: labelColor,
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                {step.abbr === 'D' ? 'DET' : step.abbr === 'C' ? 'CLF' : step.abbr === 'T' ? 'TRK' : step.abbr === 'E' ? 'ENG' : 'ASS'}
              </span>
            </div>

            {/* Connector line (not after last) */}
            {i < KILL_CHAIN.length - 1 && (
              <div
                className="w-8 h-px mx-0.5 transition-all duration-700"
                style={{ background: lineColor }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
