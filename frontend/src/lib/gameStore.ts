import { create } from 'zustand';
import { SCENARIOS } from '@/data/scenarios/allScenarios';
import type { ScenarioId, Scenario } from '@/data/scenarios/allScenarios';

// Module-level timer reference — cleared on resetMission to prevent stale phase transitions
let _wrongActionTimer: ReturnType<typeof setTimeout> | null = null;
let _waveTimer: ReturnType<typeof setTimeout> | null = null;

export type GamePhase =
  | 'BRIEFING'
  | 'SCANNING'
  | 'DETECTED'
  | 'CLASSIFYING'
  | 'AWAITING_ACTION'
  | 'WRONG_ACTION'
  | 'CORRECT_ACTION'
  | 'ENGAGEMENT'
  | 'NEUTRALIZED'    // one wave done — brief pause before next
  | 'AAR';           // all 3 waves done

export type ActionType = 'RF_JAM' | 'GPS_SPOOF' | 'KINETIC_INTERCEPT';

interface ActionLog {
  time: number;
  action: string;
  result: 'success' | 'error' | 'neutral';
  description: string;
}

interface GameState {
  phase: GamePhase;
  missionTime: number;
  score: number;
  isTimerRunning: boolean;
  statusMessage: string;
  errorMessage: string | null;
  wrongAttempts: number;
  actionLog: ActionLog[];
  detectionTime: number | null;
  classificationTime: number | null;
  engagementTime: number | null;
  dronePosition: { x: number; y: number; z: number };
  droneDistance: number;
  radarSweepAngle: number;
  threatConfidence: number;

  // Multi-wave (3 drones per mission)
  droneWave: number;       // 1, 2, or 3
  totalWaves: number;      // always 3
  waveScores: number[];    // score per wave

  // Scenario
  selectedScenarioId: ScenarioId;
  setScenario: (id: ScenarioId) => void;
  getScenario: () => Scenario;

  // Actions
  startMission: () => void;
  advanceToScanning: () => void;
  detectTarget: () => void;
  classifyTarget: () => void;
  promptAction: () => void;
  executeAction: (action: ActionType) => void;
  completeEngagement: () => void;
  startNextWave: () => void;
  showAAR: () => void;
  resetMission: () => void;
  tick: (deltaSeconds: number) => void;
  updateDronePosition: (pos: { x: number; y: number; z: number }) => void;
}

