'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/lib/gameStore';

// ─── SCREEN FLASH EFFECT ─────────────────────────────────────────
export function ScreenFlash() {
  const phase = useGameStore((s) => s.phase);
  const [flash, setFlash] = useState<{ color: string; opacity: number } | null>(null);
  const prevPhase = useRef(phase);

  useEffect(() => {
    if (phase === prevPhase.current) return;
    if (phase === 'WRONG_ACTION') {
      setFlash({ color: '#ff0033', opacity: 0.15 });
      setTimeout(() => setFlash(null), 400);
    } else if (phase === 'CORRECT_ACTION') {
      setFlash({ color: '#00ff41', opacity: 0.12 });
      setTimeout(() => setFlash(null), 600);
    } else if (phase === 'NEUTRALIZED') {
      setFlash({ color: '#ff6600', opacity: 0.2 });
      setTimeout(() => setFlash(null), 800);
    }
    prevPhase.current = phase;
  }, [phase]);

  if (!flash) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[999]"
      style={{
        backgroundColor: flash.color,
        opacity: flash.opacity,
        animation: 'fadeOut 0.4s ease-out forwards',
      }}
    />
  );
}

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export function ParticleExplosion({
  active,
  x = 50,
  y = 50,
  count = 40,
  color = '#ff6600',
}: {
  active: boolean;
  x?: number;
  y?: number;
  count?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!active || activeRef.current) return;
    activeRef.current = true;

    particlesRef.current = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 6;
      return {
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? color : '#ffaa00',
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
      };
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.98;
        p.life -= 0.02 / p.maxLife;

        // ✅ FIX: clamp radius to always be positive
        const radius = Math.max(0.01, p.size * p.life);

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(
          (p.x / 100) * canvas.width,
          (p.y / 100) * canvas.height,
          radius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (particlesRef.current.length > 0) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        activeRef.current = false;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      activeRef.current = false;
    };
  }, [active, x, y, count, color]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

