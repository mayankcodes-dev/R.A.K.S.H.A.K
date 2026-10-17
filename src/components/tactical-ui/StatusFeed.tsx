'use client';

import { useGameStore, type GamePhase } from '@/lib/gameStore';
import { IconTarget, IconRadar, IconShield, IconWarning, IconExplosion } from '@/components/ui/Icons';

interface PhaseStep {
  phase: GamePhase;
  label: string;
  sublabel: string;
  icon: React.FC<{ size?: number; color?: string }>;
}

const STEPS: PhaseStep[] = [
  { phase: 'SCANNING',         label: 'SCANNING',     sublabel: 'Radar sweep active',     icon: IconRadar },
  { phase: 'DETECTED',         label: 'CONTACT',      sublabel: 'Track acquired',         icon: IconTarget },
  { phase: 'CLASSIFYING',      label: 'CLASSIFY',     sublabel: 'Analyzing signature',    icon: IconSensor },
  { phase: 'AWAITING_ACTION',  label: 'ENGAGE',       sublabel: 'Select countermeasure',  icon: IconWarning },
  { phase: 'NEUTRALIZED',      label: 'NEUTRALIZED',  sublabel: 'Sector clear',           icon: IconShield },
];

function IconSensor({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12 C5 8.13 8.13 5 12 5 C15.87 5 19 8.13 19 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 12 C8 9.79 9.79 8 12 8 C14.21 8 16 9.79 16 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="14" x2="12" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="20" x2="16" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const PHASE_ORDER: GamePhase[] = [
  'SCANNING', 'DETECTED', 'CLASSIFYING', 'AWAITING_ACTION',
  'WRONG_ACTION', 'CORRECT_ACTION', 'ENGAGEMENT', 'NEUTRALIZED',
];

export function StatusFeed() {
  const phase = useGameStore((s) => s.phase);
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const score = useGameStore((s) => s.score);
  // Note: missionTime removed — was subscribed but unused, caused 60fps re-renders (BUG-12)

  const currentIdx = PHASE_ORDER.indexOf(phase);

  return (
    <div className="space-y-2 h-full flex flex-col">
      {/* Phase progress steps */}
      <div className="space-y-1 flex-1">
        {STEPS.map((step, i) => {
          const stepPhaseIdx = PHASE_ORDER.indexOf(step.phase);
          const isDone = currentIdx > stepPhaseIdx && phase !== 'BRIEFING';
          const isCurrent = phase === step.phase ||
            (step.phase === 'AWAITING_ACTION' && phase === 'WRONG_ACTION') ||
            (step.phase === 'NEUTRALIZED' && (phase === 'CORRECT_ACTION' || phase === 'ENGAGEMENT' || phase === 'NEUTRALIZED'));
          const isPending = !isDone && !isCurrent;

          const color = isCurrent
            ? (step.phase === 'AWAITING_ACTION' ? '#ff6600' : step.phase === 'NEUTRALIZED' ? '#00ff41' : '#00ff41')
            : isDone ? '#224433' : '#1a2230';
          const textColor = isCurrent ? (step.phase === 'AWAITING_ACTION' ? '#ff6600' : '#00ff41')
            : isDone ? '#33664d' : '#334455';
          const subColor = isCurrent ? '#556677' : isDone ? '#2a4a38' : '#223344';

          return (
            <div
              key={step.phase}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded transition-all duration-500"
              style={{
                background: isCurrent ? `${color}08` : 'transparent',
                border: isCurrent ? `1px solid ${color}20` : '1px solid transparent',
              }}
            >
              {/* Icon */}
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: isCurrent ? `${color}15` : isDone ? 'rgba(0,255,65,0.04)' : 'transparent',
                  color: textColor,
                }}
              >
                {isDone
                  ? <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#224433' }} />
                  : <step.icon size={12} color={textColor} />
                }
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-bold tracking-wider leading-none"
                  style={{ color: textColor, fontFamily: '"Orbitron", sans-serif' }}
                >
                  {step.label}
                </p>
                <p
                  className="text-[9px] mt-0.5 leading-none"
                  style={{ color: subColor, fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {isCurrent && step.phase === 'AWAITING_ACTION' && wrongAttempts > 0
                    ? `${wrongAttempts} wrong attempt${wrongAttempts > 1 ? 's' : ''}`
                    : step.sublabel}
                </p>
              </div>

              {/* Status dot */}
              <div
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCurrent ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: isCurrent ? color : isDone ? '#224433' : '#1a2230' }}
              />
            </div>
          );
        })}
      </div>

      {/* Wrong attempts warning */}
      {wrongAttempts > 0 && (
        <div
          className="flex items-center gap-2 px-2 py-1.5 rounded"
          style={{ background: 'rgba(255,0,51,0.06)', border: '1px solid rgba(255,0,51,0.15)' }}
        >
          <IconWarning size={10} color="#ff0033" />
          <span className="text-[9px] text-[#ff0033]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {wrongAttempts} INCORRECT — -{wrongAttempts * 15} pts
          </span>
        </div>
      )}
    </div>
  );
}
