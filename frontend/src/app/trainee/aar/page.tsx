'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import { TacticalBackground, Vignette, ParticleExplosion } from '@/components/ui/VisualEffects';
import { IconScore, IconTimer, IconShield, IconTarget, IconWarning, IconExplosion } from '@/components/ui/Icons';
import { playCorrectAction, playButtonClick } from '@/lib/soundEngine';
import {
  Chart as ChartJS,
  RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

function GradeBadge({ score }: { score: number }) {
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';
  const color = score >= 80 ? '#00ff41' : score >= 60 ? '#ff6600' : '#ff0033';
  const label = score >= 80 ? 'MISSION SUCCESS' : score >= 60 ? 'SATISFACTORY' : 'NEEDS IMPROVEMENT';
  return (
    <div className="text-center">
      <div className="text-7xl font-bold leading-none" style={{ fontFamily: '"Orbitron", sans-serif', color, textShadow: `0 0 24px ${color}50` }}>
        {grade}
      </div>
      <div className="text-[10px] tracking-[0.2em] mt-2" style={{ color, fontFamily: '"JetBrains Mono", monospace' }}>{label}</div>
    </div>
  );
}

export default function AARPage() {
  const router = useRouter();
  const missionTime = useGameStore((s) => s.missionTime);
  const score = useGameStore((s) => s.score);
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const actionLog = useGameStore((s) => s.actionLog);
  const detectionTime = useGameStore((s) => s.detectionTime);
  const engagementTime = useGameStore((s) => s.engagementTime);
  const resetMission = useGameStore((s) => s.resetMission);
  const getScenario = useGameStore((s) => s.getScenario);

  const [animatedScores, setAnimatedScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const [showContent, setShowContent] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  const scenario = getScenario();

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => {
      if (score >= 70) { playCorrectAction(); setShowParticles(true); setTimeout(() => setShowParticles(false), 3000); }
    }, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [score]);

  const metrics = useMemo(() => {
    const detectionScore = detectionTime ? Math.max(0, Math.min(100, (1 - detectionTime / 15) * 100)) : 50;
    const countermeasureScore = wrongAttempts === 0 ? 100 : Math.max(0, 100 - wrongAttempts * 30);
    const roeScore = scenario.id === 'urban_ambush' ? (wrongAttempts > 0 ? 40 : 100) : 100;
    return [
      { label: 'DETECTION',      value: Math.round(detectionScore),     unit: detectionTime ? `${detectionTime.toFixed(1)}s` : 'N/A' },
      { label: 'CLASSIFICATION', value: 100,                             unit: 'Correct' },
      { label: 'COUNTERMEASURE', value: Math.round(countermeasureScore), unit: wrongAttempts === 0 ? '1st' : `${wrongAttempts} wrong` },
      { label: 'ROE',            value: Math.round(roeScore),            unit: roeScore === 100 ? 'Clean' : 'VIOLATION' },
      { label: 'OVERALL',        value: Math.round(score),               unit: `${Math.round(score)}%` },
    ];
  }, [detectionTime, wrongAttempts, score, scenario.id]);

  useEffect(() => {
    if (!showContent) return;
    const targets = metrics.map((m) => m.value);
    const duration = 1600;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScores(targets.map((t) => Math.round(t * eased)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [showContent, metrics]);

  const getScoreColor = (value: number) => value >= 80 ? '#00ff41' : value >= 50 ? '#ff6600' : '#ff0033';

  // Short debrief — max 2 lines
  const debrief = useMemo(() => {
    if (wrongAttempts > 0) {
      const tip = scenario.id === 'fiber_optic_fpv'
        ? 'RF-null + micro-Doppler = FO-FPV. Kinetic intercept only.'
        : scenario.id === 'urban_ambush'
        ? 'ROE: Kinetic prohibited in urban zone. EW only.'
        : 'Swarm: Target command node TRK-0001 first.';
      return { verdict: `${wrongAttempts} wrong attempt(s) — ${wrongAttempts * 15} pts penalty.`, tip };
    }
    return {
      verdict: 'Correct countermeasure on first attempt.',
      tip: scenario.id === 'urban_ambush' ? 'ROE compliant — EW selection correct.' : null,
    };
  }, [wrongAttempts, scenario.id]);

  const radarData = {
    labels: ['Detection', 'Classification', 'Countermeasure', 'ROE', 'Speed'],
    datasets: [{
      label: 'Performance',
      data: animatedScores.length >= 5
        ? [animatedScores[0], animatedScores[1], animatedScores[2], animatedScores[3], Math.max(0, 100 - (missionTime / 60) * 100)]
        : [0, 0, 0, 0, 0],
      backgroundColor: 'rgba(0,255,65,0.08)',
      borderColor: '#00ff41',
      borderWidth: 1.5,
      pointBackgroundColor: '#00ff41',
      pointBorderColor: '#050a12',
      pointRadius: 4,
    }],
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true, max: 100,
        ticks: { stepSize: 25, color: '#223344', backdropColor: 'transparent', font: { size: 8, family: '"JetBrains Mono"' } },
        grid: { color: 'rgba(0,255,65,0.06)' },
        angleLines: { color: 'rgba(0,255,65,0.06)' },
        pointLabels: { color: '#445566', font: { size: 9, family: '"JetBrains Mono"' } },
      },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <TacticalBackground variant="circuit" />
      <Vignette />
      <ParticleExplosion active={showParticles} x={50} y={30} count={70} color="#00ff41" />

      <div className="relative z-10 min-h-screen p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-2" style={{ animation: showContent ? 'fadeInUp 0.5s ease-out' : 'none', opacity: showContent ? 1 : 0 }}>
            <h1
              className="text-3xl md:text-4xl font-bold tracking-wider"
              style={{ fontFamily: '"Orbitron", sans-serif', color: '#00ff41', textShadow: '0 0 20px rgba(0,255,65,0.25)' }}
            >
              AFTER-ACTION REVIEW
            </h1>
            <p className="text-[9px] tracking-widest text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              {scenario.name.toUpperCase()} · {missionTime.toFixed(1)}s
            </p>
          </div>

          {/* Grade + key stats */}
          {showContent && (
            <div className="flex justify-center" style={{ animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>
              <div
                className="px-10 py-7 rounded-xl flex items-center gap-8"
                style={{
                  background: 'rgba(10,14,20,0.95)',
                  border: `1px solid ${getScoreColor(animatedScores[4] ?? 0)}25`,
                  boxShadow: `0 0 40px ${getScoreColor(animatedScores[4] ?? 0)}0a`,
                }}
              >
                <GradeBadge score={animatedScores[4] ?? 0} />
                <div className="w-px h-20 bg-[rgba(0,255,65,0.08)]" />
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <IconScore size={12} color="#334455" />
                    <span className="text-[9px] text-[#445566] w-16" style={{ fontFamily: '"JetBrains Mono", monospace' }}>SCORE</span>
                    <span className="text-xl font-bold" style={{ color: getScoreColor(score), fontFamily: '"Orbitron", sans-serif' }}>{animatedScores[4] ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IconTimer size={12} color="#334455" />
                    <span className="text-[9px] text-[#445566] w-16" style={{ fontFamily: '"JetBrains Mono", monospace' }}>TIME</span>
                    <span className="text-sm font-bold text-[#667788]" style={{ fontFamily: '"Orbitron", sans-serif' }}>{missionTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IconShield size={12} color="#334455" />
                    <span className="text-[9px] text-[#445566] w-16" style={{ fontFamily: '"JetBrains Mono", monospace' }}>ROE</span>
                    <span className="text-sm font-bold" style={{ color: wrongAttempts > 0 && scenario.id === 'urban_ambush' ? '#ff0033' : '#00ff41', fontFamily: '"JetBrains Mono", monospace' }}>
                      {wrongAttempts > 0 && scenario.id === 'urban_ambush' ? 'VIOLATED' : 'CLEAN'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Score metric cards */}
          {showContent && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
              {metrics.slice(0, 4).map((metric, i) => (
                <div
                  key={metric.label}
                  className="p-4 rounded-lg"
                  style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.07)' }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[8px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>{metric.label}</p>
                    <span className="text-[8px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{metric.unit}</span>
                  </div>
                  <p className="text-3xl font-bold mb-2" style={{ color: getScoreColor(animatedScores[i]), fontFamily: '"Orbitron", sans-serif' }}>
                    {animatedScores[i]}
                  </p>
                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,255,65,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${animatedScores[i]}%`,
                        backgroundColor: getScoreColor(animatedScores[i]),
                        transition: 'width 1.4s ease-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Radar chart + mission timeline side by side */}
          {showContent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'fadeInUp 0.5s ease-out 0.45s both' }}>
              {/* Radar */}
              <div className="p-5 rounded-lg" style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.07)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconTarget size={11} color="#445566" />
                  <p className="text-[8px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>PERFORMANCE RADAR</p>
                </div>
                <div className="h-52"><Radar data={radarData} options={radarOptions} /></div>
              </div>

              {/* Mission timeline — compact 1-liners */}
              <div className="p-5 rounded-lg" style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.07)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <IconTimer size={11} color="#445566" />
                  <p className="text-[8px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>KILL-CHAIN TIMELINE</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'RADAR CONTACT',    time: detectionTime,                         color: '#00ff41', icon: <IconTarget size={12} color="#00ff41" /> },
                    { label: 'THREAT CLASSIFIED', time: detectionTime ? detectionTime + 3 : 3, color: '#00ff41', icon: <IconShield size={12} color="#00ff41" /> },
                    { label: 'ENGAGEMENT WINDOW', time: engagementTime ?? 8,                   color: '#ff6600', icon: <IconWarning size={12} color="#ff6600" /> },
                    ...actionLog
                      .filter((e) => e.result !== 'neutral')
                      .map((e) => ({
                        label: e.result === 'success' ? 'COUNTERMEASURE DEPLOYED' : 'FAILED ATTEMPT',
                        time: e.time,
                        color: e.result === 'success' ? '#00ff41' : '#ff0033',
                        icon: e.result === 'success' ? <IconShield size={12} color="#00ff41" /> : <IconWarning size={12} color="#ff0033" />,
                      })),
                    { label: score >= 70 ? 'TARGET NEUTRALIZED' : 'MISSION CONCLUDED', time: missionTime, color: score >= 70 ? '#00ff41' : '#ff0033', icon: <IconExplosion size={12} color={score >= 70 ? '#00ff41' : '#ff0033'} /> },
                  ].map((ev, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0">{ev.icon}</div>
                      <span className="text-[9px] font-bold flex-1 truncate" style={{ color: ev.color, fontFamily: '"Orbitron", sans-serif' }}>{ev.label}</span>
                      <span className="text-[9px] text-[#334455] flex-shrink-0" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        T+{(ev.time ?? 0).toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Debrief — 2 lines max */}
          {showContent && (
            <div
              className="p-5 rounded-lg"
              style={{
                background: wrongAttempts > 0 ? 'rgba(255,0,51,0.03)' : 'rgba(10,14,20,0.9)',
                border: wrongAttempts > 0 ? '1px solid rgba(255,0,51,0.15)' : '1px solid rgba(0,255,65,0.07)',
                animation: 'fadeInUp 0.5s ease-out 0.6s both',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                {wrongAttempts > 0 ? <IconWarning size={12} color="#ff0033" /> : <IconShield size={12} color="#00ff41" />}
                <p
                  className="text-[8px] tracking-widest"
                  style={{ fontFamily: '"Orbitron", sans-serif', color: wrongAttempts > 0 ? '#ff0033' : '#00ff41' }}
                >
                  TACTICAL DEBRIEF
                </p>
              </div>
              <p className="text-[10px] text-[#556677] mb-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{debrief.verdict}</p>
              {debrief.tip && (
                <p className="text-[10px] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{debrief.tip}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {showContent && (
            <div className="flex gap-4 justify-center pb-8" style={{ animation: 'fadeInUp 0.5s ease-out 0.7s both' }}>
              <button
                onClick={() => { playButtonClick(); resetMission(); router.push('/trainee'); }}
                className="px-9 py-3.5 rounded-lg font-bold tracking-widest uppercase transition-all duration-200"
                style={{ fontFamily: '"Orbitron", sans-serif', background: 'transparent', border: '1px solid rgba(0,255,65,0.3)', color: '#00ff41', fontSize: '0.8rem' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,65,0.06)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                NEW MISSION
              </button>
              <button
                onClick={() => { playButtonClick(); router.push('/trainee/simulation'); }}
                className="px-9 py-3.5 rounded-lg font-bold tracking-widest uppercase transition-all duration-200"
                style={{ fontFamily: '"Orbitron", sans-serif', background: '#00ff41', color: '#050a12', fontSize: '0.8rem', boxShadow: '0 0 20px rgba(0,255,65,0.2)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(0,255,65,0.38)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,255,65,0.2)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              >
                RETRY
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
