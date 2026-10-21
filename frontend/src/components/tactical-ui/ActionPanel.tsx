'use client';

import { useState } from 'react';
import { useGameStore, type ActionType } from '@/lib/gameStore';
import { IconRFJam, IconGPSSpoof, IconKineticIntercept, IconWarning } from '@/components/ui/Icons';
import { playButtonClick } from '@/lib/soundEngine';

interface ActionDef {
  id: ActionType;
  label: string;
  shortkey: string;
  Icon: React.FC<{ size?: number; color?: string; className?: string }>;
  activeColor: string;
  glowColor: string;
}

const ACTIONS: ActionDef[] = [
  {
    id: 'RF_JAM',
    label: 'RF JAM',
    shortkey: 'F1',
    Icon: IconRFJam,
    activeColor: '#ff6600',
    glowColor: 'rgba(255,102,0,0.25)',
  },
  {
    id: 'GPS_SPOOF',
    label: 'GPS SPOOF',
    shortkey: 'F2',
    Icon: IconGPSSpoof,
    activeColor: '#00aaff',
    glowColor: 'rgba(0,170,255,0.25)',
  },
  {
    id: 'KINETIC_INTERCEPT',
    label: 'KINETIC',
    shortkey: 'F3',
    Icon: IconKineticIntercept,
    activeColor: '#ff0033',
    glowColor: 'rgba(255,0,51,0.25)',
  },
];

export function ActionPanel() {
  const phase = useGameStore((s) => s.phase);
  const executeAction = useGameStore((s) => s.executeAction);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const getScenario = useGameStore((s) => s.getScenario);
  const [pressed, setPressed] = useState<ActionType | null>(null);

  const isWrong = phase === 'WRONG_ACTION';
  const scenario = getScenario();

  const handleAction = (id: ActionType) => {
    playButtonClick();
    setPressed(id);
    setTimeout(() => setPressed(null), 300);
    executeAction(id);
  };

  return (
    <div
      style={{
        background: 'rgba(5,10,18,0.97)',
        borderTop: '1px solid rgba(255,102,0,0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Error strip — compact, only on wrong action */}
      {errorMessage && isWrong && (
        <div
          className="px-4 py-2 flex items-center gap-2 border-b border-[rgba(255,0,51,0.15)]"
          style={{ background: 'rgba(255,0,51,0.06)', animation: 'fadeInUp 0.2s ease-out' }}
        >
          <IconWarning size={12} color="#ff0033" className="flex-shrink-0" />
          <span className="text-[10px] text-[#ff0033]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            {errorMessage}
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[9px] tracking-[0.3em] text-[#ff6600] animate-pulse" style={{ fontFamily: '"Orbitron", sans-serif' }}>
          ▶ SELECT COUNTERMEASURE
        </span>
        <span className="text-[9px] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          {scenario.id === 'urban_ambush' ? 'ROE: EW ONLY — KINETIC PROHIBITED' : 'ENGAGEMENT WINDOW OPEN'}
        </span>
      </div>

      {/* Three large action buttons */}
      <div className="grid grid-cols-3 gap-0">
        {ACTIONS.map((action, idx) => {
          const isBeingPressed = pressed === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className="relative flex flex-col items-center justify-center gap-2 py-5 transition-all duration-150"
              style={{
                background: isBeingPressed ? `${action.activeColor}10` : 'transparent',
                borderRight: idx < ACTIONS.length - 1 ? '1px solid rgba(255,102,0,0.1)' : 'none',
                borderTop: '1px solid rgba(255,102,0,0.1)',
                cursor: 'pointer',
                transform: isBeingPressed ? 'scale(0.97)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `${action.activeColor}0d`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {/* Animated top edge */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${action.activeColor}, transparent)`,
                  animation: 'shimmer 2s ease-in-out infinite',
                }}
              />

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{
                  background: `${action.activeColor}10`,
                  border: `1px solid ${action.activeColor}30`,
                  boxShadow: `0 0 16px ${action.glowColor}`,
                }}
              >
                <action.Icon size={26} color={action.activeColor} />
              </div>

              {/* Label */}
              <span
                className="text-xs font-bold tracking-[0.2em]"
                style={{ color: action.activeColor, fontFamily: '"Orbitron", sans-serif' }}
              >
                {action.label}
              </span>

              {/* Hotkey */}
              <span
                className="text-[8px] px-1.5 py-0.5 rounded"
                style={{
                  color: '#445566',
                  border: '1px solid rgba(0,255,65,0.08)',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                {action.shortkey}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
