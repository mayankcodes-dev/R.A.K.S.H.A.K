'use client';

/**
 * Custom Animated SVG Favicon — Rotating radar sweep
 * Injects a data-URI SVG favicon that animates in the browser tab
 */
import { useEffect } from 'react';

export function AnimatedFavicon() {
  useEffect(() => {
    // SVG favicon with CSS animation
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <style>
        @keyframes sweep {
          from { transform: rotate(0deg); transform-origin: 16px 16px; }
          to   { transform: rotate(360deg); transform-origin: 16px 16px; }
        }
        .sweep { animation: sweep 2s linear infinite; transform-origin: 16px 16px; }
      </style>
      <rect width="32" height="32" fill="#0a0e14" rx="4"/>
      <circle cx="16" cy="16" r="14" fill="none" stroke="#00ff41" stroke-width="0.5" opacity="0.3"/>
      <circle cx="16" cy="16" r="9" fill="none" stroke="#00ff41" stroke-width="0.4" opacity="0.25"/>
      <circle cx="16" cy="16" r="4.5" fill="none" stroke="#00ff41" stroke-width="0.4" opacity="0.2"/>
      <line x1="16" y1="2" x2="16" y2="30" stroke="#00ff41" stroke-width="0.3" opacity="0.15"/>
      <line x1="2" y1="16" x2="30" y2="16" stroke="#00ff41" stroke-width="0.3" opacity="0.15"/>
      <g class="sweep">
        <line x1="16" y1="16" x2="16" y2="3" stroke="#00ff41" stroke-width="1.5" opacity="0.9"/>
        <polygon points="16,16 14,3 18,3" fill="#00ff41" opacity="0.3"/>
      </g>
      <circle cx="16" cy="16" r="1.5" fill="#00ff41"/>
      <circle cx="22" cy="8" r="1.5" fill="#ff0033" opacity="0.9"/>
    </svg>`;

    const encoded = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = encoded;
  }, []);

  return null;
}

/**
 * Full-screen custom loader with animated radar + boot text
 */
interface LoaderProps {
  progress?: number; // 0-100
  message?: string;
}

export function RakshakLoader({ progress = 0, message = 'INITIALIZING...' }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#050a12] flex items-center justify-center flex-col gap-8">
      {/* Animated Radar */}
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          {/* Range rings */}
          {[60, 45, 30, 15].map((r, i) => (
            <circle
              key={r}
              cx="80" cy="80" r={r}
              fill="none"
              stroke="#00ff41"
              strokeWidth="0.5"
              opacity={0.1 + i * 0.05}
            />
          ))}
          {/* Crosshairs */}
          <line x1="80" y1="20" x2="80" y2="140" stroke="#00ff41" strokeWidth="0.4" opacity="0.1" />
          <line x1="20" y1="80" x2="140" y2="80" stroke="#00ff41" strokeWidth="0.4" opacity="0.1" />

          {/* Sweep — CSS animated */}
          <g style={{ transformOrigin: '80px 80px', animation: 'radarSweep 2s linear infinite' }}>
            <line x1="80" y1="80" x2="80" y2="22" stroke="#00ff41" strokeWidth="2" opacity="0.9"
              style={{ filter: 'drop-shadow(0 0 4px #00ff41)' }} />
            {/* Sweep trail gradient sectors */}
            <path
              d="M80,80 L80,22 A58,58 0 0,1 138,80 Z"
              fill="url(#sweepGrad)"
              opacity="0.15"
            />
          </g>

          {/* Blip */}
          <circle cx="100" cy="55" r="3" fill="#ff0033"
            style={{ filter: 'drop-shadow(0 0 6px #ff0033)', animation: 'blink 1s ease-in-out infinite' }} />

          {/* Center dot */}
          <circle cx="80" cy="80" r="3" fill="#00ff41"
            style={{ filter: 'drop-shadow(0 0 8px #00ff41)' }} />

          <defs>
            <radialGradient id="sweepGrad" cx="80" cy="80" r="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00ff41" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Progress ring */}
        <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="80" cy="80" r="74"
            fill="none"
            stroke="#00ff41"
            strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 74}`}
            strokeDashoffset={`${2 * Math.PI * 74 * (1 - progress / 100)}`}
            opacity="0.6"
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
          />
        </svg>
      </div>

      {/* Title */}
      <div className="text-center">
        <p className="text-2xl font-bold tracking-[0.3em] text-[#00ff41]"
          style={{ fontFamily: '"Orbitron", sans-serif', textShadow: '0 0 20px rgba(0,255,65,0.5)' }}>
          R.A.K.S.H.A.K.
        </p>
        <p className="text-xs mt-1 tracking-[0.2em] text-[#556677]"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          COUNTER-UAS TRAINING SIMULATOR
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 space-y-2">
        <div className="h-1 bg-[#111927] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00ff41] rounded-full"
            style={{
              width: `${progress}%`,
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 8px rgba(0,255,65,0.6)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#556677]"
          style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          <span className="animate-pulse">{message}</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
