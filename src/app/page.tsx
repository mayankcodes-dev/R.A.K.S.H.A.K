'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import { SCENARIOS } from '@/data/scenarios/allScenarios';
import type { ScenarioId } from '@/data/scenarios/allScenarios';
import { TacticalBackground, Vignette, DataParticles } from '@/components/ui/VisualEffects';
import { RakshakLoader } from '@/components/ui/RakshakLoader';
import { IconDrone, IconSwarm, IconCivilian, IconTarget, IconShield, IconWarning } from '@/components/ui/Icons';
import {
  playBootBeep,
  startAmbientStatic,
  stopAmbientStatic,
  playMissionStart,
  playButtonClick,
} from '@/lib/soundEngine';

const BOOT_SEQUENCE = [
  '> INITIALIZING R.A.K.S.H.A.K. SYSTEM v2.7.1...',
  '> LOADING SENSOR ARRAYS........... OK',
  '> RADAR MODULE: ONLINE',
  '> RF SPECTRUM ANALYZER: ONLINE',
  '> MICRO-DOPPLER PROCESSOR: ONLINE',
  '> EO/IR SUBSYSTEM: STANDBY',
  '> KINETIC INTERCEPTOR SYSTEM: ARMED',
  '> SAPIENT PROTOCOL: CONNECTED',
  '> THREAT DATABASE: LOADED (1,247 signatures)',
  '> OPERATOR AUTHENTICATION: VERIFIED [TOKEN-9F3A]',
  '> COMMS LINK: ENCRYPTED AES-256',
  '> =====================================',
  '> SYSTEM READY — SELECT MISSION SCENARIO',
];

function ScenarioIcon({ icon, size = 36 }: { icon: string; size?: number }) {
  if (icon === 'swarm') return <IconSwarm size={size} color="currentColor" />;
  if (icon === 'urban') return <IconCivilian size={size} color="currentColor" />;
  return <IconDrone size={size} color="currentColor" />;
}

