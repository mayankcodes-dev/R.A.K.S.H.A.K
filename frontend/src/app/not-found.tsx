'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TacticalBackground, Vignette } from '@/components/ui/VisualEffects';
import { IconRadar, IconWarning, IconShield } from '@/components/ui/Icons';

function RadarLost() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let raf: number;

    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) / 2 - 4;

      // Fade trail
      ctx.fillStyle = 'rgba(5,10,18,0.18)';
      ctx.fillRect(0, 0, W, H);

      // Outer rings
      ctx.strokeStyle = 'rgba(0,255,65,0.12)';
      ctx.lineWidth = 0.8;
      for (const r of [R, R * 0.66, R * 0.33]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Cross-hairs
      ctx.strokeStyle = 'rgba(0,255,65,0.07)';
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      // Sweep fill (pie slice)
      const sweep = ctx.createLinearGradient(cx, cy, cx + R, cy);
      sweep.addColorStop(0, 'rgba(0,255,65,0.30)');
      sweep.addColorStop(1, 'rgba(0,255,65,0.02)');

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, -Math.PI / 12, Math.PI / 6);
      ctx.closePath();
      ctx.fillStyle = sweep;
      ctx.fill();

      // Sweep arm
      ctx.strokeStyle = 'rgba(0,255,65,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R, 0);
      ctx.stroke();

      ctx.restore();

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff41';
      ctx.fill();

      // No blips — sector is lost
      angle += 0.028;
      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="opacity-90"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}

function GlitchText({ text }: { text: string }) {
  const [glitched, setGlitched] = useState(false);
  // BUG-09: Compute offset in state, not in JSX expression, to prevent new value on every render
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(Math.random() * 6 - 3);
      setGlitched(true);
      setTimeout(() => setGlitched(false), 120);
    }, 2800 + Math.random() * 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      style={{
        fontFamily: '"Orbitron", sans-serif',
        fontWeight: 900,
        fontSize: 'clamp(4rem, 14vw, 8rem)',
        color: glitched ? '#ff0033' : '#00ff41',
        textShadow: glitched
          ? '3px 0 #ff6600, -3px 0 #00ff41, 0 0 20px #ff003380'
          : '0 0 30px rgba(0,255,65,0.5), 0 0 60px rgba(0,255,65,0.2)',
        letterSpacing: '0.05em',
        display: 'inline-block',
        transform: glitched ? `translate(${offset}px, 0)` : 'none',
        transition: 'color 0.05s, text-shadow 0.05s',
      }}
    >
      {text}
    </span>
  );
}

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center">
      <TacticalBackground variant="topo" />
      <Vignette />

      {/* Scanline overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 max-w-2xl mx-auto">

        {/* Corner brackets */}
        {[['top-0 left-0', 'border-t-2 border-l-2 w-8 h-8'],
          ['top-0 right-0', 'border-t-2 border-r-2 w-8 h-8'],
          ['bottom-0 left-0', 'border-b-2 border-l-2 w-8 h-8'],
          ['bottom-0 right-0', 'border-b-2 border-r-2 w-8 h-8']].map(([pos, cls], i) => (
          <div key={i} className={`absolute ${pos} ${cls}`} style={{ borderColor: 'rgba(0,255,65,0.4)' }} />
        ))}

        {/* Status label */}
        <div className="flex items-center gap-2 mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <IconWarning size={12} color="#ff0033" />
          <span className="text-[9px] tracking-[0.3em]" style={{ fontFamily: '"Orbitron", sans-serif', color: '#ff0033' }}>
            SECTOR NOT FOUND — SIGNAL LOST
          </span>
          <IconWarning size={12} color="#ff0033" />
        </div>

        {/* Radar */}
        <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
          <RadarLost />
        </div>

        {/* 404 */}
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <GlitchText text="404" />
        </div>

        {/* Sub-label */}
        <div className="mt-4 mb-2 space-y-1" style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
          <p className="text-sm tracking-[0.25em]" style={{ fontFamily: '"Orbitron", sans-serif', color: '#556677' }}>
            UNKNOWN SECTOR
          </p>
          <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#334455' }}>
            Requested coordinates fall outside mapped operational area. No radar contacts in this sector. Redirecting to Command Center.
          </p>
        </div>

        {/* Countdown bar */}
        <div className="w-full max-w-xs mt-6 mb-6" style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] tracking-widest text-[#334455]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>AUTO-REDIRECT</span>
            <span className="text-[9px] tracking-widest" style={{ fontFamily: '"JetBrains Mono", monospace', color: countdown <= 5 ? '#ff0033' : '#00ff41' }}>
              {String(countdown).padStart(2, '0')}s
            </span>
          </div>
          <div className="h-px w-full" style={{ background: 'rgba(0,255,65,0.08)' }}>
            <div
              className="h-full"
              style={{
                width: `${(countdown / 15) * 100}%`,
                background: countdown <= 5 ? '#ff0033' : '#00ff41',
                boxShadow: countdown <= 5 ? '0 0 6px #ff003360' : '0 0 6px rgba(0,255,65,0.4)',
                transition: 'width 1s linear, background 0.3s',
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap justify-center" style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-lg font-bold tracking-widest uppercase transition-all duration-200 hover:scale-105"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.75rem',
              background: 'rgba(0,255,65,0.08)',
              border: '2px solid rgba(0,255,65,0.5)',
              color: '#00ff41',
              boxShadow: '0 0 16px rgba(0,255,65,0.1)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,65,0.15)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,65,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,255,65,0.08)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,65,0.1)'; }}
          >
            <div className="flex items-center gap-2">
              <IconShield size={14} color="#00ff41" />
              RETURN TO BASE
            </div>
          </button>

          <button
            onClick={() => router.push('/simulation')}
            className="px-8 py-3 rounded-lg font-bold tracking-widest uppercase transition-all duration-200 hover:scale-105"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              fontSize: '0.75rem',
              background: 'transparent',
              border: '1px solid rgba(85,102,119,0.3)',
              color: '#556677',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,102,0,0.4)'; e.currentTarget.style.color = '#ff6600'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(85,102,119,0.3)'; e.currentTarget.style.color = '#556677'; }}
          >
            <div className="flex items-center gap-2">
              <IconRadar size={14} color="currentColor" />
              LAUNCH SIMULATION
            </div>
          </button>
        </div>

        {/* System status */}
        <div className="mt-10 space-y-1" style={{ animation: 'fadeInUp 0.5s ease-out 0.6s both' }}>
          {[
            { label: 'NAV SYSTEM', status: 'DEGRADED', color: '#ff6600' },
            { label: 'RADAR COVERAGE', status: 'NO SIGNAL', color: '#ff0033' },
            { label: 'COMMAND UPLINK', status: 'ACTIVE', color: '#00ff41' },
          ].map(({ label, status, color }) => (
            <div key={label} className="flex items-center justify-between gap-8">
              <span className="text-[9px] text-[#223333] tracking-widest" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{label}</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
                <span className="text-[9px] tracking-wider" style={{ fontFamily: '"JetBrains Mono", monospace', color }}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
