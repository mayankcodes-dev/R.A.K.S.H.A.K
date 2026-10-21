'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TacticalBackground, Vignette } from '@/components/ui/VisualEffects';

interface PortalCard {
  role: 'TRAINEE' | 'INSTRUCTOR' | 'COMMANDER';
  path: string;
  label: string;
  sublabel: string;
  accent: string;
  icon: React.ReactNode;
}

const PORTALS: PortalCard[] = [
  {
    role: 'TRAINEE',
    path: '/trainee',
    label: 'Trainee',
    sublabel: 'OPERATOR PORTAL',
    accent: '#00ff41',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    role: 'INSTRUCTOR',
    path: '/instructor',
    label: 'Instructor',
    sublabel: 'TRAINING COMMAND',
    accent: '#3399ff',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    role: 'COMMANDER',
    path: '/commander',
    label: 'Commander',
    sublabel: 'UNIT ANALYTICS',
    accent: '#ff9900',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
];

export default function PortalPage() {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <TacticalBackground variant="hex" />
      <Vignette />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="text-center mb-16">
          <h1
            className="text-5xl md:text-7xl font-black tracking-wider mb-3"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              color: '#00ff41',
              textShadow: '0 0 40px rgba(0,255,65,0.45)',
            }}
          >
            R.A.K.S.H.A.K.
          </h1>
          <p
            className="text-[10px] tracking-[0.3em]"
            style={{ color: '#334455', fontFamily: '"JetBrains Mono", monospace' }}
          >
            SELECT PORTAL
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
          {PORTALS.map((portal) => {
            const isHovered = hovered === portal.role;
            return (
              <button
                key={portal.role}
                onClick={() => router.push(portal.path)}
                onMouseEnter={() => setHovered(portal.role)}
                onMouseLeave={() => setHovered(null)}
                className="text-left p-7 rounded-lg border transition-all duration-300 cursor-pointer"
                style={{
                  background: isHovered ? `rgba(${portal.accent === '#00ff41' ? '0,255,65' : portal.accent === '#3399ff' ? '51,153,255' : '255,153,0'},0.04)` : 'rgba(8,12,18,0.85)',
                  borderColor: isHovered ? portal.accent : 'rgba(255,255,255,0.06)',
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: isHovered ? `0 16px 48px ${portal.accent}14` : 'none',
                }}
              >
                {/* Icon */}
                <div
                  className="mb-6"
                  style={{ color: isHovered ? portal.accent : '#334455', transition: 'color 0.3s' }}
                >
                  {portal.icon}
                </div>

                {/* Labels */}
                <p
                  className="text-[9px] tracking-[0.35em] mb-1.5"
                  style={{ color: isHovered ? portal.accent : '#2a3a4a', fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {portal.sublabel}
                </p>
                <h2
                  className="text-xl font-bold"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    color: isHovered ? portal.accent : '#556677',
                  }}
                >
                  {portal.label}
                </h2>

                {/* Bottom accent line */}
                <div
                  className="h-px mt-6 transition-all duration-300"
                  style={{ background: isHovered ? `${portal.accent}35` : 'rgba(255,255,255,0.03)' }}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-14">
          <p
            className="text-[9px] tracking-[0.2em]"
            style={{ color: '#1a2233', fontFamily: '"JetBrains Mono", monospace' }}
          >
            PS 26247 · MINISTRY OF DEFENCE · DSSC WELLINGTON · SIH 2026
          </p>
        </div>
      </div>
    </div>
  );
}
