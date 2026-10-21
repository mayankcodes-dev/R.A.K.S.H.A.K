'use client';

/**
 * SapientStatusFeed — Real-time SAPIENT v7 message stream.
 * Shows detection reports, alerts, and phase transitions in NATO SAPIENT wire format.
 * Phase 0: Messages generated client-side from game state.
 * Phase 2: Subscribe to WebSocket /simulation/ws — consume SAPIENT_DETECTION events.
 */

import { useEffect, useRef, useState } from 'react';
import { useGameStore, type GamePhase } from '@/lib/gameStore';

interface SapientMessage {
  id: string;
  type: 'DETECTION' | 'ALERT' | 'STATUS' | 'TRACK_UPDATE' | 'PHASE_CHANGE';
  timestamp: string;
  sensorId: string;
  body: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
}

function genMsgId() {
  return `SAPIENT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function nowTs() {
  return new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
}

const TYPE_COLOR: Record<SapientMessage['type'], string> = {
  DETECTION:   '#00ff41',
  ALERT:       '#ff6600',
  STATUS:      '#3399ff',
  TRACK_UPDATE:'#aabbcc',
  PHASE_CHANGE:'#ffaa00',
};

const TYPE_LABEL: Record<SapientMessage['type'], string> = {
  DETECTION:   'DET',
  ALERT:       'ALT',
  STATUS:      'STS',
  TRACK_UPDATE:'TRK',
  PHASE_CHANGE:'PHZ',
};

/** Generate SAPIENT messages based on game phase transitions */
function messagesForPhase(phase: GamePhase, scenarioId: string): SapientMessage[] {
  const isFPV = scenarioId === 'fiber_optic_fpv';
  switch (phase) {
    case 'SCANNING':
      return [{
        id: genMsgId(), type: 'STATUS', sensorId: 'RADAR-01',
        timestamp: nowTs(),
        body: 'Radar sweep active. PRF=1kHz. Sector: 000°–360°.',
      }];
    case 'DETECTED':
      return [
        {
          id: genMsgId(), type: 'DETECTION', sensorId: 'RADAR-01',
          timestamp: nowTs(),
          body: `Contact TRK-001 @ Az=047° R=2.4km Alt=120m V=18m/s ${isFPV ? '| RF: NIL (fiber-optic)' : '| RF: 2.4GHz 82mW'}`,
          severity: 'WARNING',
        },
        {
          id: genMsgId(), type: 'STATUS', sensorId: 'EOIR-01',
          timestamp: nowTs(),
          body: 'EO/IR cued to Az=047°. Acquiring thermal lock.',
        },
      ];
    case 'CLASSIFYING':
      return [{
        id: genMsgId(), type: 'TRACK_UPDATE', sensorId: 'μ-DPL-01',
        timestamp: nowTs(),
        body: `μ-Doppler: ${isFPV ? 'FPV/FIBER-OPTIC class. Blade flash 320Hz. UNJAMMABLE.' : 'MULTI-ROTOR class. Blade flash 180Hz. Confidence 91%.'}`,
        severity: isFPV ? 'CRITICAL' : 'INFO',
      }];
    case 'AWAITING_ACTION':
      return [{
        id: genMsgId(), type: 'ALERT', sensorId: 'FUSION-NODE',
        timestamp: nowTs(),
        body: `⚠ THREAT CLASSIFIED. Engage authority required. ${isFPV ? 'RF-JAM INEFFECTIVE — use KINETIC/ACOUSTIC.' : 'All countermeasures authorised.'}`,
        severity: 'CRITICAL',
      }];
    case 'WRONG_ACTION':
      return [{
        id: genMsgId(), type: 'ALERT', sensorId: 'FUSION-NODE',
        timestamp: nowTs(),
        body: 'ROE REVIEW: Selected countermeasure suboptimal for threat profile. Retry.',
        severity: 'CRITICAL',
      }];
    case 'CORRECT_ACTION':
      return [{
        id: genMsgId(), type: 'PHASE_CHANGE', sensorId: 'OPERATOR',
        timestamp: nowTs(),
        body: 'ENGAGE CONFIRMED. Kill-chain: DETECT✓ CLASSIFY✓ TRACK✓ ENGAGE►',
        severity: 'INFO',
      }];
    case 'NEUTRALIZED':
      return [
        {
          id: genMsgId(), type: 'DETECTION', sensorId: 'EOIR-01',
          timestamp: nowTs(),
          body: 'BDA: Target destroyed. Debris field confirmed Az=047° R=2.4km.',
          severity: 'INFO',
        },
        {
          id: genMsgId(), type: 'PHASE_CHANGE', sensorId: 'FUSION-NODE',
          timestamp: nowTs(),
          body: 'Kill-chain COMPLETE. DETECT✓ CLASSIFY✓ TRACK✓ ENGAGE✓ ASSESS►',
        },
      ];
    default:
      return [];
  }
}

export function SapientStatusFeed() {
  const phase = useGameStore((s) => s.phase);
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const getScenario = useGameStore((s) => s.getScenario);
  const scenario = getScenario();

  const [messages, setMessages] = useState<SapientMessage[]>([]);

  // Initialise the boot message on the client only (avoids Date.now() during prerender)
  useEffect(() => {
    setMessages([{
      id: genMsgId(), type: 'STATUS', sensorId: 'SYS',
      timestamp: nowTs(),
      body: 'SAPIENT v7 ONLINE. Session initialised. Sensor array nominal.',
    }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevPhase = useRef<GamePhase>('BRIEFING');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === prevPhase.current) return;
    prevPhase.current = phase;

    const newMsgs = messagesForPhase(phase, scenario.id);
    if (newMsgs.length === 0) return;

    setMessages((prev) => {
      const next = [...prev, ...newMsgs].slice(-20); // keep last 20
      return next;
    });
  }, [phase, scenario.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
          SAPIENT v7
        </span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#00ff41] animate-pulse" />
          <span className="text-[8px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>LIVE</span>
        </div>
      </div>

      <div
        ref={feedRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-0.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {messages.map((msg) => {
          const color = TYPE_COLOR[msg.type];
          const isCritical = msg.severity === 'CRITICAL';
          return (
            <div
              key={msg.id}
              className="rounded px-2 py-1.5 transition-all"
              style={{
                background: isCritical ? 'rgba(255,102,0,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isCritical ? 'rgba(255,102,0,0.15)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="text-[7px] px-1 py-0.5 rounded font-bold tracking-wider"
                  style={{ background: `${color}18`, color, fontFamily: '"Orbitron", sans-serif' }}
                >
                  {TYPE_LABEL[msg.type]}
                </span>
                <span className="text-[8px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {msg.sensorId}
                </span>
                <span className="ml-auto text-[7px] text-[#223344]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {msg.timestamp}
                </span>
              </div>
              <p
                className="text-[9px] leading-relaxed"
                style={{
                  color: isCritical ? '#cc8844' : '#445566',
                  fontFamily: '"JetBrains Mono", monospace',
                  wordBreak: 'break-word',
                }}
              >
                {msg.body}
              </p>
            </div>
          );
        })}
      </div>

      {wrongAttempts > 0 && (
        <div
          className="mt-1.5 flex items-center gap-2 px-2 py-1.5 rounded"
          style={{ background: 'rgba(255,0,51,0.06)', border: '1px solid rgba(255,0,51,0.15)' }}
        >
          <span className="text-[8px] text-[#ff0033]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            ✗ {wrongAttempts} ROE REVIEW — −{wrongAttempts * 15}pts
          </span>
        </div>
      )}
    </div>
  );
}
