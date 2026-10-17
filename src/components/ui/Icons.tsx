'use client';

// ──────────────────────────────────────────────────────────────────
// Custom military tactical SVG icons — pixel-perfect, no emoji
// ──────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const def = { size: 24, color: 'currentColor' };

// Radar dish / signal transmitter
export function IconRadar({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="2" fill={color} />
      <path d="M12 12 L5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
      <path d="M12 3 L12 1M21 12 L23 12M3 12 L1 12M12 21 L12 23" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// RF Jam / electromagnetic wave
export function IconRFJam({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M1 12 C3 8, 5 8, 7 12 C9 16, 11 16, 13 12 C15 8, 17 8, 19 12 C21 16, 23 16, 23 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M1 12 C3 8, 5 8, 7 12 C9 16, 11 16, 13 12" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="18" y1="4" x2="22" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="4" x2="18" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// GPS satellite / spoofing
export function IconGPSSpoof({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Satellite body */}
      <rect x="9" y="9" width="6" height="6" rx="1" stroke={color} strokeWidth="1.5" />
      {/* Solar panels */}
      <rect x="2" y="10" width="5" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
      <rect x="17" y="10" width="5" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
      <line x1="7" y1="12" x2="9" y2="12" stroke={color} strokeWidth="1.5" />
      <line x1="15" y1="12" x2="17" y2="12" stroke={color} strokeWidth="1.5" />
      {/* Signal down */}
      <path d="M12 15 L12 20M10 18 L12 20 L14 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Spoof X */}
      <circle cx="19" cy="5" r="3" stroke={color} strokeWidth="1.5" />
      <line x1="17.5" y1="3.5" x2="20.5" y2="6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20.5" y1="3.5" x2="17.5" y2="6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Kinetic interceptor — missile / projectile
export function IconKineticIntercept({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Missile body */}
      <path d="M5 19 L15 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Nose cone */}
      <path d="M15 9 L18 4 L20 6 L15 9Z" fill={color} />
      {/* Fins */}
      <path d="M5 19 L2 22 L4 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19 L3 21 L7 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Exhaust trail */}
      <path d="M4 20 C2 22, 1 21, 3 19" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      {/* Target crosshair */}
      <circle cx="20" cy="7" r="0" />
      <circle cx="21" cy="3" r="2.5" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="21" y1="1" x2="21" y2="2" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="21" y1="4" x2="21" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="19" y1="3" x2="18.5" y2="3" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <line x1="23" y1="3" x2="23.5" y2="3" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Drone / UAV silhouette
export function IconDrone({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Body */}
      <rect x="9" y="10" width="6" height="4" rx="1" stroke={color} strokeWidth="1.5" />
      {/* Arms */}
      <line x1="9" y1="11" x2="5" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="11" x2="19" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="5" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="13" x2="19" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Rotors */}
      <ellipse cx="5" cy="7" rx="3" ry="1" stroke={color} strokeWidth="1" />
      <ellipse cx="19" cy="7" rx="3" ry="1" stroke={color} strokeWidth="1" />
      <ellipse cx="5" cy="17" rx="3" ry="1" stroke={color} strokeWidth="1" />
      <ellipse cx="19" cy="17" rx="3" ry="1" stroke={color} strokeWidth="1" />
      {/* Camera */}
      <circle cx="12" cy="14.5" r="1" fill={color} />
    </svg>
  );
}

// Swarm — multiple drones
export function IconSwarm({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Lead drone */}
      <rect x="10" y="10" width="4" height="3" rx="0.5" stroke={color} strokeWidth="1.5" />
      <line x1="10" y1="10.5" x2="8" y2="9" stroke={color} strokeWidth="1" />
      <line x1="14" y1="10.5" x2="16" y2="9" stroke={color} strokeWidth="1" />
      <line x1="10" y1="12.5" x2="8" y2="14" stroke={color} strokeWidth="1" />
      <line x1="14" y1="12.5" x2="16" y2="14" stroke={color} strokeWidth="1" />
      {/* Small drones in formation */}
      <rect x="3" y="5" width="2.5" height="2" rx="0.3" stroke={color} strokeWidth="1" opacity="0.7" />
      <rect x="18.5" y="5" width="2.5" height="2" rx="0.3" stroke={color} strokeWidth="1" opacity="0.7" />
      <rect x="3" y="17" width="2.5" height="2" rx="0.3" stroke={color} strokeWidth="1" opacity="0.7" />
      <rect x="18.5" y="17" width="2.5" height="2" rx="0.3" stroke={color} strokeWidth="1" opacity="0.7" />
      {/* Mesh lines */}
      <line x1="5.5" y1="6" x2="10" y2="11" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1="18.5" y1="6" x2="14" y2="11" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1="5.5" y1="18" x2="10" y2="12" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      <line x1="18.5" y1="18" x2="14" y2="12" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}

// Building / civilian infrastructure
export function IconCivilian({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Hospital building */}
      <rect x="4" y="8" width="16" height="14" rx="1" stroke={color} strokeWidth="1.5" />
      <path d="M4 8 L12 3 L20 8" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Cross */}
      <line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="14" x2="15" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Warning circle */}
      <circle cx="19" cy="5" r="3" stroke="#ff6600" strokeWidth="1.5" />
      <line x1="19" y1="3.5" x2="19" y2="5.5" stroke="#ff6600" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="19" cy="6.5" r="0.5" fill="#ff6600" />
    </svg>
  );
}

// Shield / protection
export function IconShield({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2 L20 5 L20 12 C20 17 16 21 12 22 C8 21 4 17 4 12 L4 5 Z" stroke={color} strokeWidth="1.5" />
      <path d="M9 12 L11 14 L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Warning triangle
export function IconWarning({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3 L21 20 L3 20 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="12" y1="10" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="1" fill={color} />
    </svg>
  );
}

// Target crosshair
export function IconTarget({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="4" x2="12" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="22" x2="12" y2="20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="2" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Mission timer / clock
export function IconTimer({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="13" r="8" stroke={color} strokeWidth="1.5" />
      <line x1="12" y1="13" x2="12" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="2" x2="14" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Score / star medal
export function IconScore({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 16.5 L5.5 21 L8 13.5 L2 9 L9.5 9 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// Sensor / detection
export function IconSensor({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12 C5 8.13 8.13 5 12 5 C15.87 5 19 8.13 19 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 12 C8 9.79 9.79 8 12 8 C14.21 8 16 9.79 16 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="14" x2="12" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Explosion / neutralized
export function IconExplosion({ size = def.size, color = def.color, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" fill={color} opacity="0.8" />
      <path d="M12 8 L13 4 L11 7 L14 2 L11 6 L12 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 12 L20 11 L17 13 L22 12 L18 12 L21 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 16 L11 20 L13 17 L10 22 L13 18 L12 21" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 12 L4 13 L7 11 L2 12 L6 12 L3 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 9 L18 6 L15 8 L19 4 L16 7 L18 5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M9 15 L6 18 L9 16 L5 20 L8 17 L6 19" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
