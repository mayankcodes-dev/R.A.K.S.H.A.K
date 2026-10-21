'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/lib/gameStore';
import { RadarScope } from '@/components/tactical-ui/RadarScope';
import { KillChainIndicator } from '@/components/tactical-ui/KillChainIndicator';
import { MicroDopplerPanel } from '@/components/tactical-ui/MicroDopplerPanel';
import { ActionPanel } from '@/components/tactical-ui/ActionPanel';
import { MissionTimer } from '@/components/tactical-ui/MissionTimer';
import { TacticalBackground, Vignette, ParticleExplosion, GlitchEffect } from '@/components/ui/VisualEffects';
import { IconWarning, IconExplosion, IconShield } from '@/components/ui/Icons';
import {
  playContactAlert,
  playThreatWarning,
  playWrongAction,
  playCorrectAction,
  playExplosion,
} from '@/lib/soundEngine';

const SimulationScene = dynamic(
  () => import('@/components/three/SimulationScene').then((mod) => mod.SimulationScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#050a12] flex items-center justify-center">
        <div
          className="w-6 h-6 border-2 border-t-transparent rounded-full"
          style={{ borderColor: '#00ff41', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}
        />
      </div>
    ),
  }
);

export default function SimulationPage() {
  const router = useRouter();
  const phase = useGameStore((s) => s.phase);
  const missionTime = useGameStore((s) => s.missionTime);
  const droneWave = useGameStore((s) => s.droneWave);
  const totalWaves = useGameStore((s) => s.totalWaves);
  const startMission = useGameStore((s) => s.startMission);
  const detectTarget = useGameStore((s) => s.detectTarget);
  const classifyTarget = useGameStore((s) => s.classifyTarget);
  const promptAction = useGameStore((s) => s.promptAction);
  const completeEngagement = useGameStore((s) => s.completeEngagement);
  const showAAR = useGameStore((s) => s.showAAR);
  const getScenario = useGameStore((s) => s.getScenario);
  const prevPhase = useRef(phase);

  const scenario = getScenario();
  const isFPV = scenario.id === 'fiber_optic_fpv';

  // ── Auto-start on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'BRIEFING') startMission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scenario event progression ────────────────────────────────────────
  useEffect(() => {
    const events = scenario.events;
    const detectEvent = events.find((e) => e.type === 'RADAR_CONTACT');
    const classifyEvent = events.find((e) => e.type === 'CLASSIFICATION');
    const promptEvent = events.find((e) => e.type === 'PROMPT_ACTION');

    if (phase === 'SCANNING' && missionTime >= ((detectEvent as any)?.time ?? 5)) detectTarget();
    if (phase === 'DETECTED' && missionTime >= ((classifyEvent as any)?.time ?? 10)) classifyTarget();
    if (phase === 'CLASSIFYING' && missionTime >= ((promptEvent as any)?.time ?? 15)) promptAction();
  }, [phase, missionTime, scenario, detectTarget, classifyTarget, promptAction]);

  // ── Phase sounds ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === prevPhase.current) return;
    switch (phase) {
      case 'DETECTED': playContactAlert(); break;
      case 'AWAITING_ACTION':
        if (prevPhase.current === 'CLASSIFYING') playThreatWarning();
        break;
      case 'WRONG_ACTION': playWrongAction(); break;
      case 'CORRECT_ACTION': playCorrectAction(); break;
      case 'NEUTRALIZED': playExplosion(); break;
    }
    prevPhase.current = phase;
  }, [phase]);

  // ── Engagement completion (correct → neutralized) ─────────────────────
  useEffect(() => {
    if (phase === 'CORRECT_ACTION') {
      const t = setTimeout(() => completeEngagement(), 2500);
      return () => clearTimeout(t);
    }
  }, [phase, completeEngagement]);

  // ── AAR redirect after all 3 waves ────────────────────────────────────
  useEffect(() => {
    if (phase === 'AAR') {
      showAAR();
      router.push('/trainee/aar');
    }
  }, [phase, showAAR, router]);

  const isActionPhase = phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION';
  const isThreatActive = ['DETECTED', 'CLASSIFYING', 'AWAITING_ACTION', 'WRONG_ACTION'].includes(phase);
  const isNeutralized = phase === 'NEUTRALIZED';

  // Confidence + range for minimal right panel
  const confidence = useGameStore.getState().threatConfidence;
  const distance = useGameStore.getState().droneDistance;

  return (
    <div className="relative min-h-screen bg-[#050a12] overflow-hidden" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
      <TacticalBackground variant="hex" />
      <Vignette />

      {/* FX overlays */}
      <GlitchEffect active={phase === 'WRONG_ACTION'} />
      <ParticleExplosion active={isNeutralized} x={50} y={40} count={60} color="#ff6600" />

      {/* ── Top bar ── */}
      <div
        className="relative z-20 flex items-center gap-4 px-4 py-2 border-b"
        style={{ borderColor: 'rgba(0,255,65,0.08)', background: 'rgba(5,10,18,0.98)' }}
      >
        {/* Live indicator + scenario */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isThreatActive ? '#ff0033' : '#00ff41', boxShadow: `0 0 6px ${isThreatActive ? '#ff0033' : '#00ff41'}` }}
            />
            <span className="text-[10px] tracking-widest" style={{ color: isThreatActive ? '#ff0033' : '#00ff41', fontFamily: '"Orbitron", sans-serif' }}>
              LIVE
            </span>
          </div>
          <div className="w-px h-3 bg-[rgba(0,255,65,0.1)]" />
          <span className="text-[10px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
            {scenario.name.toUpperCase()}
          </span>
        </div>

        {/* Centre — kill chain */}
        <div className="flex-1 flex justify-center">
          <KillChainIndicator />
        </div>

        {/* Right — wave counter + timer */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Wave counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>WAVE</span>
            <div className="flex gap-1">
              {Array.from({ length: totalWaves }, (_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i < droneWave - 1 ? '#00ff4160' : i === droneWave - 1 ? '#00ff41' : '#223344',
                    boxShadow: i === droneWave - 1 ? '0 0 6px #00ff41' : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#00ff41]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
              {droneWave}/{totalWaves}
            </span>
          </div>
          <MissionTimer />
          {isFPV && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: 'rgba(255,102,0,0.07)', border: '1px solid rgba(255,102,0,0.2)' }}>
              <IconWarning size={9} color="#ff6600" />
              <span className="text-[9px] text-[#ff6600] tracking-widest" style={{ fontFamily: '"JetBrains Mono", monospace' }}>RF-IMMUNE</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main grid — 3 cols: LEFT sensors | CENTER 3D | RIGHT minimal info ── */}
      <div className="relative z-10 grid grid-cols-12 gap-0" style={{ height: 'calc(100vh - 41px)' }}>

        {/* LEFT — Radar + Micro-Doppler (3 cols) */}
        <div className="col-span-3 flex flex-col border-r border-[rgba(0,255,65,0.05)]">
          {/* Radar — top half */}
          <div className="flex-1 flex items-center justify-center p-4">
            <RadarScope />
          </div>

          {/* Micro-Doppler — bottom half */}
          <div className="border-t border-[rgba(0,255,65,0.05)] p-3 flex-1">
            <MicroDopplerPanel />
          </div>
        </div>

        {/* CENTER — 3D scene (6 cols) — full height, action panel floats over it */}
        <div className="col-span-6 relative border-r border-[rgba(0,255,65,0.05)]">
          {/* EO/IR label */}
          <div
            className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded"
            style={{ background: 'rgba(5,10,18,0.85)', border: '1px solid rgba(0,255,65,0.07)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isThreatActive ? '#ff0033' : '#ff6600', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span className="text-[9px] tracking-widest text-[#445566]">EO/IR TACTICAL VIEW</span>
          </div>

          {/* FPV warning */}
          {isFPV && isThreatActive && (
            <div
              className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: 'rgba(255,102,0,0.07)', border: '1px solid rgba(255,102,0,0.25)' }}
            >
              <IconWarning size={9} color="#ff6600" />
              <span className="text-[9px] text-[#ff6600] tracking-widest">RF-JAM INEFFECTIVE</span>
            </div>
          )}

          {/* Danger border when awaiting action */}
          {isActionPhase && (
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ border: '2px solid rgba(255,102,0,0.4)', animation: 'borderDanger 1s ease-in-out infinite' }}
            />
          )}

          {/* 3D scene — full height */}
          <SimulationScene />

          {/* ── FLOATING COUNTERMEASURE PANEL ── */}
          {/* Appears as large centered overlay when action phase is active */}
          {isActionPhase && (
            <div
              className="absolute inset-x-0 bottom-0 z-20"
              style={{ animation: 'fadeInUp 0.25s ease-out' }}
            >
              <ActionPanel />
            </div>
          )}
        </div>

        {/* RIGHT — Minimal threat info (3 cols) */}
        <div className="col-span-3 flex flex-col">
          {/* Threat status block — top section */}
          <ThreatInfoPanel phase={phase} />
        </div>
      </div>

      {/* ── WAVE NEUTRALIZED overlay ── */}
      {isNeutralized && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          style={{ animation: 'fadeInUp 0.4s ease-out' }}
        >
          <div
            className="text-center px-16 py-12 rounded-xl"
            style={{
              background: 'rgba(5,10,18,0.96)',
              border: '1px solid rgba(0,255,65,0.25)',
              boxShadow: '0 0 80px rgba(0,255,65,0.08)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(0,255,65,0.07)', border: '1px solid rgba(0,255,65,0.2)' }}
            >
              <IconExplosion size={30} color="#00ff41" />
            </div>
            <div
              className="text-3xl font-bold tracking-[0.15em] mb-3"
              style={{ color: '#00ff41', fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 30px rgba(0,255,65,0.4)' }}
            >
              TARGET NEUTRALIZED
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] text-[#334455]">
                WAVE {droneWave}/{totalWaves}
              </span>
              {droneWave < totalWaves && (
                <span className="text-[10px] text-[#334455]">— NEXT WAVE INCOMING</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Minimal right-panel component (inline) ───────────────────────────────
function ThreatInfoPanel({ phase }: { phase: string }) {
  const confidence = useGameStore((s) => s.threatConfidence);
  const distance = useGameStore((s) => s.droneDistance);
  const getScenario = useGameStore((s) => s.getScenario);
  const scenario = getScenario();

  const isActive = !['BRIEFING', 'SCANNING'].includes(phase);
  const isEngaged = phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION';
  const isFPV = scenario.id === 'fiber_optic_fpv';

  const classLabel = () => {
    if (!isActive) return { text: '—', color: '#334455' };
    if (phase === 'DETECTED') return { text: 'UNIDENTIFIED', color: '#ff6600' };
    if (phase === 'CLASSIFYING') return { text: 'ANALYZING', color: '#ff6600' };
    if (phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION') return { text: 'HOSTILE UAS', color: '#ff0033' };
    if (phase === 'CORRECT_ACTION' || phase === 'ENGAGEMENT') return { text: 'ENGAGING', color: '#ff6600' };
    if (phase === 'NEUTRALIZED') return { text: 'NEUTRALIZED', color: '#00ff41' };
    return { text: '—', color: '#334455' };
  };

  const cls = classLabel();

  return (
    <div className="flex flex-col h-full p-4 gap-6">

      {/* Section label */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-3 rounded" style={{ backgroundColor: isEngaged ? '#ff0033' : '#334455' }} />
        <span className="text-[9px] tracking-[0.25em] text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
          THREAT STATUS
        </span>
      </div>

      {/* Classification — big, central, clean */}
      <div className="space-y-4">
        <div>
          <div className="text-[8px] text-[#334455] mb-1 tracking-widest">CLASS</div>
          <div
            className="text-lg font-bold tracking-wider"
            style={{ color: cls.color, fontFamily: '"Orbitron", sans-serif', textShadow: isEngaged ? `0 0 12px ${cls.color}60` : 'none' }}
          >
            {cls.text}
          </div>
        </div>

        {/* Confidence bar — minimal */}
        {isActive && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[8px] text-[#334455] tracking-widest">CONFIDENCE</span>
              <span className="text-[10px]" style={{ color: confidence > 0.8 ? '#ff0033' : '#ff6600', fontFamily: '"JetBrains Mono", monospace' }}>
                {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
            <div className="h-0.5 rounded-full" style={{ background: 'rgba(0,255,65,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${confidence * 100}%`,
                  backgroundColor: confidence > 0.8 ? '#ff0033' : '#ff6600',
                }}
              />
            </div>
          </div>
        )}

        {/* Range */}
        {isActive && (
          <div>
            <div className="text-[8px] text-[#334455] mb-1 tracking-widest">RANGE</div>
            <div
              className="text-xl font-bold"
              style={{
                color: distance < 500 ? '#ff0033' : distance < 1000 ? '#ff6600' : '#8899aa',
                fontFamily: '"JetBrains Mono", monospace',
              }}
            >
              {distance > 0 ? `${distance}m` : '—'}
            </div>
          </div>
        )}

        {/* RF signal — key FPV classifier */}
        {isActive && (
          <div className="pt-2 border-t border-[rgba(0,255,65,0.05)]">
            <div className="flex justify-between items-center">
              <span className="text-[8px] text-[#334455] tracking-widest">RF SIGNAL</span>
              <span className="text-[9px] font-bold" style={{ color: isFPV ? '#ff0033' : '#ff6600', fontFamily: '"JetBrains Mono", monospace' }}>
                {isFPV ? 'NULL' : '2.4GHz'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ENGAGE NOW alert — big, bottom of panel */}
      {isEngaged && (
        <div
          className="mt-auto rounded p-4 text-center"
          style={{
            background: 'rgba(255,0,51,0.06)',
            border: '1px solid rgba(255,0,51,0.2)',
            animation: 'borderDanger 1s ease-in-out infinite',
          }}
        >
          <IconWarning size={18} color="#ff0033" />
          <div className="text-xs font-bold tracking-[0.2em] mt-2" style={{ color: '#ff0033', fontFamily: '"Orbitron", sans-serif' }}>
            ENGAGE NOW
          </div>
        </div>
      )}

      {/* Sector clear */}
      {phase === 'NEUTRALIZED' && (
        <div
          className="mt-auto rounded p-4 text-center"
          style={{ background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.15)' }}
        >
          <IconShield size={18} color="#00ff41" />
          <div className="text-xs font-bold tracking-widest mt-2 text-[#00ff41]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
            SECTOR CLEAR
          </div>
        </div>
      )}
    </div>
  );
}
