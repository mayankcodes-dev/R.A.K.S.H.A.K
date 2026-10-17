'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/gameStore';
import { TacticalBackground, Vignette, ParticleExplosion } from '@/components/ui/VisualEffects';
import { IconScore, IconTimer, IconShield, IconTarget, IconWarning, IconExplosion, IconSensor } from '@/components/ui/Icons';
import { playCorrectAction, playButtonClick } from '@/lib/soundEngine';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  RadialLinearScale, ArcElement, BarElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  RadialLinearScale, ArcElement, BarElement, Filler, Tooltip, Legend
);

function GradeBadge({ score }: { score: number }) {
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';
  const color = score >= 80 ? '#00ff41' : score >= 60 ? '#ff6600' : '#ff0033';
  const label = score >= 80 ? 'MISSION SUCCESS' : score >= 60 ? 'SATISFACTORY' : 'NEEDS IMPROVEMENT';
  return (
    <div className="text-center">
      <div
        className="text-8xl font-bold leading-none"
        style={{ fontFamily: '"Orbitron", sans-serif', color, textShadow: `0 0 30px ${color}60` }}
      >
        {grade}
      </div>
      <div className="text-sm tracking-[0.2em] mt-2" style={{ color, fontFamily: '"JetBrains Mono", monospace' }}>{label}</div>
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
      if (score >= 70) {
        playCorrectAction();
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 3000);
      }
    }, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [score]);

  const metrics = useMemo(() => {
    const detectionScore = detectionTime ? Math.max(0, Math.min(100, (1 - detectionTime / 15) * 100)) : 50;
    const classificationScore = 100;
    const countermeasureScore = wrongAttempts === 0 ? 100 : Math.max(0, 100 - wrongAttempts * 30);
    const roeScore = scenario.id === 'urban_ambush'
      ? (wrongAttempts > 0 ? 40 : 100)
      : 100;
    return [
      { label: 'DETECTION', value: Math.round(detectionScore), unit: detectionTime ? `${detectionTime.toFixed(1)}s` : 'N/A', detail: detectionScore >= 80 ? 'Excellent acquisition speed' : 'Below optimal threshold' },
      { label: 'CLASSIFICATION', value: Math.round(classificationScore), unit: 'Correct', detail: 'Target correctly identified via micro-Doppler' },
      { label: 'COUNTERMEASURE', value: Math.round(countermeasureScore), unit: wrongAttempts === 0 ? '1st attempt' : `${wrongAttempts} wrong`, detail: wrongAttempts === 0 ? 'Correct selection on first attempt' : `${wrongAttempts} incorrect attempt(s)` },
      { label: 'ROE COMPLIANCE', value: Math.round(roeScore), unit: roeScore === 100 ? 'No violations' : 'VIOLATION', detail: roeScore === 100 ? 'Rules of Engagement followed' : 'ROE breach detected' },
      { label: 'OVERALL', value: Math.round(score), unit: `${Math.round(score)}%`, detail: score >= 80 ? 'Mission: EXCELLENT' : score >= 60 ? 'Mission: SATISFACTORY' : 'Mission: NEEDS IMPROVEMENT' },
    ];
  }, [detectionTime, wrongAttempts, score, scenario.id]);

  // Animate scores on reveal
  useEffect(() => {
    if (!showContent) return;
    const targets = metrics.map((m) => m.value);
    const duration = 1800;
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

  const feedback = useMemo(() => {
    const parts: string[] = [];
    if (wrongAttempts > 0) {
      parts.push(`CRITICAL: You attempted ${wrongAttempts} incorrect countermeasure(s) before the correct response. This cost ${wrongAttempts * 15} points and wasted critical engagement window time.`);
      if (scenario.id === 'fiber_optic_fpv') {
        parts.push('When RF spectrum analysis shows ZERO signature with positive micro-Doppler — classify immediately as FO-FPV. Hard-kill only. Never attempt EW on RF-silent targets.');
      } else if (scenario.id === 'urban_ambush') {
        parts.push('ROE VIOLATION: Kinetic intercept is PROHIBITED within 200m of civilian infrastructure. GPS Spoof or RF Jam were the authorized responses.');
      } else {
        parts.push('For swarm scenarios: prioritize the command node (TRK-0001). Kinetic intercept the autonomous lead drone before attempting EW on followers.');
      }
    } else {
      parts.push(`EXCELLENT: Correct countermeasure selected on the first attempt. Strong tactical decision-making demonstrated for the "${scenario.name}" scenario.`);
      if (scenario.id === 'urban_ambush') {
        parts.push('ROE COMPLIANT: You correctly identified that kinetic intercept was prohibited near civilian infrastructure and selected the appropriate EW countermeasure.');
      }
    }
    if (detectionTime && detectionTime > 10) {
      parts.push(`Detection time of ${detectionTime.toFixed(1)}s exceeded the 10s threshold. Improve radar scan pattern discipline and sector coverage.`);
    }
    parts.push(`Total mission time: ${missionTime.toFixed(1)}s. Engagement window: ${wrongAttempts === 0 ? 'OPTIMAL' : 'SUBOPTIMAL'}.`);
    return parts;
  }, [wrongAttempts, detectionTime, missionTime, scenario]);

  const radarData = {
    labels: ['Detection', 'Classification', 'Countermeasure', 'ROE', 'Speed'],
    datasets: [{
      label: 'Performance',
      data: animatedScores.length >= 5
        ? [animatedScores[0], animatedScores[1], animatedScores[2], animatedScores[3], Math.max(0, 100 - (missionTime / 60) * 100)]
        : [0, 0, 0, 0, 0],
      backgroundColor: 'rgba(0,255,65,0.1)',
      borderColor: '#00ff41',
      borderWidth: 2,
      pointBackgroundColor: '#00ff41',
      pointBorderColor: '#050a12',
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true, max: 100,
        ticks: { stepSize: 20, color: '#334455', backdropColor: 'transparent', font: { size: 9, family: '"JetBrains Mono"' } },
        grid: { color: 'rgba(0,255,65,0.08)' },
        angleLines: { color: 'rgba(0,255,65,0.08)' },
        pointLabels: { color: '#556677', font: { size: 10, family: '"JetBrains Mono"' } },
      },
    },
    plugins: { legend: { display: false } },
  };

  const timelineData = {
    labels: actionLog.map((e) => `T+${e.time.toFixed(0)}s`),
    datasets: [{
      label: 'Events',
      data: actionLog.map((e) => e.result === 'success' ? 100 : e.result === 'error' ? 30 : 60),
      backgroundColor: actionLog.map((e) =>
        e.result === 'success' ? 'rgba(0,255,65,0.5)' :
        e.result === 'error' ? 'rgba(255,0,51,0.5)' : 'rgba(85,102,119,0.4)'
      ),
      borderColor: actionLog.map((e) =>
        e.result === 'success' ? '#00ff41' :
        e.result === 'error' ? '#ff0033' : '#556677'
      ),
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const timelineOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#556677', font: { size: 9, family: '"JetBrains Mono"' } }, grid: { color: 'rgba(0,255,65,0.04)' } },
      y: { display: false, max: 120 },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: any) => actionLog[ctx.dataIndex]?.description ?? '' } },
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <TacticalBackground variant="circuit" />
      <Vignette />

      {/* Particle burst for high score */}
      <ParticleExplosion active={showParticles} x={50} y={30} count={80} color="#00ff41" />

      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Header ── */}
          <div
            className="text-center space-y-3"
            style={{ animation: showContent ? 'fadeInUp 0.6s ease-out' : 'none', opacity: showContent ? 1 : 0 }}
          >
            <div className="flex items-center justify-center gap-3">
              <IconExplosion size={16} color="#ff6600" />
              <span
                className="text-[11px] tracking-[0.3em] text-[#ff6600]"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                MISSION COMPLETE — DEBRIEF INITIATED
              </span>
              <IconExplosion size={16} color="#ff6600" />
            </div>
            <h1
              className="text-3xl md:text-5xl font-bold tracking-wider"
              style={{ fontFamily: '"Orbitron", sans-serif', color: '#00ff41', textShadow: '0 0 20px rgba(0,255,65,0.3)' }}
            >
              AFTER-ACTION REVIEW
            </h1>
            <p className="text-xs tracking-wider text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              SCN-{String(scenario.index).padStart(3, '0')} {scenario.name.toUpperCase()} — {scenario.subtitle} | Duration: {missionTime.toFixed(1)}s
            </p>
          </div>

          {/* ── Score + Grade ── */}
          {showContent && (
            <div className="flex justify-center" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
              <div
                className="px-12 py-8 rounded-xl text-center"
                style={{
                  background: 'rgba(10,14,20,0.95)',
                  border: `2px solid ${getScoreColor(animatedScores[4] ?? 0)}30`,
                  boxShadow: `0 0 40px ${getScoreColor(animatedScores[4] ?? 0)}15`,
                }}
              >
                <div className="flex items-center gap-8">
                  <GradeBadge score={animatedScores[4] ?? 0} />
                  <div className="w-px h-24 bg-[rgba(0,255,65,0.1)]" />
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-2">
                      <IconScore size={14} color="#556677" />
                      <span className="text-[10px] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>SCORE</span>
                      <span className="text-2xl font-bold ml-1" style={{ color: getScoreColor(score), fontFamily: '"Orbitron", sans-serif' }}>
                        {animatedScores[4] ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconTimer size={14} color="#556677" />
                      <span className="text-[10px] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>DURATION</span>
                      <span className="text-sm font-bold ml-1 text-[#8899aa]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                        {missionTime.toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconShield size={14} color="#556677" />
                      <span className="text-[10px] text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>ROE STATUS</span>
                      <span className="text-sm font-bold ml-1" style={{ color: wrongAttempts > 0 && scenario.id === 'urban_ambush' ? '#ff0033' : '#00ff41', fontFamily: '"JetBrains Mono", monospace' }}>
                        {wrongAttempts > 0 && scenario.id === 'urban_ambush' ? 'VIOLATED' : 'COMPLIANT'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Score metric cards ── */}
          {showContent && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
              {metrics.slice(0, 4).map((metric, i) => (
                <div
                  key={metric.label}
                  className="p-4 rounded-lg space-y-3"
                  style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.08)' }}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] tracking-widest text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                      {metric.label}
                    </p>
                    <span className="text-[9px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{metric.unit}</span>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: getScoreColor(animatedScores[i]), fontFamily: '"Orbitron", sans-serif' }}>
                    {animatedScores[i]}
                  </p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,255,65,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${animatedScores[i]}%`,
                        backgroundColor: getScoreColor(animatedScores[i]),
                        boxShadow: `0 0 6px ${getScoreColor(animatedScores[i])}60`,
                        transition: 'width 1.5s ease-out',
                      }}
                    />
                  </div>
                  <p className="text-[9px] leading-relaxed text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Charts ── */}
          {showContent && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
              <div className="p-6 rounded-lg" style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.08)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconTarget size={12} color="#556677" />
                  <p className="text-[9px] tracking-widest text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>PERFORMANCE RADAR</p>
                </div>
                <div className="h-60"><Radar data={radarData} options={radarOptions} /></div>
              </div>

              <div className="p-6 rounded-lg" style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.08)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <IconTimer size={12} color="#556677" />
                  <p className="text-[9px] tracking-widest text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>EVENT TIMELINE</p>
                </div>
                <div className="h-60"><Bar data={timelineData} options={timelineOptions} /></div>
              </div>
            </div>
          )}

          {/* ── Mission Timeline ── */}
          {showContent && (
            <div className="p-6 rounded-lg" style={{ background: 'rgba(10,14,20,0.9)', border: '1px solid rgba(0,255,65,0.08)', animation: 'fadeInUp 0.6s ease-out 0.7s both' }}>
              <div className="flex items-center gap-2 mb-6">
                <IconTimer size={12} color="#556677" />
                <p className="text-[9px] tracking-widest text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                  MISSION TIMELINE
                </p>
              </div>

              <div className="relative">
                {/* Vertical connector line */}
                <div className="absolute left-[19px] top-6 bottom-6 w-px" style={{ background: 'linear-gradient(to bottom, rgba(0,255,65,0.3), rgba(0,255,65,0.05))' }} />

                <div className="space-y-5">
                  {/* Milestone 1 — Radar Contact */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.4)' }}>
                      <IconTarget size={16} color="#00ff41" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: '#00ff41' }}>RADAR CONTACT</span>
                        <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#334455' }}>
                          {detectionTime ? `T+${detectionTime.toFixed(1)}s` : 'T+0.0s'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#556677' }}>
                        Sensor sweep acquired {scenario.id === 'swarm_storm' ? 'swarm formation (12 UAVs)' : 'hostile UAV'} at sector boundary. Threat track initiated.
                      </p>
                    </div>
                  </div>

                  {/* Milestone 2 — Threat Classified */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.4)' }}>
                      <IconSensor size={16} color="#00ff41" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: '#00ff41' }}>THREAT CLASSIFIED</span>
                        <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#334455' }}>
                          {detectionTime ? `T+${(detectionTime + 3).toFixed(1)}s` : 'T+3.0s'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#556677' }}>
                        {scenario.id === 'fiber_optic_fpv'
                          ? 'RF-silent micro-Doppler signature. Confirmed fiber-optic FPV. Hard-kill authorization requested.'
                          : scenario.id === 'swarm_storm'
                          ? 'Autonomous swarm — commercial GPS nav. Lead node TRK-0001 confirmed. Followers semi-autonomous.'
                          : 'Commercial quadrotor in restricted ROE zone. Kinetic intercept NOT authorized. EW countermeasures only.'}
                      </p>
                    </div>
                  </div>

                  {/* Milestone 3 — Engagement Window */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: 'rgba(255,102,0,0.1)', border: '1px solid rgba(255,102,0,0.4)' }}>
                      <IconWarning size={16} color="#ff6600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: '#ff6600' }}>ENGAGEMENT WINDOW OPEN</span>
                        <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#334455' }}>
                          {engagementTime ? `T+${engagementTime.toFixed(1)}s` : 'T+8.0s'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#556677' }}>
                        Fire authorization cleared. Countermeasure selection active.{' '}
                        {wrongAttempts > 0 ? `${wrongAttempts} incorrect attempt(s) registered before correct response.` : 'Correct selection on first attempt.'}
                      </p>
                    </div>
                  </div>

                  {/* Milestone 4 — Per action log entry */}
                  {actionLog.map((entry, i) => {
                    const isSuccess = entry.result === 'success';
                    const isError = entry.result === 'error';
                    const borderCol = isSuccess ? 'rgba(0,255,65,0.4)' : isError ? 'rgba(255,0,51,0.4)' : 'rgba(85,102,119,0.3)';
                    const bgCol = isSuccess ? 'rgba(0,255,65,0.1)' : isError ? 'rgba(255,0,51,0.1)' : 'rgba(85,102,119,0.08)';
                    const labelCol = isSuccess ? '#00ff41' : isError ? '#ff0033' : '#556677';
                    const labelText = isSuccess ? 'COUNTERMEASURE DEPLOYED' : isError ? 'FAILED ATTEMPT' : 'ACTION REGISTERED';
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: bgCol, border: `1px solid ${borderCol}` }}>
                          {isSuccess ? <IconShield size={16} color="#00ff41" /> : <IconWarning size={16} color={isError ? '#ff0033' : '#556677'} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3 mb-1">
                            <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: labelCol }}>{labelText}</span>
                            <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#334455' }}>T+{entry.time.toFixed(1)}s</span>
                          </div>
                          <p className="text-[11px] leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace', color: isSuccess ? '#00ff41' : isError ? '#ff003380' : '#556677' }}>
                            {entry.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final milestone — Target Neutralized */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                      style={{
                        background: score >= 70 ? 'rgba(0,255,65,0.15)' : 'rgba(255,0,51,0.1)',
                        border: score >= 70 ? '2px solid rgba(0,255,65,0.7)' : '2px solid rgba(255,0,51,0.5)',
                        boxShadow: score >= 70 ? '0 0 14px rgba(0,255,65,0.3)' : 'none',
                      }}>
                      <IconExplosion size={16} color={score >= 70 ? '#00ff41' : '#ff0033'} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-[10px] font-bold tracking-widest" style={{ fontFamily: '"Orbitron", sans-serif', color: score >= 70 ? '#00ff41' : '#ff0033' }}>
                          {score >= 70 ? 'TARGET NEUTRALIZED' : 'MISSION CONCLUDED'}
                        </span>
                        <span className="text-[9px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#334455' }}>T+{missionTime.toFixed(1)}s</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace', color: score >= 70 ? '#00ff41' : '#ff0033' }}>
                        {score >= 70
                          ? `Threat eliminated. Sector secured. Final score: ${Math.round(score)}%.`
                          : `Mission concluded with suboptimal outcome. Debrief mandatory. Score: ${Math.round(score)}%.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tactical debrief ── */}
          {showContent && (
            <div
              className="p-6 rounded-lg"
              style={{
                background: wrongAttempts > 0 ? 'rgba(255,0,51,0.04)' : 'rgba(10,14,20,0.9)',
                border: wrongAttempts > 0 ? '1px solid rgba(255,0,51,0.2)' : '1px solid rgba(0,255,65,0.08)',
                animation: 'fadeInUp 0.6s ease-out 0.8s both',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                {wrongAttempts > 0 ? <IconWarning size={14} color="#ff0033" /> : <IconShield size={14} color="#00ff41" />}
                <p
                  className="text-[9px] tracking-widest"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    color: wrongAttempts > 0 ? '#ff0033' : '#00ff41',
                  }}
                >
                  {wrongAttempts > 0 ? 'TACTICAL DEBRIEF — AREAS FOR IMPROVEMENT' : 'TACTICAL DEBRIEF — COMMENDATION'}
                </p>
              </div>
              <div className="space-y-3">
                {feedback.map((para, i) => (
                  <p key={i} className="text-xs leading-relaxed text-[#556677]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ── Restart ── */}
          {showContent && (
            <div className="flex gap-4 justify-center pb-10" style={{ animation: 'fadeInUp 0.6s ease-out 0.9s both' }}>
              <button
                onClick={() => { playButtonClick(); resetMission(); router.push('/'); }}
                className="px-10 py-4 rounded-lg font-bold tracking-widest uppercase transition-all duration-200"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  background: 'transparent',
                  border: '2px solid rgba(0,255,65,0.4)',
                  color: '#00ff41',
                  fontSize: '0.9rem',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,65,0.08)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,255,65,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                NEW MISSION
              </button>

              <button
                onClick={() => { playButtonClick(); router.push('/simulation'); }}
                className="px-10 py-4 rounded-lg font-bold tracking-widest uppercase transition-all duration-200"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  background: '#00ff41',
                  color: '#050a12',
                  fontSize: '0.9rem',
                  boxShadow: '0 0 20px rgba(0,255,65,0.2)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 40px rgba(0,255,65,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(0,255,65,0.2)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                RETRY MISSION
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
