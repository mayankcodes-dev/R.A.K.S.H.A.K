'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/gameStore';

export function MissionTimer() {
  const missionTime = useGameStore((s) => s.missionTime);
  const isTimerRunning = useGameStore((s) => s.isTimerRunning);
  const score = useGameStore((s) => s.score);
  const phase = useGameStore((s) => s.phase);
  const statusMessage = useGameStore((s) => s.statusMessage);
  const tick = useGameStore((s) => s.tick);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isTimerRunning) return;
    let frameId: number;
    const update = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      tick(delta);
      frameId = requestAnimationFrame(update);
    };
    lastTimeRef.current = performance.now();
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [isTimerRunning, tick]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'AWAITING_ACTION':
      case 'WRONG_ACTION': return 'text-[var(--color-danger)]';
      case 'CORRECT_ACTION':
      case 'ENGAGEMENT': return 'text-[var(--color-accent)]';
      case 'NEUTRALIZED': return 'text-[var(--color-primary)]';
      default: return 'text-[var(--color-text-primary)]';
    }
  };

  return (
    <div className="flex items-center justify-between gap-6">
      {/* Timer */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-[var(--color-primary)] animate-pulse' : 'bg-[var(--color-text-muted)]'}`} />
          <span className="text-[10px] font-[family-name:var(--font-display)] text-[var(--color-text-muted)] tracking-widest">MISSION TIME</span>
        </div>
        <span className="text-lg font-[family-name:var(--font-mono)] text-[var(--color-primary)] font-bold glow-text tabular-nums">
          {formatTime(missionTime)}
        </span>
      </div>

      {/* Status */}
      <div className={`text-xs font-[family-name:var(--font-mono)] font-semibold tracking-wide ${getPhaseColor()} ${
        phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION' ? 'animate-pulse-slow' : ''
      }`}>
        {statusMessage}
      </div>

      {/* Score */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-[family-name:var(--font-display)] text-[var(--color-text-muted)] tracking-widest">SCORE</span>
        <span className={`text-lg font-[family-name:var(--font-mono)] font-bold tabular-nums ${
          score >= 80 ? 'text-[var(--color-primary)] glow-text' :
          score >= 50 ? 'text-[var(--color-accent)] glow-text-accent' :
          'text-[var(--color-danger)] glow-text-danger'
        }`}>
          {score}
        </span>
      </div>
    </div>
  );
}
