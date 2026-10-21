/**
 * @file radar-equation.ts
 * @description Full radar equation physics implementation.
 *   Used by both the backend PhysicsService and the frontend simulation engine
 *   for consistent physics modelling across the full stack.
 *
 * Implemented formulas:
 *   1. Friis Free-Space Path Loss
 *   2. Radar Range Equation (monostatic)
 *   3. Two-way radar equation (SNR form)
 *   4. Maximum detection range (Rmax)
 *   5. Jammer burn-through range
 *   6. Noise figure & Minimum Detectable Signal (MDS)
 *
 * References:
 *   • Skolnik, M.I. (2001). Introduction to Radar Systems, 3rd ed.
 *   • Barton, D.K. (2004). Radar System Analysis and Modelling.
 *   • Levanon, N. & Mozeson, E. (2004). Radar Signals.
 */

export const PHYSICAL_CONSTANTS = {
  SPEED_OF_LIGHT_MPS: 2.998e8,
  BOLTZMANN_JK: 1.38e-23,
  STANDARD_TEMP_K: 290,
} as const;

// ── Friis Free-Space Path Loss ───────────────────────────────────────────────

/**
 * Friis free-space path loss in dB.
 * FSPL = 20·log₁₀(4πRf/c)
 */
export function friisFreeSpaceLossDb(rangeM: number, frequencyHz: number): number {
  const { SPEED_OF_LIGHT_MPS } = PHYSICAL_CONSTANTS;
  return 20 * Math.log10((4 * Math.PI * rangeM * frequencyHz) / SPEED_OF_LIGHT_MPS);
}

// ── Radar Range Equation ─────────────────────────────────────────────────────

export interface RadarEquationParams {
  transmitPowerW: number;
  antennaGainTxLinear: number;
  antennaGainRxLinear: number;
  wavelengthM: number;
  rcsM2: number;
  rangeM: number;
  systemNoiseW: number;
}

/**
 * Monostatic radar range equation — SNR at receiver.
 *
 * SNR = (Pt · Gt · Gr · λ² · σ) / ((4π)³ · R⁴ · Pn)
 *
 * Returns SNR in linear (not dB).
 */
export function radarRangeEquationLinear(p: RadarEquationParams): number {
  const numerator =
    p.transmitPowerW * p.antennaGainTxLinear * p.antennaGainRxLinear *
    p.wavelengthM ** 2 * p.rcsM2;

  const denominator =
    (4 * Math.PI) ** 3 * p.rangeM ** 4 * p.systemNoiseW;

  return numerator / denominator;
}

/** Same as above, returns dB */
export function radarRangeEquationDb(p: RadarEquationParams): number {
  return 10 * Math.log10(radarRangeEquationLinear(p));
}

// ── Maximum Detection Range ──────────────────────────────────────────────────

export interface RmaxParams {
  transmitPowerW: number;
  antennaGainTxLinear: number;
  antennaGainRxLinear: number;
  wavelengthM: number;
  rcsM2: number;
  noisePowerW: number;
  /** Required SNR at Pd=0.9, Pfa=1e-6 — typically 13.2 dB */
  snrRequiredDb: number;
}

/**
 * Maximum unambiguous detection range.
 *
 * Rmax = ⁴√( (Pt · Gt · Gr · λ² · σ) / ((4π)³ · Pn · SNR_req) )
 */
export function calculateRmax(p: RmaxParams): number {
  const snrRequired = Math.pow(10, p.snrRequiredDb / 10);
  return Math.pow(
    (p.transmitPowerW * p.antennaGainTxLinear * p.antennaGainRxLinear *
      p.wavelengthM ** 2 * p.rcsM2) /
      ((4 * Math.PI) ** 3 * p.noisePowerW * snrRequired),
    0.25
  );
}

// ── Noise Figure & MDS ───────────────────────────────────────────────────────

/**
 * System noise power in Watts.
 * Pn = k · T₀ · B · F
 */
export function noisePowerW(
  bandwidthHz: number,
  noiseFigureDb: number,
  tempK = PHYSICAL_CONSTANTS.STANDARD_TEMP_K
): number {
  const { BOLTZMANN_JK } = PHYSICAL_CONSTANTS;
  const noiseFigureLinear = Math.pow(10, noiseFigureDb / 10);
  return BOLTZMANN_JK * tempK * bandwidthHz * noiseFigureLinear;
}

/**
 * Minimum Detectable Signal in dBm.
 * MDS = k · T₀ · B · F · SNR_min
 */
export function minimumDetectableSignalDbm(
  bandwidthHz: number,
  noiseFigureDb: number,
  snrMinDb: number
): number {
  const pnW = noisePowerW(bandwidthHz, noiseFigureDb);
  const snrMin = Math.pow(10, snrMinDb / 10);
  const mdsW = pnW * snrMin;
  return 10 * Math.log10(mdsW * 1000); // W → dBm
}

// ── Jammer Burn-Through Range ────────────────────────────────────────────────

export interface JammerParams {
  jammerPowerW: number;
  jammerGainLinear: number;
  /** Jammer-to-radar distance in metres (standoff distance) */
  standoffRangeM: number;
  radarParams: RmaxParams;
}

/**
 * Jammer burn-through range — range within which radar can detect target
 * despite active jamming.
 *
 * R_BT = R_max · √( (Pt · Gt · σ) / (4π · Pj · Gj · R_J²) )
 *
 * Note: Fiber-optic FPV drones have NO control link — RF jamming is ineffective.
 */
export function jammerBurnThroughRange(p: JammerParams): number {
  const rmax = calculateRmax(p.radarParams);
  const { radarParams, jammerPowerW, jammerGainLinear, standoffRangeM } = p;

  const jsr =
    (jammerPowerW * jammerGainLinear * (4 * Math.PI) * standoffRangeM ** 2) /
    (radarParams.transmitPowerW * radarParams.antennaGainTxLinear * radarParams.rcsM2);

  return rmax / Math.sqrt(jsr);
}

// ── Radar Cross Section (Approximate) ───────────────────────────────────────

export type DroneCategory = 'MULTI_ROTOR' | 'FPV_FIBER_OPTIC' | 'FIXED_WING' | 'SWARM_ELEMENT' | 'BIRD';

/**
 * Approximate RCS values for small UAS targets.
 * Data from DRDO ADE measurements and published IEEE literature (2023–2024).
 */
export function approximateRCS(category: DroneCategory, aspectAngleDeg = 0): number {
  const baseRcs: Record<DroneCategory, number> = {
    MULTI_ROTOR:    0.010,
    FPV_FIBER_OPTIC: 0.003,
    FIXED_WING:     0.025,
    SWARM_ELEMENT:  0.005,
    BIRD:           0.001,
  };

  // Simple aspect angle variation — head-on is ~30% lower than broadside
  const aspectFactor = 1 - 0.3 * Math.abs(Math.cos((aspectAngleDeg * Math.PI) / 180));
  return baseRcs[category] * aspectFactor;
}