export default function BriefingPage() {
  const router = useRouter();
  const resetMission = useGameStore((s) => s.resetMission);
  const setScenario = useGameStore((s) => s.setScenario);
  const selectedId = useGameStore((s) => s.selectedScenarioId);

  const [loaderProgress, setLoaderProgress] = useState(0);
  const [isBooting, setIsBooting] = useState(true);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const soundUnlocked = useRef(false);

  // Unlock audio on first interaction
  const unlockAudio = useCallback(() => {
    if (!soundUnlocked.current) {
      soundUnlocked.current = true;
      startAmbientStatic(0.015);
    }
  }, []);

  useEffect(() => {
    resetMission();
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    // Loader progress tween
    let prog = 0;
    const progInterval = setInterval(() => {
      prog += 100 / BOOT_SEQUENCE.length;
      setLoaderProgress(Math.min(prog, 100));
    }, 200);

    // Boot sequence text
    let lineIndex = 0;
    const bootInterval = setInterval(() => {
      if (lineIndex < BOOT_SEQUENCE.length) {
        playBootBeep(lineIndex);
        setBootLines((prev) => [...prev, BOOT_SEQUENCE[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(bootInterval);
        clearInterval(progInterval);
        setLoaderProgress(100);
        setTimeout(() => {
          setIsBooting(false);
          setTimeout(() => setShowScenarios(true), 400);
          setTimeout(() => setShowButton(true), 800);
        }, 600);
      }
    }, 220);

    return () => {
      clearInterval(bootInterval);
      clearInterval(progInterval);
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const handleSelectScenario = (id: ScenarioId) => {
    playButtonClick();
    setScenario(id);
  };

  const handleStartMission = () => {
    playMissionStart();
    setLaunching(true);
    stopAmbientStatic();
    setTimeout(() => router.push('/simulation'), 2000);
  };

  const selectedScenario = SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0];

  return (
    <div className="relative min-h-screen overflow-hidden" onClick={() => unlockAudio()}>
      {/* Layered backgrounds */}
      <TacticalBackground variant="topo" />
      <Vignette />
      <DataParticles />

      {/* Full-screen loader during boot */}
      {isBooting && (
        <div className="fixed inset-0 z-[9999] bg-[#050a12] flex flex-col items-center justify-center gap-8">
          <RakshakLoader progress={loaderProgress} message={bootLines[bootLines.length - 1] ?? 'INITIALIZING...'} />
          {/* Boot log overlay */}
          <div className="absolute bottom-8 left-8 right-8 max-h-48 overflow-hidden">
            <div className="space-y-0.5">
              {bootLines.slice(-8).map((line, i) => (
                <p
                  key={i}
                  className="text-[10px] font-mono opacity-60"
                  style={{ color: '#00ff41', fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Launch animation overlay */}
      {launching && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,65,0.15) 0%, #050a12 70%)' }}
        >
          <div className="text-center">
            <div
              className="text-4xl font-bold tracking-[0.5em] animate-pulse"
              style={{ color: '#00ff41', fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 30px #00ff41' }}
            >
              LAUNCHING MISSION
            </div>
            <div className="mt-4 text-sm tracking-widest" style={{ color: '#556677', fontFamily: '"JetBrains Mono", monospace' }}>
              {selectedScenario.name.toUpperCase()} — {selectedScenario.subtitle}
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#00ff41] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!isBooting && (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
          <div className="max-w-5xl w-full space-y-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>

            {/* ── Header ── */}
            <div className="text-center space-y-4">
              <h1
                className="text-6xl md:text-8xl font-black tracking-wider"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontWeight: 900,
                  color: '#00ff41',
                  textShadow: '0 0 40px rgba(0,255,65,0.6), 0 0 80px rgba(0,255,65,0.25), 0 0 120px rgba(0,255,65,0.1)',
                  letterSpacing: '0.12em',
                }}
              >
                R.A.K.S.H.A.K.
              </h1>

              <div className="space-y-1">
                <p className="text-sm tracking-[0.2em] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  COUNTER-UAS TRAINING SIMULATOR
                </p>
              </div>

              {/* Decorative divider */}
              <div className="flex items-center gap-4 justify-center mt-2">
                <div className="flex-1 max-w-32 h-px bg-gradient-to-r from-transparent to-[rgba(0,255,65,0.3)]" />
                <IconTarget size={16} color="rgba(0,255,65,0.5)" />
                <div className="flex-1 max-w-32 h-px bg-gradient-to-l from-transparent to-[rgba(0,255,65,0.3)]" />
              </div>
            </div>

            {/* ── Scenario Selector ── */}
            {showScenarios && (
              <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <div className="flex items-center gap-3 mb-4">
                  <IconShield size={14} color="#556677" />
                  <span className="text-xs tracking-[0.25em] text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                    SELECT MISSION SCENARIO
                  </span>
                  <div className="flex-1 h-px bg-[rgba(0,255,65,0.1)]" />
                  <span className="text-[10px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    3 AVAILABLE
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SCENARIOS.map((scenario) => {
                    const isSelected = scenario.id === selectedId;
                    const isHovered = hoveredId === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => handleSelectScenario(scenario.id as ScenarioId)}
                        onMouseEnter={() => { setHoveredId(scenario.id); playButtonClick(); }}
                        onMouseLeave={() => setHoveredId(null)}
                        className="relative text-left p-5 rounded-lg border transition-all duration-300 cursor-pointer group overflow-hidden min-w-0 w-full"
                        style={{
                          background: isSelected
                            ? 'rgba(0,255,65,0.06)'
                            : isHovered
                            ? 'rgba(0,255,65,0.03)'
                            : 'rgba(10,14,20,0.8)',
                          borderColor: isSelected
                            ? 'rgba(0,255,65,0.5)'
                            : 'rgba(0,255,65,0.1)',
                          boxShadow: isSelected
                            ? '0 0 20px rgba(0,255,65,0.1), inset 0 0 20px rgba(0,255,65,0.03)'
                            : 'none',
                          transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                        }}
                      >
                        {/* Corner brackets */}
                        {isSelected && (
                          <>
                            <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#00ff41]" />
                            <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#00ff41]" />
                            <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#00ff41]" />
                            <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#00ff41]" />
                          </>
                        )}

                        {/* Scenario index */}
                        <div className="flex items-start justify-between mb-3 min-w-0">
                          <div
                            className="w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center"
                            style={{
                              background: isSelected ? 'rgba(0,255,65,0.1)' : 'rgba(0,255,65,0.04)',
                              border: `1px solid ${isSelected ? 'rgba(0,255,65,0.3)' : 'rgba(0,255,65,0.08)'}`,
                              color: isSelected ? '#00ff41' : '#334455',
                            }}
                          >
                            <ScenarioIcon icon={scenario.icon} size={26} />
                          </div>
                          <div className="text-right space-y-1 ml-2 flex-shrink-0">
                            <div
                              className="text-[10px] px-2 py-0.5 rounded font-mono"
                              style={{
                                background: `${scenario.difficultyColor}15`,
                                border: `1px solid ${scenario.difficultyColor}30`,
                                color: scenario.difficultyColor,
                                fontFamily: '"JetBrains Mono", monospace',
                              }}
                            >
                              {scenario.difficulty}
                            </div>
                            <div className="text-[9px] text-[#334455] font-mono">SCN-{String(scenario.index).padStart(3, '0')}</div>
                          </div>
                        </div>

                        {/* Name */}
                        <h3
                          className="text-base font-bold mb-0.5 transition-colors truncate"
                          style={{
                            fontFamily: '"Orbitron", sans-serif',
                            color: isSelected ? '#00ff41' : '#88aacc',
                            fontSize: '0.9rem',
                          }}
                        >
                          {scenario.name}
                        </h3>
                        <p className="text-[11px] text-[#556677] mb-3 truncate" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {scenario.subtitle}
                        </p>

                        {/* Description */}
                        <p
                          className="text-[11px] leading-relaxed text-[#445566] mb-4 break-words"
                          style={{ fontFamily: '"JetBrains Mono", monospace', overflowWrap: 'break-word', wordBreak: 'break-word' }}
                        >
                          {scenario.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {scenario.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-2 py-0.5 rounded-full"
                              style={{
                                border: '1px solid rgba(0,255,65,0.12)',
                                color: '#445566',
                                fontFamily: '"JetBrains Mono", monospace',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Key challenge */}
                        <div
                          className="flex items-start gap-2 p-2 rounded overflow-hidden"
                          style={{ background: 'rgba(255,102,0,0.05)', border: '1px solid rgba(255,102,0,0.1)' }}
                        >
                          <IconWarning size={12} color="#ff6600" className="mt-0.5 flex-shrink-0" />
                          <p
                            className="text-[10px] text-[#ff6600] break-words min-w-0"
                            style={{ fontFamily: '"JetBrains Mono", monospace', overflowWrap: 'break-word', wordBreak: 'break-word' }}
                          >
                            {scenario.keyChallenge}
                          </p>
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <div
                            className="absolute top-0 left-0 right-0 h-0.5"
                            style={{
                              background: 'linear-gradient(90deg, transparent, #00ff41, transparent)',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Selected scenario briefing snippet ── */}
            {showScenarios && (
              <div
                className="rounded-lg p-5 border"
                style={{
                  background: 'rgba(10,14,20,0.9)',
                  borderColor: 'rgba(0,255,65,0.1)',
                  animation: 'fadeInUp 0.4s ease-out',
                }}
              >
                <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid rgba(0,255,65,0.1)' }}>
                  <span className="text-[10px] tracking-widest text-[#ff6600]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                    ◆ INTELLIGENCE BRIEFING — {selectedScenario.name.toUpperCase()}
                  </span>
                  <span className="ml-auto text-[10px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    SEC: TS//SCI
                  </span>
                </div>
                <p
                  className="text-[11px] leading-relaxed text-[#445566] whitespace-pre-line"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {selectedScenario.briefing.trim().split('\n').slice(0, 6).join('\n')}
                </p>
              </div>
            )}

            {/* ── BEGIN MISSION button ── */}
            {showButton && (
              <div className="flex flex-col items-center gap-4" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                <button
                  onClick={handleStartMission}
                  disabled={launching}
                  className="group relative px-16 py-5 rounded-lg font-bold text-xl tracking-[0.35em] uppercase transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    background: '#00ff41',
                    color: '#050a12',
                    boxShadow: '0 0 30px rgba(0,255,65,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 60px rgba(0,255,65,0.6), 0 0 120px rgba(0,255,65,0.2)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(0,255,65,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                >
                  <span className="relative z-10">
                    {launching ? 'LAUNCHING...' : 'BEGIN MISSION'}
                  </span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
                  />
                </button>

                <div className="flex items-center gap-6 text-[10px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  <span>SCENARIO: {selectedScenario.name.toUpperCase()}</span>
                  <span>·</span>
                  <span>DIFFICULTY: {selectedScenario.difficulty}</span>
                  <span>·</span>
                  <span>OPERATOR: AUTHENTICATED</span>
                </div>
              </div>
            )}

            {/* ── Footer stats ── */}
            {showScenarios && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[rgba(0,255,65,0.06)]">
                {[
                  { label: 'THREAT TYPES', value: '3' },
                  { label: 'SENSOR SYSTEMS', value: '7' },
                  { label: 'TRAINING HOURS', value: '∞' },
                  { label: 'CLASSIFICATION', value: 'TS//SCI' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-lg font-bold" style={{ color: '#00ff41', fontFamily: '"Orbitron", sans-serif' }}>{stat.value}</p>
                    <p className="text-[9px] text-[#334455] tracking-widest" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
