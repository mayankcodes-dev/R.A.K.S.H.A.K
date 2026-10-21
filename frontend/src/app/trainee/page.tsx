'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import { SCENARIOS } from '@/data/scenarios/allScenarios';
import type { ScenarioId } from '@/data/scenarios/allScenarios';
import { TacticalBackground, Vignette, DataParticles } from '@/components/ui/VisualEffects';
import { RakshakLoader } from '@/components/ui/RakshakLoader';
import { IconDrone, IconSwarm, IconCivilian, IconWarning } from '@/components/ui/Icons';
import {
  playBootBeep,
  startAmbientStatic,
  stopAmbientStatic,
  playMissionStart,
  playButtonClick,
} from '@/lib/soundEngine';

// Shorter boot — 5 lines only
const BOOT_SEQUENCE = [
  '> INITIALIZING R.A.K.S.H.A.K. v2.7.1...',
  '> SENSOR ARRAYS: ONLINE',
  '> SAPIENT PROTOCOL: CONNECTED',
  '> OPERATOR AUTHENTICATION: VERIFIED',
  '> SYSTEM READY',
];

function ScenarioIcon({ icon, size = 30 }: { icon: string; size?: number }) {
  if (icon === 'swarm') return <IconSwarm size={size} color="currentColor" />;
  if (icon === 'urban') return <IconCivilian size={size} color="currentColor" />;
  return <IconDrone size={size} color="currentColor" />;
}

