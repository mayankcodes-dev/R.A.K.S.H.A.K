'use client';

import { useState } from 'react';
import { useGameStore, type ActionType } from '@/lib/gameStore';
import { IconRFJam, IconGPSSpoof, IconKineticIntercept, IconWarning } from '@/components/ui/Icons';
import { playButtonClick } from '@/lib/soundEngine';

interface ActionDef {
  id: ActionType;
  label: string;
  description: string;
  shortkey: string;
  Icon: React.FC<{ size?: number; color?: string; className?: string }>;
  activeColor: string;
  glowColor: string;
}

const ACTIONS: ActionDef[] = [
  {
    id: 'RF_JAM',
    label: 'RF JAM',
    description: 'Electronic warfare — disrupt RF control link',
    shortkey: 'F1',
    Icon: IconRFJam,
    activeColor: '#ff6600',
    glowColor: 'rgba(255,102,0,0.2)',
  },
  {
    id: 'GPS_SPOOF',
    label: 'GPS SPOOF',
    description: 'Navigation spoofing — redirect via false GPS signal',
    shortkey: 'F2',
    Icon: IconGPSSpoof,
    activeColor: '#00aaff',
    glowColor: 'rgba(0,170,255,0.2)',
  },
  {
    id: 'KINETIC_INTERCEPT',
    label: 'KINETIC INTERCEPT',
    description: 'Hard-kill — launch interceptor drone',
    shortkey: 'F3',
    Icon: IconKineticIntercept,
    activeColor: '#ff0033',
    glowColor: 'rgba(255,0,51,0.2)',
  },
];

export function ActionPanel() {
  const phase = useGameStore((s) => s.phase);
  const executeAction = useGameStore((s) => s.executeAction);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const getScenario = useGameStore((s) => s.getScenario);
  const [pressed, setPressed] = useState<ActionType | null>(null);

  const isActionPhase = phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION';
  const isDisabled = !isActionPhase;
  const scenario = getScenario();

  const handleAction = (id: ActionType) => {
    if (isDisabled) return;
    playButtonClick();
    setPressed(id);
    setTimeout(() => setPressed(null), 300);
    executeAction(id);
  };

  return (
    <div className="space-y-2">
      {/* Error message */}
      {errorMessage && (
        <div
          className="rounded p-3"
          style={{
            background: 'rgba(255,0,51,0.08)',
            border: '1px solid rgba(255,0,51,0.3)',
            animation: 'fadeInUp 0.3s ease-out',
          }}
        >
          <div className="flex items-start gap-2">
            <IconWarning size={14} color="#ff0033" className="flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed" style={{ color: '#ff0033', fontFamily: '"JetBrains Mono", monospace' }}>
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] tracking-[0.25em] text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
          COUNTERMEASURES
        </span>
        {isActionPhase && (
          <div className="flex-1 h-px bg-gradient-to-r from-[rgba(255,102,0,0.3)] to-transparent" />
        )}
        {!isActionPhase && (
          <div className="flex-1 h-px bg-[rgba(0,255,65,0.05)]" />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {ACTIONS.map((action) => {
          const isActive = isActionPhase;
          const isBeingPressed = pressed === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              disabled={isDisabled}
              className="flex-1 relative rounded p-3 text-center transition-all duration-200 group overflow-hidden"
              style={{
                background: isActive
                  ? 'rgba(10,14,20,0.95)'
                  : 'rgba(10,14,20,0.5)',
                border: isActive
                  ? `1px solid ${action.activeColor}40`
                  : '1px solid rgba(0,255,65,0.06)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.35 : 1,
                transform: isBeingPressed ? 'scale(0.97)' : 'scale(1)',
                boxShadow: isActive ? `0 0 12px ${action.glowColor}` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled) {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 25px ${action.glowColor}`;
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${action.activeColor}70`;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = isActive ? `0 0 12px ${action.glowColor}` : 'none';
                (e.currentTarget as HTMLButtonElement).style.borderColor = isActive ? `${action.activeColor}40` : 'rgba(0,255,65,0.06)';
              }}
            >
              {/* Animated border top */}
              {isActive && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${action.activeColor}, transparent)`,
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                />
              )}

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center transition-colors"
                style={{
                  background: isActive ? `${action.activeColor}12` : 'rgba(0,255,65,0.03)',
                  border: isActive ? `1px solid ${action.activeColor}25` : '1px solid rgba(0,255,65,0.06)',
                  color: isActive ? action.activeColor : '#334455',
                }}
              >
                <action.Icon size={22} color="currentColor" />
              </div>

              {/* Label */}
              <p
                className="text-[10px] font-bold tracking-wider mb-1"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  color: isActive ? action.activeColor : '#334455',
                }}
              >
                {action.label}
              </p>

              {/* Description */}
              <p
                className="text-[9px] leading-relaxed"
                style={{ color: '#334455', fontFamily: '"JetBrains Mono", monospace' }}
              >
                {action.description}
              </p>

              {/* Hotkey badge */}
              <div
                className="absolute top-1 right-1 text-[8px] px-1 rounded"
                style={{
                  color: '#334455',
                  border: '1px solid rgba(0,255,65,0.06)',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {action.shortkey}
              </div>
            </button>
          );
        })}
      </div>

      {/* Prompt */}
      {isActionPhase && (
        <div
          className="flex items-center justify-center gap-2 py-1.5 rounded"
          style={{
            background: 'rgba(255,102,0,0.05)',
            border: '1px solid rgba(255,102,0,0.15)',
            animation: 'borderPulse 1.5s ease-in-out infinite',
          }}
        >
          <IconWarning size={11} color="#ff6600" />
          <span
            className="text-[10px] tracking-widest text-[#ff6600]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            {scenario.id === 'urban_ambush'
              ? 'ROE ACTIVE — EW ONLY. KINETIC PROHIBITED.'
              : 'SELECT COUNTERMEASURE — ENGAGEMENT WINDOW OPEN'}
          </span>
          <IconWarning size={11} color="#ff6600" />
        </div>
      )}

      {/* Locked state */}
      {!isActionPhase && phase !== 'BRIEFING' && (
        <div className="text-center">
          <span
            className="text-[9px] tracking-widest text-[#223344]"
            style={{ fontFamily: '"JetBrains Mono", monospace' }}
          >
            COUNTERMEASURES LOCKED — AWAITING THREAT IDENTIFICATION
          </span>
        </div>
      )}
    </div>
  );
}
