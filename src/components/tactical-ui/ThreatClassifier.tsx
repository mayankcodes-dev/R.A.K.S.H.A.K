'use client';

import { useGameStore } from '@/lib/gameStore';
import { IconRadar, IconSensor, IconWarning, IconShield } from '@/components/ui/Icons';

interface SensorRow {
  label: string;
  value: string;
  color?: string;
  pulse?: boolean;
}

export function ThreatClassifier() {
  const phase = useGameStore((s) => s.phase);
  const confidence = useGameStore((s) => s.threatConfidence);
  const distance = useGameStore((s) => s.droneDistance);
  const getScenario = useGameStore((s) => s.getScenario);

  const scenario = getScenario();
  const isActive = phase !== 'BRIEFING' && phase !== 'SCANNING';
  const isEngaged = phase === 'AWAITING_ACTION' || phase === 'WRONG_ACTION';
  const isNeutralized = phase === 'NEUTRALIZED';

  const getClassLabel = () => {
    switch (phase) {
      case 'BRIEFING': case 'SCANNING': return { text: 'NO CONTACT', color: '#334455' };
      case 'DETECTED': return { text: 'UNIDENTIFIED', color: '#ff6600' };
      case 'CLASSIFYING': return { text: 'ANALYZING...', color: '#ff6600' };
      case 'AWAITING_ACTION': case 'WRONG_ACTION': return { text: 'HOSTILE UAS', color: '#ff0033' };
      case 'CORRECT_ACTION': case 'ENGAGEMENT': return { text: 'ENGAGING', color: '#ff6600' };
      case 'NEUTRALIZED': return { text: 'NEUTRALIZED', color: '#00ff41' };
      default: return { text: '———', color: '#334455' };
    }
  };

  const cls = getClassLabel();

  // Sensor readings — scenario-aware
  const getSensorData = (): SensorRow[] => {
    if (!isActive) return [];
    const rfSig = scenario.id === 'fiber_optic_fpv' ? { value: 'NULL', color: '#ff0033' } : { value: '2.4 GHz', color: '#ff6600' };
    const gpsLock = scenario.id === 'fiber_optic_fpv' ? { value: 'NONE', color: '#334455' } : { value: 'ACTIVE', color: '#ff6600' };
    const platform = scenario.id === 'swarm_storm' ? 'Swarm / Mesh' : scenario.id === 'urban_ambush' ? 'Quadrotor RF' : 'FPV Fiber-Optic';

    return [
      { label: 'RF SIGNAL', value: rfSig.value, color: rfSig.color },
      { label: 'MICRO-DOPPLER', value: 'DETECTED', color: '#00ff41' },
      { label: 'GPS LINK', value: gpsLock.value, color: gpsLock.color },
      { label: 'PLATFORM', value: platform, color: '#8899aa' },
      { label: 'EW IMMUNE', value: scenario.id === 'fiber_optic_fpv' ? 'YES' : 'NO', color: scenario.id === 'fiber_optic_fpv' ? '#ff0033' : '#00ff41' },
    ];
  };

  const sensorData = getSensorData();

  return (
    <div className="space-y-3 h-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <IconRadar size={11} color="#556677" />
        <span className="text-[9px] tracking-[0.25em] text-[#556677]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
          THREAT CLASSIFIER
        </span>
      </div>

      {/* ── Track info ── */}
      <div
        className="rounded p-3 space-y-2.5"
        style={{ background: 'rgba(10,14,20,0.95)', border: '1px solid rgba(0,255,65,0.08)' }}
      >
        {/* Track ID */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>TRACK ID</span>
          <span
            className="text-xs font-bold tracking-wider"
            style={{ color: isActive ? '#e0e6ed' : '#334455', fontFamily: '"JetBrains Mono", monospace' }}
          >
            {isActive ? (scenario.id === 'swarm_storm' ? 'TRK-0001' : scenario.id === 'urban_ambush' ? 'TRK-0077' : 'TRK-0042') : '———'}
          </span>
        </div>

        {/* Classification */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>CLASS</span>
          <span
            className={`text-xs font-bold tracking-wider ${isEngaged ? 'animate-pulse-slow' : ''}`}
            style={{ color: cls.color, fontFamily: '"JetBrains Mono", monospace' }}
          >
            {cls.text}
          </span>
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>CONFIDENCE</span>
            <span className="text-xs" style={{ color: confidence > 0.8 ? '#ff0033' : confidence > 0.5 ? '#ff6600' : '#556677', fontFamily: '"JetBrains Mono", monospace' }}>
              {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : '———'}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,255,65,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${confidence * 100}%`,
                backgroundColor: confidence > 0.8 ? '#ff0033' : confidence > 0.5 ? '#ff6600' : '#00ff41',
                boxShadow: confidence > 0 ? `0 0 6px ${confidence > 0.8 ? '#ff003360' : '#ff660060'}` : 'none',
              }}
            />
          </div>
        </div>

        {/* Range */}
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-[#445566]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>RANGE</span>
          <span className="text-xs" style={{ color: distance < 500 ? '#ff0033' : distance < 1000 ? '#ff6600' : '#8899aa', fontFamily: '"JetBrains Mono", monospace' }}>
            {distance > 0 && isActive ? `${distance}m` : '———'}
          </span>
        </div>
      </div>

      {/* ── Sensor Readings ── */}
      {isActive && sensorData.length > 0 && (
        <div
          className="rounded p-3 space-y-2 flex-1"
          style={{ background: 'rgba(10,14,20,0.95)', border: '1px solid rgba(0,255,65,0.08)' }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <IconSensor size={10} color="#556677" />
            <span className="text-[9px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
              SENSOR DATA
            </span>
          </div>
          {sensorData.map((row) => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-[9px] text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{row.label}</span>
              <span className="text-[10px] font-bold" style={{ color: row.color, fontFamily: '"JetBrains Mono", monospace' }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Status indicator ── */}
      {isNeutralized && (
        <div
          className="rounded p-2.5 flex items-center gap-2"
          style={{ background: 'rgba(0,255,65,0.06)', border: '1px solid rgba(0,255,65,0.2)' }}
        >
          <IconShield size={12} color="#00ff41" />
          <span className="text-[10px] text-[#00ff41]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            SECTOR CLEAR
          </span>
        </div>
      )}

      {isEngaged && (
        <div
          className="rounded p-2.5 flex items-center gap-2"
          style={{ background: 'rgba(255,0,51,0.06)', border: '1px solid rgba(255,0,51,0.2)', animation: 'borderDanger 1s ease-in-out infinite' }}
        >
          <IconWarning size={12} color="#ff0033" />
          <span className="text-[10px] text-[#ff0033] animate-pulse-slow" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
            ENGAGE NOW
          </span>
        </div>
      )}
    </div>
  );
}