export default function TraineeBriefingPage() {
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

    let prog = 0;
    const progInterval = setInterval(() => {
      prog += 100 / BOOT_SEQUENCE.length;
      setLoaderProgress(Math.min(prog, 100));
    }, 220);

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
          setTimeout(() => setShowScenarios(true), 300);
          setTimeout(() => setShowButton(true), 600);
        }, 500);
      }
    }, 240);

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
    setTimeout(() => router.push('/trainee/simulation'), 1800);
  };

  const selectedScenario = SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0];

  return (
    <div className="relative min-h-screen overflow-hidden" onClick={() => unlockAudio()}>
      <TacticalBackground variant="topo" />
      <Vignette />
      <DataParticles />

      {/* Boot screen */}
      {isBooting && (
        <div className="fixed inset-0 z-[9999] bg-[#050a12] flex flex-col items-center justify-center gap-8">
          <RakshakLoader progress={loaderProgress} message={bootLines[bootLines.length - 1] ?? 'INITIALIZING...'} />
          <div className="absolute bottom-8 left-8 right-8 max-h-32 overflow-hidden">
            <div className="space-y-0.5">
              {bootLines.slice(-5).map((line, i) => (
                <p
                  key={i}
                  className="text-[10px] font-mono opacity-50"
                  style={{ color: '#00ff41', fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Launch overlay */}
      {launching && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,255,65,0.12) 0%, #050a12 70%)' }}
        >
          <div className="text-center">
            <div
              className="text-3xl font-bold tracking-[0.4em] animate-pulse"
              style={{ color: '#00ff41', fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 30px #00ff41' }}
            >
              LAUNCHING
            </div>
            <div className="mt-3 text-xs tracking-widest text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {selectedScenario.name.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {!isBooting && (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 md:p-10">
          <div className="max-w-4xl w-full space-y-10" style={{ animation: 'fadeInUp 0.5s ease-out' }}>

            {/* Title */}
            <div className="text-center">
              <h1
                className="text-5xl md:text-7xl font-black tracking-wider mb-2"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  color: '#00ff41',
                  textShadow: '0 0 40px rgba(0,255,65,0.5)',
                  letterSpacing: '0.1em',
                }}
              >
                R.A.K.S.H.A.K.
              </h1>
              <p className="text-[10px] tracking-[0.25em] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                COUNTER-UAS TRAINING SIMULATOR
              </p>
            </div>

            {/* Scenario selector */}
            {showScenarios && (
              <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                <p className="text-[9px] tracking-[0.3em] text-[#445566] mb-4" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                  SELECT SCENARIO
                </p>
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
                        className="relative text-left p-5 rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden w-full"
                        style={{
                          background: isSelected ? 'rgba(0,255,65,0.05)' : isHovered ? 'rgba(0,255,65,0.025)' : 'rgba(10,14,20,0.8)',
                          borderColor: isSelected ? 'rgba(0,255,65,0.45)' : 'rgba(0,255,65,0.08)',
                          boxShadow: isSelected ? '0 0 20px rgba(0,255,65,0.08)' : 'none',
                        }}
                      >
                        {/* Selection brackets */}
                        {isSelected && (
                          <>
                            <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#00ff41]" />
                            <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#00ff41]" />
                            <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#00ff41]" />
                            <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#00ff41]" />
                          </>
                        )}

                        {/* Top row — icon + difficulty */}
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center"
                            style={{
                              background: isSelected ? 'rgba(0,255,65,0.08)' : 'rgba(0,255,65,0.03)',
                              border: `1px solid ${isSelected ? 'rgba(0,255,65,0.25)' : 'rgba(0,255,65,0.07)'}`,
                              color: isSelected ? '#00ff41' : '#334455',
                            }}
                          >
                            <ScenarioIcon icon={scenario.icon} size={22} />
                          </div>
                          <span
                            className="text-[9px] px-2 py-0.5 rounded"
                            style={{
                              background: `${scenario.difficultyColor}12`,
                              border: `1px solid ${scenario.difficultyColor}28`,
                              color: scenario.difficultyColor,
                              fontFamily: '"JetBrains Mono", monospace',
                            }}
                          >
                            {scenario.difficulty}
                          </span>
                        </div>

                        {/* Name + subtitle */}
                        <h3
                          className="text-sm font-bold mb-1 truncate"
                          style={{ fontFamily: '"Orbitron", sans-serif', color: isSelected ? '#00ff41' : '#6688aa', fontSize: '0.85rem' }}
                        >
                          {scenario.name}
                        </h3>
                        <p className="text-[10px] text-[#445566] mb-3 truncate" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {scenario.subtitle}
                        </p>

                        {/* Key challenge — 1 line only */}
                        <div className="flex items-start gap-1.5" style={{ background: 'rgba(255,102,0,0.04)', border: '1px solid rgba(255,102,0,0.1)', borderRadius: 4, padding: '6px 8px' }}>
                          <IconWarning size={10} color="#ff6600" className="mt-0.5 flex-shrink-0" />
                          <p className="text-[9px] text-[#cc5500] truncate" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                            {scenario.keyChallenge}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #00ff41, transparent)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Intel summary — compact 2-line version */}
            {showScenarios && (
              <div
                className="rounded-lg px-5 py-4 border flex items-center justify-between"
                style={{ background: 'rgba(10,14,20,0.9)', borderColor: 'rgba(0,255,65,0.08)' }}
              >
                <div>
                  <p className="text-[8px] tracking-widest text-[#ff6600] mb-1" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                    INTEL — {selectedScenario.name.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {selectedScenario.subtitle}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-6">
                  <p className="text-[8px] tracking-widest text-[#334455] mb-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>ENGAGE WITH</p>
                  <p className="text-[10px] font-bold text-[#00ff41]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                    {(selectedScenario as any).correctAction ?? '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Launch button */}
            {showButton && (
              <div className="flex flex-col items-center gap-3" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                <button
                  onClick={handleStartMission}
                  disabled={launching}
                  className="px-14 py-4 rounded-lg font-bold tracking-[0.3em] uppercase transition-all duration-200"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    background: '#00ff41',
                    color: '#050a12',
                    fontSize: '0.9rem',
                    boxShadow: '0 0 28px rgba(0,255,65,0.28)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 50px rgba(0,255,65,0.55)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(0,255,65,0.28)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                >
                  {launching ? 'LAUNCHING...' : 'BEGIN MISSION'}
                </button>
                <p className="text-[9px] text-[#2a3a4a]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {selectedScenario.name.toUpperCase()} · {selectedScenario.difficulty}
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
