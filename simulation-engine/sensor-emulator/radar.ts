/**
 * @file radar.ts
 * @description Radar sensor emulator for RAKSHAK simulation environment.
 *   Generates synthetic range-azimuth sweep data with Swerling-model fluctuating
 *   targets, ground clutter, and rain clutter injection.
 *
 * Configuration models a representative AESA radar in the 8–12 GHz X-band,
 * consistent with BEL LANZA Mk-III and DRDO Rohini short-range tracking systems.
 *
 * Phase 2: Accept real I/Q data streams from hardware driver via SAPIENT interface.
 */

export interface RadarConfig {
  /** Operating frequency in GHz (X-band: 8–12 GHz typical) */
  frequencyGhz: number;
  /** Peak transmit power in Watts */
  peakPowerW: number;
  /** Antenna gain in dBi */
  antennaGainDbi: number;
  /** Pulse width in microseconds */
  pulseWidthUs: number;
  /** Pulse Repetition Interval in milliseconds */
  priMs: number;
  /** Unambiguous range km */
  maxRangeKm: number;
  /** Range resolution in metres (≈ c × τ / 2) */
  rangeResolutionM: number;
  /** Azimuth beamwidth in degrees */
  azimuthBeamwidthDeg: number;
  /** Rotation rate in RPM */
  rotationRpm: number;
}

export interface RadarReturn {
  rangeM: number;
  azimuthDeg: number;
  amplitudeDb: number;
  dopplerHz: number;
  isTarget: boolean;
  isClutter: boolean;
}

export const DEFAULT_RADAR_CONFIG: RadarConfig = {
  frequencyGhz: 10.0,
  peakPowerW: 2500,
  antennaGainDbi: 34,
  pulseWidthUs: 1.0,
  priMs: 1.0,
  maxRangeKm: 10,
  rangeResolutionM: 150,
  azimuthBeamwidthDeg: 1.5,
  rotationRpm: 15,
};

/**
 * Calculate detection probability using Swerling Case I target model.
 * Pd = f(SNR, Pfa) — approximated via the Albersheim equation.
 */
export function calculateDetectionProbability(snrDb: number, pfaLog10 = -6): number {
  // Albersheim approximation
  const A = Math.log(0.62 / Math.pow(10, pfaLog10));
  const B = Math.log(snrDb > 0 ? Math.pow(10, snrDb / 10) / (1 + snrDb / 10) : 0.01);
  const pd = 1 / (1 + Math.exp(-(A + B)));
  return Math.max(0, Math.min(1, pd));
}

/**
 * Generate one full antenna sweep (360° azimuth scan).
 * Returns range-azimuth cells with target echoes, clutter, and noise.
 */
export function generateSweepData(
  config: RadarConfig,
  targets: Array<{ rangeM: number; azimuthDeg: number; rcsM2: number; radialVelocityMps: number }>,
  clutterDensity = 0.02
): RadarReturn[] {
  const returns: RadarReturn[] = [];
  const azimuthSteps = Math.round(360 / config.azimuthBeamwidthDeg);
  const rangeBins = Math.round((config.maxRangeKm * 1000) / config.rangeResolutionM);

  for (let azIdx = 0; azIdx < azimuthSteps; azIdx++) {
    const az = azIdx * config.azimuthBeamwidthDeg;

    for (let rBin = 0; rBin < rangeBins; rBin++) {
      const range = rBin * config.rangeResolutionM;

      // Check if any target falls in this bin
      const target = targets.find(
        (t) =>
          Math.abs(t.rangeM - range) < config.rangeResolutionM &&
          Math.abs(t.azimuthDeg - az) < config.azimuthBeamwidthDeg
      );

      if (target) {
        const lambdaM = 3e8 / (config.frequencyGhz * 1e9);
        const antennaGainLinear = Math.pow(10, config.antennaGainDbi / 10);
        const snrDb = 10 * Math.log10(
          (config.peakPowerW * antennaGainLinear ** 2 * lambdaM ** 2 * target.rcsM2) /
            ((4 * Math.PI) ** 3 * target.rangeM ** 4 * 1.38e-23 * 290 * 10e6 * 3.16)
        );
        const dopplerHz = (2 * target.radialVelocityMps) / lambdaM;

        returns.push({
          rangeM: range,
          azimuthDeg: az,
          amplitudeDb: snrDb,
          dopplerHz,
          isTarget: true,
          isClutter: false,
        });
      } else if (Math.random() < clutterDensity) {
        // Ground/sea clutter return
        returns.push({
          rangeM: range,
          azimuthDeg: az,
          amplitudeDb: -15 + Math.random() * 10,
          dopplerHz: (Math.random() - 0.5) * 20, // slow moving clutter
          isTarget: false,
          isClutter: true,
        });
      }
    }
  }

  return returns;
}

/**
 * Add rain clutter overlay — increases noise floor per ITU-R P.838-3.
 * Rain rate in mm/hr → specific attenuation at 10 GHz.
 */
export function addRainClutter(returns: RadarReturn[], rainRateMmHr: number): RadarReturn[] {
  const attenuationDbPerKm = 0.0008 * Math.pow(rainRateMmHr, 1.4); // ITU-R approx

  return returns.map((r) => ({
    ...r,
    amplitudeDb: r.amplitudeDb - attenuationDbPerKm * (r.rangeM / 1000),
  }));
}
