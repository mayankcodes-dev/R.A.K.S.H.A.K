import { create } from 'zustand';
import { SCENARIOS } from '@/data/scenarios/allScenarios';
import type { ScenarioId, Scenario } from '@/data/scenarios/allScenarios';

// Module-level timer reference — cleared on resetMission to prevent stale phase transitions
// when the user navigates away during the WRONG_ACTION 3-second recovery window (BUG-03)
let _wrongActionTimer: ReturnType<typeof setTimeout> | null = null;

export type GamePhase =
  | 'BRIEFING'
  | 'SCANNING'
  | 'DETECTED'
  | 'CLASSIFYING'
  | 'AWAITING_ACTION'
  | 'WRONG_ACTION'
  | 'CORRECT_ACTION'
  | 'ENGAGEMENT'
  | 'NEUTRALIZED'
  | 'AAR';

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
  showAAR: () => void;
  resetMission: () => void;
  tick: (deltaSeconds: number) => void;
  updateDronePosition: (pos: { x: number; y: number; z: number }) => void;
}

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
  droneDistance: 2000,
  radarSweepAngle: 0,
  threatConfidence: 0,

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
        description: 'Micro-Doppler signature detected',
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

    // Check if this action is correct
    const correctActions: string[] = 'correctActions' in scenario
      ? [...(scenario as any).correctActions]
      : [scenario.correctAction];

    const isCorrect = correctActions.includes(action);

    if (isCorrect) {
      const successMsg: Record<string, string> = {
        RF_JAM: 'ENGAGING — RF Jamming active, severing control link',
        GPS_SPOOF: 'ENGAGING — GPS spoof broadcast initiated',
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
          description: `${action} — correct countermeasure applied`,
        }],
      });
    } else {
      const errorMsg = (scenario.wrongResponses as Record<string, string>)?.[action]
        ?? 'INEFFECTIVE — wrong countermeasure!';
      const scorePenalty = 15;
      set({
        phase: 'WRONG_ACTION',
        score: Math.max(0, state.score - scorePenalty),
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
      // Clear any existing wrong-action recovery timer before starting a new one
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
    const scenario = state.getScenario();
    const successLabel = scenario.id === 'urban_ambush'
      ? 'TARGET NEUTRALIZED — ROE compliant. Sector clear.'
      : 'KILL CONFIRMED — Sector clear';
    set({
      phase: 'NEUTRALIZED',
      isTimerRunning: false,
      statusMessage: successLabel,
      threatConfidence: 0,
      droneDistance: 0,
      actionLog: [...state.actionLog, {
        time: state.missionTime,
        action: 'TARGET_NEUTRALIZED',
        result: 'success',
        description: 'Target neutralized. Mission complete.',
      }],
    });
  },

  showAAR: () => set({ phase: 'AAR' }),

  resetMission: () => {
    // Cancel any pending wrong-action recovery timer (BUG-03)
    if (_wrongActionTimer !== null) {
      clearTimeout(_wrongActionTimer);
      _wrongActionTimer = null;
    }
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
      droneDistance: 2000,
      radarSweepAngle: 0,
      threatConfidence: 0,
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