const INITIAL_DRONE_DISTANCE = 2000;

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'BRIEFING',
  missionTime: 0,
  score: 100,
  isTimerRunning: false,
  statusMessage: 'AWAITING MISSION START',
  errorMessage: null,
  wrongAttempts: 0,
  actionLog: [],
  detectionTime: null,
  classificationTime: null,
  engagementTime: null,
  dronePosition: { x: 400, y: 50, z: 0 },
  droneDistance: INITIAL_DRONE_DISTANCE,
  radarSweepAngle: 0,
  threatConfidence: 0,

  droneWave: 1,
  totalWaves: 3,
  waveScores: [],

  // Scenario state
  selectedScenarioId: 'fiber_optic_fpv',
  setScenario: (id) => set({ selectedScenarioId: id }),
  getScenario: () => {
    const { selectedScenarioId } = get();
    return SCENARIOS.find((s) => s.id === selectedScenarioId) as Scenario ?? SCENARIOS[0] as Scenario;
  },

  startMission: () => {
    const scenario = get().getScenario();
    const firstEvent = scenario.events[0];
    set({
      phase: 'SCANNING',
      isTimerRunning: true,
      statusMessage: firstEvent?.statusUpdate ?? 'SCANNING — Searching for contacts...',
      actionLog: [{ time: 0, action: 'MISSION_START', result: 'neutral', description: 'Mission initiated' }],
      droneWave: 1,
      waveScores: [],
      score: 100,
      wrongAttempts: 0,
      missionTime: 0,
      droneDistance: INITIAL_DRONE_DISTANCE,
      threatConfidence: 0,
      errorMessage: null,
    });
  },

  advanceToScanning: () => set({ phase: 'SCANNING', statusMessage: 'SCANNING — Radar sweep active' }),

  detectTarget: () => {
    const state = get();
    const scenario = state.getScenario();
    const event = scenario.events.find((e) => e.type === 'RADAR_CONTACT');
    set({
      phase: 'DETECTED',
      detectionTime: state.missionTime,
      statusMessage: event?.statusUpdate ?? 'CONTACT — Track acquired',
      droneDistance: (event as any)?.distance ?? 1500,
      threatConfidence: 0.45,
      actionLog: [...state.actionLog, {
        time: state.missionTime,
        action: 'RADAR_CONTACT',
        result: 'neutral',
        description: `Wave ${state.droneWave} — Micro-Doppler signature detected`,
      }],
    });
  },

  classifyTarget: () => {
    const state = get();
    const scenario = state.getScenario();
    const event = scenario.events.find((e) => e.type === 'CLASSIFICATION');
    set({
      phase: 'CLASSIFYING',
      classificationTime: state.missionTime,
      statusMessage: event?.statusUpdate ?? 'CLASSIFYING — Analysis in progress',
      threatConfidence: (event as any)?.confidence ?? 0.72,
      droneDistance: (event as any)?.distance ?? 1200,
      actionLog: [...state.actionLog, {
        time: state.missionTime,
        action: 'CLASSIFICATION',
        result: 'neutral',
        description: 'RF Analysis complete. Threat classified.',
      }],
    });
  },

  promptAction: () => {
    const state = get();
    const scenario = state.getScenario();
    const event = scenario.events.find((e) => e.type === 'PROMPT_ACTION');
    set({
      phase: 'AWAITING_ACTION',
      statusMessage: event?.statusUpdate ?? 'WARNING — THREAT IDENTIFIED. Select countermeasure NOW',
      droneDistance: (event as any)?.distance ?? 800,
      threatConfidence: (event as any)?.confidence ?? 0.87,
      actionLog: [...state.actionLog, {
        time: state.missionTime,
        action: 'THREAT_ALERT',
        result: 'neutral',
        description: 'Threat closing. Engagement window open.',
      }],
    });
  },

  executeAction: (action: ActionType) => {
    const state = get();
    const scenario = state.getScenario();

    const correctActions: string[] = 'correctActions' in scenario
      ? [...(scenario as any).correctActions]
      : [scenario.correctAction];

    const isCorrect = correctActions.includes(action);

    if (isCorrect) {
      const successMsg: Record<string, string> = {
        RF_JAM: 'ENGAGING — RF Jamming active',
        GPS_SPOOF: 'ENGAGING — GPS spoof broadcast',
        KINETIC_INTERCEPT: 'ENGAGING — Interceptor launched',
      };
      set({
        phase: 'CORRECT_ACTION',
        engagementTime: state.missionTime,
        statusMessage: successMsg[action] ?? 'ENGAGING',
        errorMessage: null,
        actionLog: [...state.actionLog, {
          time: state.missionTime,
          action,
          result: 'success',
          description: `${action} — correct countermeasure`,
        }],
      });
    } else {
      const errorMsg = (scenario.wrongResponses as Record<string, string>)?.[action]
        ?? 'INEFFECTIVE — wrong countermeasure!';
      set({
        phase: 'WRONG_ACTION',
        score: Math.max(0, state.score - 15),
        errorMessage: errorMsg,
        wrongAttempts: state.wrongAttempts + 1,
        droneDistance: Math.max(200, state.droneDistance - 200),
        actionLog: [...state.actionLog, {
          time: state.missionTime,
          action,
          result: 'error',
          description: errorMsg,
        }],
      });
      if (_wrongActionTimer !== null) {
        clearTimeout(_wrongActionTimer);
        _wrongActionTimer = null;
      }
      _wrongActionTimer = setTimeout(() => {
        _wrongActionTimer = null;
        set({
          phase: 'AWAITING_ACTION',
          errorMessage: null,
          statusMessage: 'THREAT CLOSING — Select correct countermeasure!',
        });
      }, 3000);
    }
  },

  completeEngagement: () => {
    const state = get();
    // Record wave score
    const waveScore = Math.max(0, state.score - state.wrongAttempts * 10);
    const newWaveScores = [...state.waveScores, waveScore];

    set({
      phase: 'NEUTRALIZED',
      isTimerRunning: false,
      statusMessage: `WAVE ${state.droneWave} NEUTRALIZED`,
      threatConfidence: 0,
      droneDistance: 0,
      waveScores: newWaveScores,
      actionLog: [...state.actionLog, {
        time: state.missionTime,
        action: 'TARGET_NEUTRALIZED',
        result: 'success',
        description: `Wave ${state.droneWave} target neutralized.`,
      }],
    });

    // After 2.5s, either start next wave or go to AAR
    if (_waveTimer !== null) clearTimeout(_waveTimer);
    _waveTimer = setTimeout(() => {
      _waveTimer = null;
      const { droneWave, totalWaves } = get();
      if (droneWave < totalWaves) {
        get().startNextWave();
      } else {
        get().showAAR();
      }
    }, 2500);
  },

  startNextWave: () => {
    const state = get();
    const scenario = state.getScenario();
    const firstEvent = scenario.events[0];
    const nextWave = state.droneWave + 1;
    set({
      phase: 'SCANNING',
      isTimerRunning: true,
      droneWave: nextWave,
      missionTime: 0,           // reset per-wave timer
      droneDistance: INITIAL_DRONE_DISTANCE,
      threatConfidence: 0,
      errorMessage: null,
      wrongAttempts: 0,
      score: 100,
      detectionTime: null,
      classificationTime: null,
      engagementTime: null,
      statusMessage: firstEvent?.statusUpdate ?? `WAVE ${nextWave} — Scanning...`,
      actionLog: [...state.actionLog, {
        time: state.missionTime,
        action: 'WAVE_START',
        result: 'neutral',
        description: `Wave ${nextWave} of ${state.totalWaves} initiated`,
      }],
    });
  },

  showAAR: () => set({ phase: 'AAR', isTimerRunning: false }),

  resetMission: () => {
    if (_wrongActionTimer !== null) { clearTimeout(_wrongActionTimer); _wrongActionTimer = null; }
    if (_waveTimer !== null) { clearTimeout(_waveTimer); _waveTimer = null; }
    set({
      phase: 'BRIEFING',
      missionTime: 0,
      score: 100,
      isTimerRunning: false,
      statusMessage: 'AWAITING MISSION START',
      errorMessage: null,
      wrongAttempts: 0,
      actionLog: [],
      detectionTime: null,
      classificationTime: null,
      engagementTime: null,
      dronePosition: { x: 400, y: 50, z: 0 },
      droneDistance: INITIAL_DRONE_DISTANCE,
      radarSweepAngle: 0,
      threatConfidence: 0,
      droneWave: 1,
      waveScores: [],
    });
  },

  tick: (deltaSeconds: number) => {
    const state = get();
    if (!state.isTimerRunning) return;
    set({
      missionTime: state.missionTime + deltaSeconds,
      radarSweepAngle: (state.radarSweepAngle + deltaSeconds * 60) % 360,
    });
  },

  updateDronePosition: (pos) => set({ dronePosition: pos }),
}));

export type { ScenarioId, Scenario };
