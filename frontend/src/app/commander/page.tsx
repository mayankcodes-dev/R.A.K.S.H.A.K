'use client';

import { useRouter } from 'next/navigation';
import { TacticalBackground, Vignette } from '@/components/ui/VisualEffects';

const UNIT_STATS = {
  unitName: 'Alpha Training Squadron',
  activeTrainees: 28,
  certifiedCount: 19,
  averageScore: 79.4,
  totalSessions: 142,
  weakestPhase: 'ENGAGEMENT',
  strongestPhase: 'DETECTION',
};

const GRADE_DIST = [
  { grade: 'A', count: 41, color: '#00ff41' },
  { grade: 'B', count: 62, color: '#3399ff' },
  { grade: 'C', count: 29, color: '#ffaa00' },
  { grade: 'D', count: 8,  color: '#ff6600' },
  { grade: 'F', count: 2,  color: '#ff2244' },
];

// Compressed to short labels
const TRAINING_GAPS = [
  'FPV latency >5s — 43% of trainees',
  'Swarm ROE violations: 18% (target <5%)',
  '9 trainees: FPV scenario incomplete',
];

const SCENARIO_COMPLETION = [
  { name: 'Single Drone',  rate: 0.98, color: '#00ff41' },
  { name: 'FPV Fiber-Optic', rate: 0.61, color: '#ffaa00' },
  { name: 'Urban Swarm',  rate: 0.43, color: '#ff6600' },
];

export default function CommanderPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <TacticalBackground variant="circuit" />
      <Vignette />

      <div className="relative z-10 min-h-screen p-6 md:p-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-[#2a3a4a] mb-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              COMMANDER PORTAL
            </p>
            <h1 className="text-2xl font-black tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: '#ff9900' }}>
              {UNIT_STATS.unitName.toUpperCase()}
            </h1>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-[10px] tracking-widest px-4 py-2 rounded border transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#445566', fontFamily: '"JetBrains Mono", monospace' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
          >
            ← PORTAL
          </button>
        </div>

        {/* Key metrics — 4 stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'TRAINEES',  value: UNIT_STATS.activeTrainees },
            { label: 'CERTIFIED', value: `${UNIT_STATS.certifiedCount}/${UNIT_STATS.activeTrainees}` },
            { label: 'AVG SCORE', value: UNIT_STATS.averageScore },
            { label: 'SESSIONS',  value: UNIT_STATS.totalSessions },
          ].map((s) => (
            <div key={s.label} className="p-5 rounded-lg border" style={{ background: 'rgba(8,12,18,0.8)', borderColor: 'rgba(255,255,255,0.04)' }}>
              <p className="text-2xl font-black mb-1" style={{ fontFamily: '"Orbitron", sans-serif', color: '#ff9900' }}>
                {s.value}
              </p>
              <p className="text-[8px] tracking-[0.25em] text-[#2a3a4a]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">

          {/* Grade distribution */}
          <div className="p-5 rounded-lg border" style={{ background: 'rgba(8,12,18,0.8)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] tracking-[0.3em] text-[#334455] mb-5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              GRADE DISTRIBUTION
            </p>
            <div className="space-y-3">
              {GRADE_DIST.map((g) => {
                const total = GRADE_DIST.reduce((s, x) => s + x.count, 0);
                const pct = Math.round((g.count / total) * 100);
                return (
                  <div key={g.grade} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-center" style={{ fontFamily: '"Orbitron", sans-serif', color: g.color }}>{g.grade}</span>
                    <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.04)]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.color, opacity: 0.65 }} />
                    </div>
                    <span className="text-[9px] text-[#334455] w-6 text-right" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{g.count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scenario completion */}
          <div className="p-5 rounded-lg border" style={{ background: 'rgba(8,12,18,0.8)', borderColor: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] tracking-[0.3em] text-[#334455] mb-5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              SCENARIO COMPLETION
            </p>
            <div className="space-y-4">
              {SCENARIO_COMPLETION.map((sc) => (
                <div key={sc.name}>
                  <div className="flex justify-between mb-1.5">
                    <p className="text-[9px] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{sc.name}</p>
                    <p className="text-[9px] font-bold" style={{ color: sc.color, fontFamily: '"JetBrains Mono", monospace' }}>
                      {Math.round(sc.rate * 100)}%
                    </p>
                  </div>
                  <div className="h-0.5 rounded-full bg-[rgba(255,255,255,0.04)]">
                    <div className="h-full rounded-full" style={{ width: `${sc.rate * 100}%`, background: sc.color, opacity: 0.6 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training gaps — full width, compact */}
          <div className="p-5 rounded-lg border md:col-span-2" style={{ background: 'rgba(8,12,18,0.8)', borderColor: 'rgba(255,102,0,0.12)' }}>
            <p className="text-[9px] tracking-[0.3em] text-[#ff6600] mb-4" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              TRAINING GAPS
            </p>
            <div className="space-y-2">
              {TRAINING_GAPS.map((gap, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[#ff6600] text-[10px] flex-shrink-0">▸</span>
                  <p className="text-[10px] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{gap}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase summary */}
        <div className="mt-8 flex gap-8 text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          <div>
            <span className="text-[#2a3a4a]">STRONGEST </span>
            <span className="text-[#00ff41] font-bold">{UNIT_STATS.strongestPhase}</span>
          </div>
          <div>
            <span className="text-[#2a3a4a]">WEAKEST </span>
            <span className="text-[#ff6600] font-bold">{UNIT_STATS.weakestPhase}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
