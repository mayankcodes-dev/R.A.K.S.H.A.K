'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TacticalBackground, Vignette } from '@/components/ui/VisualEffects';

const MOCK_TRAINEES = [
  { id: 't1', name: 'Maj Arjun Sharma', serviceNo: 'IC-86432', score: 82, grade: 'B', cert: 'INTERMEDIATE' },
  { id: 't2', name: 'Capt Rohan Verma',  serviceNo: 'IC-91204', score: 74, grade: 'C', cert: 'BASIC'        },
  { id: 't3', name: 'Maj Sneha Iyer',    serviceNo: 'IC-88731', score: 91, grade: 'A', cert: 'ADVANCED'     },
  { id: 't4', name: 'Capt Dev Pillai',   serviceNo: 'IC-93410', score: 61, grade: 'D', cert: 'UNQUALIFIED'  },
];

const SCENARIOS = [
  { id: 'fiber_optic_fpv', name: 'Fiber-Optic FPV Threat',  difficulty: 'HARD',   diffColor: '#ff6600' },
  { id: 'swarm_storm',     name: 'Urban Swarm Engagement',   difficulty: 'EXPERT', diffColor: '#ff0033' },
  { id: 'urban_ambush',    name: 'Single Drone Intercept',   difficulty: 'MEDIUM', diffColor: '#ffaa00' },
];

const GRADE_COLOR: Record<string, string> = {
  A: '#00ff41', B: '#3399ff', C: '#ffaa00', D: '#ff6600', F: '#ff2244',
};

export default function InstructorPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'trainees' | 'scenarios'>('trainees');

  return (
    <div className="relative min-h-screen overflow-hidden">
      <TacticalBackground variant="circuit" />
      <Vignette />

      <div className="relative z-10 min-h-screen p-6 md:p-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-[#2a3a4a] mb-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              INSTRUCTOR PORTAL
            </p>
            <h1 className="text-2xl font-black tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: '#3399ff' }}>
              SCENARIO CONTROL
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

        {/* Tabs */}
        <div className="flex gap-8 mb-10 border-b border-[rgba(255,255,255,0.04)]">
          {(['trainees', 'scenarios'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pb-3 text-[10px] tracking-[0.3em] uppercase transition-colors"
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                color: tab === t ? '#3399ff' : '#334455',
                borderBottom: tab === t ? '1px solid #3399ff' : '1px solid transparent',
              }}
            >
              {t === 'trainees' ? 'Trainee Roster' : 'Scenarios'}
            </button>
          ))}
        </div>

        {/* Trainee Roster */}
        {tab === 'trainees' && (
          <div className="space-y-2 max-w-3xl">
            {MOCK_TRAINEES.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-6 px-5 py-4 rounded-lg border"
                style={{
                  background: 'rgba(8,12,18,0.8)',
                  borderColor: 'rgba(255,255,255,0.04)',
                }}
              >
                {/* Grade */}
                <div className="w-8 text-center flex-shrink-0">
                  <span className="text-lg font-black" style={{ fontFamily: '"Orbitron", sans-serif', color: GRADE_COLOR[t.grade] }}>
                    {t.grade}
                  </span>
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#99aabb] truncate" style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.8rem' }}>
                    {t.name}
                  </p>
                  <p className="text-[9px] text-[#334455] mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{t.serviceNo}</p>
                </div>

                {/* Score + Cert */}
                <div className="hidden md:flex items-center gap-8 text-[10px] flex-shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  <div className="text-center">
                    <p className="text-[#3399ff] font-bold">{t.score}</p>
                    <p className="text-[#2a3a4a] text-[8px]">SCORE</p>
                  </div>
                  <div className="text-center">
                    <p style={{ color: GRADE_COLOR[t.grade] }}>{t.cert}</p>
                    <p className="text-[#2a3a4a] text-[8px]">CERT</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scenario Config */}
        {tab === 'scenarios' && (
          <div className="space-y-3 max-w-2xl">
            {SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                className="flex items-center justify-between px-5 py-4 rounded-lg border"
                style={{ background: 'rgba(8,12,18,0.8)', borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div>
                  <h3 className="text-sm font-bold text-[#99aabb] mb-1" style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.8rem' }}>
                    {sc.name}
                  </h3>
                  <span
                    className="text-[8px] px-2 py-0.5 rounded"
                    style={{ border: `1px solid ${sc.diffColor}28`, color: sc.diffColor, fontFamily: '"JetBrains Mono", monospace' }}
                  >
                    {sc.difficulty}
                  </span>
                </div>
                <button
                  className="text-[9px] tracking-widest px-3 py-2 rounded border transition-colors flex-shrink-0"
                  style={{ borderColor: 'rgba(51,153,255,0.25)', color: '#3399ff', fontFamily: '"JetBrains Mono", monospace' }}
                >
                  CONFIGURE →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
