'use client';

/**
 * RAKSHAK Sound Engine — Web Audio API synthesizer.
 * No external files needed. All sounds generated procedurally.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function masterGain(ctx: AudioContext, vol = 0.4): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.connect(ctx.destination);
  return g;
}

// ─── RADAR PING ───────────────────────────────────────────────────
export function playRadarPing() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
}

// ─── RADAR CONTACT ALERT ──────────────────────────────────────────
export function playContactAlert() {
  try {
    const ctx = getCtx();
    const times = [0, 0.15, 0.3];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.12);
    });
  } catch (_) {}
}

// ─── THREAT WARNING ───────────────────────────────────────────────
export function playThreatWarning() {
  try {
    const ctx = getCtx();
    // Urgent two-tone alarm
    [0, 0.2, 0.4, 0.6].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(i % 2 === 0 ? 660 : 880, ctx.currentTime + t);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.18);
    });
  } catch (_) {}
}

// ─── WRONG ACTION (FAILURE BUZZ) ─────────────────────────────────
export function playWrongAction() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();

    // Simple distortion curve
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) {}
}

// ─── CORRECT ACTION (SUCCESS CHORD) ──────────────────────────────
export function playCorrectAction() {
  try {
    const ctx = getCtx();
    // Major chord arpeggio: C E G C
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.5);
    });
  } catch (_) {}
}

// ─── EXPLOSION (NEUTRALIZED) ──────────────────────────────────────
export function playExplosion() {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 1.5);

    // Sub boom
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
    subGain.gain.setValueAtTime(0.6, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    sub.start(ctx.currentTime);
    sub.stop(ctx.currentTime + 0.8);
  } catch (_) {}
}

// ─── BUTTON CLICK ─────────────────────────────────────────────────
export function playButtonClick() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (_) {}
}

// ─── BOOT BEEP ────────────────────────────────────────────────────
export function playBootBeep(index: number) {
  try {
    const ctx = getCtx();
    const freq = 400 + index * 80;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch (_) {}
}

// ─── AMBIENT RADIO STATIC (looping) ──────────────────────────────
let staticSource: AudioBufferSourceNode | null = null;
let staticGain: GainNode | null = null;

export function startAmbientStatic(vol = 0.03) {
  try {
    const ctx = getCtx();
    stopAmbientStatic();

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;

    staticGain = ctx.createGain();
    staticGain.gain.setValueAtTime(vol, ctx.currentTime);

    staticSource = ctx.createBufferSource();
    staticSource.buffer = buffer;
    staticSource.loop = true;
    staticSource.connect(filter);
    filter.connect(staticGain);
    staticGain.connect(ctx.destination);
    staticSource.start();
  } catch (_) {}
}

export function stopAmbientStatic() {
  try {
    staticSource?.stop();
    staticSource = null;
    staticGain = null;
  } catch (_) {}
}

// ─── MISSION START COUNTDOWN ──────────────────────────────────────
export function playMissionStart() {
  try {
    const ctx = getCtx();
    // 3-2-1-GO beeps
    [0, 0.5, 1.0].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
    // GO! — higher pitch
    const go = ctx.createOscillator();
    const goGain = ctx.createGain();
    go.connect(goGain);
    goGain.connect(ctx.destination);
    go.type = 'sine';
    go.frequency.setValueAtTime(880, ctx.currentTime + 1.5);
    goGain.gain.setValueAtTime(0.35, ctx.currentTime + 1.5);
    goGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5 + 0.4);
    go.start(ctx.currentTime + 1.5);
    go.stop(ctx.currentTime + 1.5 + 0.4);
  } catch (_) {}
}
