'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/lib/gameStore';
import { RadarScope } from '@/components/tactical-ui/RadarScope';
import { RFSpectrum } from '@/components/tactical-ui/RFSpectrum';
import { ThreatClassifier } from '@/components/tactical-ui/ThreatClassifier';
import { ActionPanel } from '@/components/tactical-ui/ActionPanel';
import { MissionTimer } from '@/components/tactical-ui/MissionTimer';
import { StatusFeed } from '@/components/tactical-ui/StatusFeed';
import { TacticalBackground, Vignette, ParticleExplosion, GlitchEffect } from '@/components/ui/VisualEffects';
import { IconTarget, IconWarning, IconShield, IconExplosion } from '@/components/ui/Icons';
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
        <div className="text-center space-y-3">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full mx-auto"
            style={{ borderColor: '#00ff41', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}
          />
          <span className="text-[#00ff41] text-sm animate-pulse" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            LOADING 3D VIEW...
          </span>
        </div>
      </div>
    ),
  }
);

export default function SimulationPage() {
  const router = useRouter();
  const phase = useGameStore((s) => s.phase);
  const missionTime = useGameStore((s) => s.missionTime);
  const startMission = useGameStore((s) => s.startMission);
  const detectTarget = useGameStore((s) => s.detectTarget);
  const classifyTarget = useGameStore((s) => s.classifyTarget);
  const promptAction = useGameStore((s) => s.promptAction);
  const completeEngagement = useGameStore((s) => s.completeEngagement);
  const showAAR = useGameStore((s) => s.showAAR);
  const getScenario = useGameStore((s) => s.getScenario);
  const prevPhase = useRef(phase);

  const scenario = getScenario();

  // ── Auto-start on mount — only when truly at BRIEFING (not back-navigation) ──
  useEffect(() => {
    if (phase === 'BRIEFING') {
      startMission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scenario event progression driven by timer ────────────────────
  useEffect(() => {
    const events = scenario.events;
    const detectEvent = events.find((e) => e.type === 'RADAR_CONTACT');
    const classifyEvent = events.find((e) => e.type === 'CLASSIFICATION');
    const promptEvent = events.find((e) => e.type === 'PROMPT_ACTION');

    if (phase === 'SCANNING' && missionTime >= ((detectEvent as any)?.time ?? 5)) {
      detectTarget();
    }
    if (phase === 'DETECTED' && missionTime >= ((classifyEvent as any)?.time ?? 10)) {
      classifyTarget();
    }
    if (phase === 'CLASSIFYING' && missionTime >= ((promptEvent as any)?.time ?? 15)) {
      promptAction();
    }
  }, [phase, missionTime, scenario, detectTarget, classifyTarget, promptAction]);

  // ── Sounds ONLY on game-driven phase transitions (not user-triggered) ──
  // User action sounds are handled in ActionPanel itself (playButtonClick + result sounds)
  useEffect(() => {
    if (phase === prevPhase.current) return;
    switch (phase) {
      case 'DETECTED':
        playContactAlert();
        break;
      case 'AWAITING_ACTION':
        // Only play threat warning when auto-progressed from CLASSIFYING (not after WRONG_ACTION reset)
        if (prevPhase.current === 'CLASSIFYING') {
          playThreatWarning();
        }
        break;
      case 'WRONG_ACTION':
        playWrongAction();
        break;
      case 'CORRECT_ACTION':
        playCorrectAction();
        break;
      case 'NEUTRALIZED':
        playExplosion();
        break;
    }
    prevPhase.current = phase;
  }, [phase]);

  // ── Engagement completion ─────────────────────────────────────────
  useEffect(() => {
    if (phase === 'CORRECT_ACTION') {
      const t = setTimeout(() => completeEngagement(), 3000);
      return () => clearTimeout(t);
    }
  }, [phase, completeEngagement]);

  // ── AAR redirect ──────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'NEUTRALIZED') {
      const t = setTimeout(() => {
        showAAR();
        router.push('/aar');
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [phase, showAAR, router]);

  // ── Phase colour helpers ──────────────────────────────────────────
  const getPhaseColor = () => {
    if (phase === 'WRONG_ACTION') return '#ff0033';
    if (phase === 'CORRECT_ACTION' || phase === 'NEUTRALIZED') return '#00ff41';
    if (phase === 'AWAITING_ACTION') return '#ff6600';
    return '#00ff41';
  };
  const phaseColor = getPhaseColor();

  return (
    <div className="relative min-h-screen bg-[#050a12] overflow-hidden">
      <TacticalBackground variant="hex" />
      <Vignette />

      {/* FX overlays */}
      <GlitchEffect active={phase === 'WRONG_ACTION'} />
      <ParticleExplosion active={phase === 'NEUTRALIZED'} x={50} y={40} count={60} color="#ff6600" />

      {/* ── Top status bar ── */}
      <div
        className="relative z-20 flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: `${phaseColor}18`, background: 'rgba(5,10,18,0.98)' }}
      >
        {/* Left — Live + Scenario */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: phaseColor, boxShadow: `0 0 6px ${phaseColor}` }}
            />
            <span className="text-[10px] tracking-widest" style={{ color: phaseColor, fontFamily: '"Orbitron", sans-serif' }}>
              LIVE
            </span>
          </div>
          <div className="w-px h-3 bg-[rgba(0,255,65,0.15)]" />
          <div className="flex items-center gap-1.5">
            <IconTarget size={10} color="#556677" />
            <span className="text-[10px] tracking-widest text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {scenario.name.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Centre — Phase badge */}
        <div
          className="px-3 py-0.5 rounded text-[10px] tracking-[0.2em] font-bold"
          style={{
            background: `${phaseColor}12`,
            border: `1px solid ${phaseColor}28`,
            color: phaseColor,
            fontFamily: '"Orbitron", sans-serif',
          }}
        >
          {phase === 'WRONG_ACTION' ? 'COUNTERMEASURE FAILED'
            : phase === 'CORRECT_ACTION' ? 'ENGAGING TARGET'
            : phase === 'NEUTRALIZED' ? 'TARGET NEUTRALIZED'
            : phase.replace(/_/g, ' ')}
        </div>

        {/* Right — ROE / Difficulty */}
        <div className="flex items-center gap-3">
          {scenario.id === 'urban_ambush' && (
            <div className="flex items-center gap-1">
              <IconWarning size={10} color="#ff6600" />
              <span className="text-[10px] text-[#ff6600] tracking-widest" style={{ fontFamily: '"JetBrains Mono", monospace' }}>ROE ACTIVE</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <IconShield size={10} color="#334455" />
            <span className="text-[10px] tracking-widest text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{scenario.difficulty}</span>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="relative z-10 grid grid-cols-12 gap-0" style={{ height: 'calc(100vh - 37px)' }}>

        {/* LEFT — Radar + RF (3 cols) */}
        <div className="col-span-3 flex flex-col border-r border-[rgba(0,255,65,0.06)]">
          <div className="h-[45%] p-3 border-b border-[rgba(0,255,65,0.06)]">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>RADAR</span>
                <span className="text-[9px] text-[#223344]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>AN/TPQ-53</span>
              </div>
              <div className="flex-1 min-h-0"><RadarScope /></div>
            </div>
          </div>
          <div className="flex-1 p-3">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>RF SPECTRUM</span>
                <span className="text-[9px] text-[#223344]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>2.4 / 5.8G</span>
              </div>
              <div className="flex-1 min-h-0"><RFSpectrum /></div>
            </div>
          </div>
        </div>

        {/* CENTER — 3D viewport + Action panel (6 cols) */}
        <div className="col-span-6 flex flex-col border-r border-[rgba(0,255,65,0.06)]">
          <div className="flex-1 relative">
            {/* Viewport label */}
            <div
              className="absolute top-2 left-2 z-10 flex items-center gap-2 px-2 py-1 rounded"
              style={{ background: 'rgba(5,10,18,0.85)', border: '1px solid rgba(0,255,65,0.08)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff6600] animate-pulse" />
              <span className="text-[9px] tracking-widest text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                EO/IR TACTICAL VIEW
              </span>
            </div>

            {/* Engagement border pulse */}
            {phase === 'AWAITING_ACTION' && (
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ border: '2px solid rgba(255,102,0,0.35)', animation: 'borderDanger 1.2s ease-in-out infinite' }}
              />
            )}
            {phase === 'WRONG_ACTION' && (
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ border: '2px solid rgba(255,0,51,0.5)', animation: 'borderDanger 0.4s ease-in-out infinite' }}
              />
            )}

            <SimulationScene />
          </div>

          {/* Action panel */}
          <div className="border-t border-[rgba(0,255,65,0.06)] p-3 bg-[rgba(5,10,18,0.98)]">
            <ActionPanel />
          </div>
        </div>

        {/* RIGHT — Timer + Classifier + Status (3 cols) */}
        <div className="col-span-3 flex flex-col">
          <div className="p-3 border-b border-[rgba(0,255,65,0.06)]">
            <MissionTimer />
          </div>
          <div className="flex-1 p-3 border-b border-[rgba(0,255,65,0.06)] overflow-auto">
            <ThreatClassifier />
          </div>
          <div className="h-[36%] p-3">
            <div className="h-full flex flex-col">
              <span className="text-[9px] tracking-widest text-[#445566] mb-2" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                MISSION STATUS
              </span>
              <div className="flex-1 min-h-0 overflow-auto">
                <StatusFeed />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEUTRALIZED overlay ── */}
      {phase === 'NEUTRALIZED' && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          style={{ animation: 'fadeInUp 0.5s ease-out' }}
        >
          <div
            className="text-center px-14 py-10 rounded-xl"
            style={{
              background: 'rgba(5,10,18,0.94)',
              border: '2px solid rgba(0,255,65,0.35)',
              boxShadow: '0 0 60px rgba(0,255,65,0.15)',
            }}
          >
            {/* Icon instead of emoji */}
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,255,65,0.1)', border: '2px solid rgba(0,255,65,0.3)' }}
              >
                <IconExplosion size={36} color="#00ff41" />
              </div>
            </div>
            <div
              className="text-3xl font-bold tracking-widest mb-2"
              style={{ color: '#00ff41', fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 20px #00ff41' }}
            >
              TARGET NEUTRALIZED
            </div>
            <div className="text-xs text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              Loading After-Action Review...
            </div>
            {/* Countdown dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#00ff41]"
                  style={{ animation: `blink 1s ease-in-out ${i * 0.3}s infinite` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