// ─── SCANLINE GLITCH EFFECT ───────────────────────────────────────
// ✅ FIX: Math.random() moved to client-only state to avoid SSR hydration mismatch
export function GlitchEffect({ active }: { active: boolean }) {
  const [lines, setLines] = useState<{ top: number; height: number; shift: number; dir: boolean }[]>([]);

  useEffect(() => {
    if (!active) return;
    setLines(
      Array.from({ length: 3 }, (_, i) => ({
        top: 10 + i * 28 + Math.random() * 15,
        height: 2 + Math.random() * 4,
        shift: Math.random() * 10,
        dir: Math.random() > 0.5,
      }))
    );
  }, [active]);

  if (!active) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-[998] overflow-hidden">
      {lines.map((line, i) => (
        <div
          key={i}
          className="absolute w-full"
          style={{
            height: `${line.height}px`,
            backgroundColor: '#00ff41',
            top: `${line.top}%`,
            opacity: 0.15,
            animation: `glitchSlide ${0.1 + i * 0.05}s linear`,
            transform: `translateX(${line.dir ? '' : '-'}${line.shift}px)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── ANIMATED BACKGROUND GRID ─────────────────────────────────────
export function TacticalBackground({ variant = 'default' }: {
  variant?: 'default' | 'topo' | 'hex' | 'circuit';
}) {
  // Use variant-scoped pattern IDs to avoid DOM collision when Next.js
  // keeps multiple pages in its SPA navigation cache (BUG-08)
  const pid = `rakshak-bg-${variant}`;

  if (variant === 'topo') {
    // FIX: Do NOT use a repeating SVG pattern — it tiles the circles across the whole screen.
    // Instead: render a single centered radar ring composition that fills the viewport once.
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" suppressHydrationWarning
        style={{ opacity: 0.045 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          {/* Single centered radar rings — no tiling */}
          <ellipse cx="50%" cy="50%" rx="44%" ry="44%" fill="none" stroke="#00ff41" strokeWidth="0.6" />
          <ellipse cx="50%" cy="50%" rx="35%" ry="35%" fill="none" stroke="#00ff41" strokeWidth="0.6" />
          <ellipse cx="50%" cy="50%" rx="26%" ry="26%" fill="none" stroke="#00ff41" strokeWidth="0.6" />
          <ellipse cx="50%" cy="50%" rx="17%" ry="17%" fill="none" stroke="#00ff41" strokeWidth="0.6" />
          <ellipse cx="50%" cy="50%" rx="9%"  ry="9%"  fill="none" stroke="#00ff41" strokeWidth="0.6" />
          {/* Cross-hair lines */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00ff41" strokeWidth="0.4" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00ff41" strokeWidth="0.4" />
          {/* Diagonal sweeps */}
          <line x1="20%" y1="5%" x2="80%" y2="95%" stroke="#00ff41" strokeWidth="0.3" opacity="0.5" />
          <line x1="80%" y1="5%" x2="20%" y2="95%" stroke="#00ff41" strokeWidth="0.3" opacity="0.5" />
          {/* Center dot */}
          <circle cx="50%" cy="50%" r="3" fill="#00ff41" opacity="0.5" />
        </svg>
      </div>
    );
  }

  if (variant === 'hex') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.035]" suppressHydrationWarning>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" suppressHydrationWarning>
          <defs>
            <pattern id={pid} x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
              <polygon points="30,2 58,18 58,34 30,50 2,34 2,18" fill="none" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <polygon points="30,28 58,44 58,60 30,76 2,60 2,44" fill="none" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pid})`} suppressHydrationWarning />
        </svg>
      </div>
    );
  }

  if (variant === 'circuit') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]" suppressHydrationWarning>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" suppressHydrationWarning>
          <defs>
            <pattern id={pid} x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <line x1="0" y1="20" x2="30" y2="20" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="30" y1="20" x2="30" y2="50" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="30" y1="50" x2="80" y2="50" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="50" y1="0" x2="50" y2="20" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="50" y1="20" x2="60" y2="20" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="60" y1="20" x2="60" y2="80" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="10" y1="60" x2="10" y2="80" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <line x1="0" y1="60" x2="30" y2="60" stroke="#00ff41" strokeWidth="0.8" suppressHydrationWarning />
              <circle cx="30" cy="20" r="2" fill="#00ff41" suppressHydrationWarning />
              <circle cx="50" cy="20" r="2" fill="#00ff41" suppressHydrationWarning />
              <circle cx="30" cy="50" r="2" fill="#00ff41" suppressHydrationWarning />
              <circle cx="60" cy="20" r="2" fill="#00ff41" suppressHydrationWarning />
              <circle cx="10" cy="60" r="2" fill="#00ff41" suppressHydrationWarning />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pid})`} suppressHydrationWarning />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,255,65,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,65,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />
  );
}

// ─── VIGNETTE ─────────────────────────────────────────────────────
export function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,10,18,0.7) 100%)',
      }}
      suppressHydrationWarning
    />
  );
}

// ─── FLOATING DATA PARTICLES (ambient) ────────────────────────────
export function DataParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      vy: -0.02 - Math.random() * 0.03,
      opacity: 0.1 + Math.random() * 0.2,
      char: Math.random() > 0.5 ? '1' : '0',
      size: 9 + Math.random() * 4,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.vy;
        if (p.y < -2) {
          p.y = 102;
          p.x = Math.random() * 100;
          p.char = Math.random() > 0.5 ? '1' : '0';
        }
        ctx.fillStyle = `rgba(0, 255, 65, ${p.opacity})`;
        ctx.font = `${p.size}px "JetBrains Mono", monospace`;
        ctx.fillText(p.char, (p.x / 100) * canvas.width, (p.y / 100) * canvas.height);
      });

      frame = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[2]" />;
}
