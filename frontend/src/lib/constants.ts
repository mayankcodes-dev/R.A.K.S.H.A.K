export const COLORS = {
  primary: '#00ff41',
  primaryDim: 'rgba(0, 255, 65, 0.3)',
  primaryGlow: 'rgba(0, 255, 65, 0.15)',
  accent: '#ff6600',
  accentDim: 'rgba(255, 102, 0, 0.3)',
  danger: '#ff0033',
  dangerDim: 'rgba(255, 0, 51, 0.3)',
  surface: '#0a0e14',
  surfaceAlt: '#111927',
  surfaceLight: '#1a2332',
  border: 'rgba(0, 255, 65, 0.15)',
  borderAccent: 'rgba(255, 102, 0, 0.25)',
  textPrimary: '#e0e6ed',
  textSecondary: '#8899aa',
  textMuted: '#556677',
  success: '#00ff41',
  warning: '#ff6600',
  error: '#ff0033',
  info: '#00aaff',
} as const;

export const FONTS = {
  display: '"Orbitron", sans-serif',
  mono: '"JetBrains Mono", monospace',
  ui: '"Inter", system-ui, sans-serif',
} as const;

export const RADAR = {
  size: 220,
  sweepSpeed: 0.03,
  rings: [30, 60, 90],
  gridLines: 4,
} as const;

export const SCORING = {
  maxScore: 100,
  wrongActionPenalty: 15,
  slowDetectionPenalty: 10,
  optimalDetectionTime: 10,
  maxDetectionTime: 30,
} as const;
