/**
 * @file weather.ts
 * @description Weather state engine for the RAKSHAK simulation environment.
 *   Models real-time weather degradation of sensor performance and
 *   advances weather state over simulation time steps.
 *
 * Sensor degradation references:
 *   • Rain: ITU-R P.838-3 (radar attenuation), SPIE Proc. 11543 (EO/IR)
 *   • Fog:  FM 34-81-1 Battlefield Weather Effects on Target Acquisition
 *
 * Phase 2: Integrate real-time MET data from IMD API for scenario pre-briefing.
 */

export type PrecipitationType = 'NONE' | 'DRIZZLE' | 'RAIN' | 'HEAVY_RAIN' | 'FOG' | 'SANDSTORM';
export type VisibilityCategory = 'CLEAR' | 'HAZE' | 'RAIN' | 'FOG';

export interface WeatherState {
  visibilityKm: number;
  windSpeedKts: number;
  windDirectionDeg: number;
  precipitationType: PrecipitationType;
  cloudCoverPercent: number;
  temperatureCelsius: number;
  humidityPercent: number;
  /** Derived attenuation per sensor type */
  sensorAttenuation: {
    radarRangeDegradationFactor: number;  // 1.0 = no degradation
    eoIrEffectivenessFactor: number;
    rfSpectrumNoiseDeltaDb: number;
  };
}

/**
 * Apply weather degradation to sensor performance envelopes.
 * Returns an attenuation factor per sensor (1.0 = nominal, 0.0 = blind).
 */
export function applyWeatherToSensors(weather: WeatherState): WeatherState['sensorAttenuation'] {
  const { precipitationType, visibilityKm, humidityPercent } = weather;

  // Radar: rain attenuation per ITU-R P.838-3 at 10 GHz
  const rainAttenuationDb = precipitationType === 'HEAVY_RAIN' ? 4.5 :
                            precipitationType === 'RAIN'       ? 1.8 :
                            precipitationType === 'DRIZZLE'    ? 0.4 : 0;
  const radarDegradation = Math.pow(10, -rainAttenuationDb / 20);

  // EO/IR: fog and rain scatter visible and IR wavelengths
  const eoIrFactor = precipitationType === 'FOG'        ? 0.15 :
                     precipitationType === 'HEAVY_RAIN'  ? 0.35 :
                     precipitationType === 'RAIN'        ? 0.60 :
                     visibilityKm < 2                    ? 0.50 : 1.0;

  // RF spectrum: humidity raises noise floor
  const rfNoiseDelta = humidityPercent > 80 ? 2.5 : humidityPercent > 60 ? 1.0 : 0;

  return {
    radarRangeDegradationFactor: Math.max(0.1, radarDegradation),
    eoIrEffectivenessFactor: eoIrFactor,
    rfSpectrumNoiseDeltaDb: rfNoiseDelta,
  };
}

/**
 * Advance weather state by one simulation time step (default: 30 seconds).
 * Models slow Markov-chain transitions between weather states.
 */
export function advanceWeather(current: WeatherState, deltaSeconds = 30): WeatherState {
  const perturbWind = (v: number, delta: number) =>
    Math.max(0, Math.min(50, v + (Math.random() - 0.5) * delta));

  const newWindSpeed = perturbWind(current.windSpeedKts, 2);
  const newCloudCover = Math.max(0, Math.min(100, current.cloudCoverPercent + (Math.random() - 0.5) * 5));

  // Visibility slowly drifts
  const newVisibility = Math.max(0.5, Math.min(15, current.visibilityKm + (Math.random() - 0.5) * 0.3));

  const next: WeatherState = {
    ...current,
    windSpeedKts: newWindSpeed,
    cloudCoverPercent: newCloudCover,
    visibilityKm: newVisibility,
    windDirectionDeg: (current.windDirectionDeg + (Math.random() - 0.5) * 10 + 360) % 360,
    sensorAttenuation: applyWeatherToSensors({ ...current, visibilityKm: newVisibility }),
  };

  return next;
}

/**
 * Create a default clear-weather state for scenario initialisation.
 */
export function createDefaultWeather(): WeatherState {
  const state: WeatherState = {
    visibilityKm: 12,
    windSpeedKts: 8,
    windDirectionDeg: 270,
    precipitationType: 'NONE',
    cloudCoverPercent: 25,
    temperatureCelsius: 28,
    humidityPercent: 45,
    sensorAttenuation: {
      radarRangeDegradationFactor: 1.0,
      eoIrEffectivenessFactor: 1.0,
      rfSpectrumNoiseDeltaDb: 0,
    },
  };
  state.sensorAttenuation = applyWeatherToSensors(state);
  return state;
}

/**
 * Human-readable weather summary for scenario briefing.
 */
export function describeWeather(w: WeatherState): string {
  return (
    `Visibility ${w.visibilityKm.toFixed(1)} km · ` +
    `Wind ${w.windSpeedKts} kts @ ${w.windDirectionDeg}° · ` +
    `Precip: ${w.precipitationType} · ` +
    `Temp ${w.temperatureCelsius}°C`
  );
}
