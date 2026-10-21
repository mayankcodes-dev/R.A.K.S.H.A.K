'use client';

/**
 * MicroDopplerPanel — Canvas 2D spectrogram display.
 *
 * Visualises the Short-Time Fourier Transform (STFT) output that distinguishes
 * drone types by their micro-Doppler signature:
 *   • Multi-rotor: broad body Doppler + periodic blade flash sidebands
 *   • Fiber-optic FPV: high-frequency blade flash, NO RF emission (stealth)
 *   • Bird: narrow, irregular modulation
 *   • Clutter: near-zero Doppler, no periodicity
 *
 * Rendering: synthetic spectrogram drawn frame-by-frame on a <canvas> element.
 * Phase 2: Replace synthetic data with real STFT computed from radar I/Q samples.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/gameStore';

const FREQ_BINS = 32;
const TIME_BINS = 48;
const SCROLL_SPEED_MS = 120; // new column every 120ms

// Colour map: 0→deep blue, 0.5→green, 1→bright yellow (phosphor HUD style)
function spectrogramColor(value: number): [number, number, number] {
  if (value < 0.3) {
    // dark navy → dim green
    const t = value / 0.3;
    return [0, Math.round(t * 80), Math.round(t * 40)];
  }
  if (value < 0.7) {
    // dim green → phosphor green
    const t = (value - 0.3) / 0.4;
    return [0, Math.round(80 + t * 175), Math.round(40 + t * 25)];
  }
  // phosphor green → yellow-white (hot return)
  const t = (value - 0.7) / 0.3;
  return [Math.round(t * 220), 255, Math.round(65 - t * 30)];
}

interface DroneSignature {
  bodyDopplerBin: number;   // centre bin for body Doppler
  bladeFreqBins: number[];  // sideband offsets
  bladeModDepth: number;    // how bright blade flash is (0-1)
  bladeFlashPeriodMs: number;
}

function getSignature(phase: string, scenarioId: string): DroneSignature {
  const isFPV = scenarioId === 'fiber_optic_fpv';
  const isSwarm = scenarioId === 'swarm_storm';

  if (isFPV) {
    // Fiber-optic FPV: high-velocity body Doppler, very high blade frequency, no RF
    return { bodyDopplerBin: 20, bladeFreqBins: [4, 8, 12], bladeModDepth: 0.85, bladeFlashPeriodMs: 180 };
  }
  if (isSwarm) {
    // Swarm: multiple weak returns, lower frequency
    return { bodyDopplerBin: 17, bladeFreqBins: [3, 6], bladeModDepth: 0.65, bladeFlashPeriodMs: 280 };
  }
  // Solo multi-rotor
  return { bodyDopplerBin: 18, bladeFreqBins: [5, 10], bladeModDepth: 0.70, bladeFlashPeriodMs: 240 };
}

export function MicroDopplerPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[][]>(
    Array.from({ length: TIME_BINS }, () => new Array(FREQ_BINS).fill(0))
  );
  const frameTimeRef = useRef(0);
  const animRef = useRef<number>(0);

  const phase = useGameStore((s) => s.phase);
  const getScenario = useGameStore((s) => s.getScenario);
  const scenario = getScenario();

  const sig = getSignature(phase, scenario.id);
  const sigRef = useRef(sig);
  sigRef.current = sig;

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;

    function generateColumn(timeMs: number): number[] {
      const s = sigRef.current;
      const ph = phaseRef.current;
      const active = ph !== 'BRIEFING' && ph !== 'SCANNING';

      return Array.from({ length: FREQ_BINS }, (_, f) => {
        if (!active) return Math.random() * 0.04; // noise floor only

        // Body Doppler Gaussian lobe
        const body = Math.exp(-((f - s.bodyDopplerBin) ** 2) / (2 * 4 ** 2)) * 0.9;

        // Blade flash sidebands — periodic in time
        const isFlash = Math.sin((2 * Math.PI * timeMs) / s.bladeFlashPeriodMs) > 0.0;
        const blade = isFlash
          ? s.bladeFreqBins.reduce((acc, off) => {
              const flash = Math.exp(-((f - (s.bodyDopplerBin + off)) ** 2) / (2 * 2 ** 2)) * s.bladeModDepth;
              const flashNeg = Math.exp(-((f - (s.bodyDopplerBin - off)) ** 2) / (2 * 2 ** 2)) * s.bladeModDepth * 0.5;
              return acc + flash + flashNeg;
            }, 0)
          : 0;

        // Noise floor
        const noise = Math.random() * 0.06;

        return Math.min(1, body + blade + noise);
      });
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;

      const elapsed = timestamp - lastTime;

      // Add new column at scroll speed
      if (elapsed >= SCROLL_SPEED_MS) {
        lastTime = timestamp;
        const newCol = generateColumn(timestamp);
        bufferRef.current.shift();
        bufferRef.current.push(newCol);
      }

      // Resize canvas to element size
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      const cellW = w / TIME_BINS;
      const cellH = h / FREQ_BINS;

      for (let t = 0; t < TIME_BINS; t++) {
        for (let f = 0; f < FREQ_BINS; f++) {
          const val = bufferRef.current[t][FREQ_BINS - 1 - f]; // flip freq axis (low=bottom)
          const [r, g, b] = spectrogramColor(val);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(Math.floor(t * cellW), Math.floor(f * cellH), Math.ceil(cellW) + 1, Math.ceil(cellH) + 1);
        }
      }

      // Frequency axis labels
      ctx.fillStyle = 'rgba(0,255,65,0.35)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText('+fD', 2, 10);
      ctx.fillText(' 0', 2, h / 2 + 4);
      ctx.fillText('-fD', 2, h - 2);

      // NOW marker line (right edge)
      ctx.strokeStyle = 'rgba(0,255,65,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w - 1, 0);
      ctx.lineTo(w - 1, h);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const isActive = phase !== 'BRIEFING' && phase !== 'SCANNING';
  const isFPV = scenario.id === 'fiber_optic_fpv';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] tracking-widest text-[#445566]" style={{ fontFamily: '"Orbitron", sans-serif' }}>
          μ-DOPPLER
        </span>
        <span
          className="text-[8px] px-1.5 py-0.5 rounded"
          style={{
            border: `1px solid ${isFPV && isActive ? 'rgba(255,102,0,0.4)' : 'rgba(0,255,65,0.12)'}`,
            color: isFPV && isActive ? '#ff6600' : '#334455',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {isFPV && isActive ? 'NO RF — FIBER' : isActive ? 'ACTIVE' : 'STANDBY'}
        </span>
      </div>

      <div className="flex-1 min-h-0 relative rounded overflow-hidden" style={{ border: '1px solid rgba(0,255,65,0.07)' }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />

        {/* Classification overlay */}
        {isActive && (
          <div
            className="absolute bottom-1 right-1 text-[8px] px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(5,10,18,0.85)',
              color: isFPV ? '#ff6600' : '#00ff41',
              fontFamily: '"JetBrains Mono", monospace',
              border: `1px solid ${isFPV ? 'rgba(255,102,0,0.3)' : 'rgba(0,255,65,0.2)'}`,
            }}
          >
            {isFPV ? 'FPV/FIBER' : scenario.id === 'swarm_storm' ? 'MULTI-ROTOR ×N' : 'MULTI-ROTOR'}
          </div>
        )}
      </div>
    </div>
  );
}
