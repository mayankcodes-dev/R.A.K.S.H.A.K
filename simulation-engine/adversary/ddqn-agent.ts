/**
 * @file ddqn-agent.ts
 * @description Double Deep Q-Network (DDQN) adversary AI agent for RAKSHAK.
 *   Controls hostile drone flight path, evasion manoeuvres, and swarm coordination
 *   in response to operator countermeasures.
 *
 * Architecture:
 *   • Online network Q(s,a;θ) — action selection
 *   • Target network Q(s,a;θ⁻) — stable TD-target generation (synced every 500 steps)
 *   • Replay buffer — experience replay (capacity 50,000 transitions)
 *   • ε-greedy exploration with linear decay
 *
 * References:
 *   • Van Hasselt et al. (2016). Deep Reinforcement Learning with Double Q-learning. AAAI.
 *   • Mnih et al. (2015). Human-level control through deep reinforcement learning. Nature.
 *
 * Phase 2: Load pre-trained ONNX model weights via ONNX Runtime Node.js binding.
 *          Training pipeline runs on DGX A100 cluster (simulation-engine/training/).
 * Phase 3: Federated multi-agent swarm coordination via peer-to-peer message passing.
 */

export interface DDQNConfig {
  stateDim: number;           // Input observation vector size
  actionDim: number;          // Number of discrete evasion actions
  gamma: number;              // Discount factor (default: 0.99)
  learningRate: number;       // Adam optimizer LR (default: 1e-4)
  epsilonStart: number;       // Initial exploration rate (default: 1.0)
  epsilonEnd: number;         // Final exploration rate (default: 0.05)
  epsilonDecaySteps: number;  // Steps to decay epsilon (default: 10000)
  batchSize: number;          // Training batch size (default: 64)
  targetSyncSteps: number;    // Steps between target network sync (default: 500)
  replayCapacity: number;     // Experience replay buffer size (default: 50000)
}

export const DEFAULT_DDQN_CONFIG: DDQNConfig = {
  stateDim: 24,
  actionDim: 8,
  gamma: 0.99,
  learningRate: 1e-4,
  epsilonStart: 1.0,
  epsilonEnd: 0.05,
  epsilonDecaySteps: 10_000,
  batchSize: 64,
  targetSyncSteps: 500,
  replayCapacity: 50_000,
};

export interface DDQNState {
  position: [number, number, number]; // [lat_offset, lon_offset, alt_m]
  velocity: [number, number, number]; // [vx, vy, vz] m/s
  radarDetected: boolean;
  rfJamming: boolean;
  nearbyAllies: number;               // Swarm neighbours within 200m
  distanceToTargetM: number;
  altitudeSafetyMarginM: number;
  timeElapsedS: number;
}

/** Discrete evasion action space */
export enum EvasionAction {
  MAINTAIN_COURSE     = 0,
  ALTITUDE_DROP       = 1,
  ALTITUDE_CLIMB      = 2,
  BEARING_CHANGE_45   = 3,
  BEARING_CHANGE_NEG45= 4,
  SPEED_BURST         = 5,
  TERRAIN_MASK        = 6,
  SWARM_SPLIT         = 7,
}

export interface Transition {
  state: number[];
  action: EvasionAction;
  reward: number;
  nextState: number[];
  done: boolean;
}

/** Simple replay buffer using circular array */
export class ReplayBuffer {
  private buffer: Transition[] = [];
  private ptr = 0;

  constructor(private capacity: number) {}

  push(t: Transition): void {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(t);
    } else {
      this.buffer[this.ptr] = t;
    }
    this.ptr = (this.ptr + 1) % this.capacity;
  }

  sample(n: number): Transition[] {
    const out: Transition[] = [];
    for (let i = 0; i < n; i++) {
      out.push(this.buffer[Math.floor(Math.random() * this.buffer.length)]);
    }
    return out;
  }

  get size(): number { return this.buffer.length; }
}

/**
 * DDQN adversary agent.
 *
 * In Phase 0 (prototype), selectAction uses a rule-based evasion policy
 * that approximates trained behaviour without neural network inference.
 */
export class DDQNAgent {
  private config: DDQNConfig;
  private replayBuffer: ReplayBuffer;
  private step = 0;
  private epsilon: number;

  constructor(config: Partial<DDQNConfig> = {}) {
    this.config = { ...DEFAULT_DDQN_CONFIG, ...config };
    this.replayBuffer = new ReplayBuffer(this.config.replayCapacity);
    this.epsilon = this.config.epsilonStart;
  }

  /**
   * Select an evasion action given the current state.
   *
   * Phase 2: Replace with ONNX model forward pass:
   *   const output = await session.run({ input: new Tensor('float32', stateVec, [1, stateDim]) });
   *   return argmax(output.values.data as Float32Array);
   */
  selectAction(state: DDQNState): EvasionAction {
    this.step++;
    this._decayEpsilon();

    // ε-greedy exploration
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.config.actionDim) as EvasionAction;
    }

    // Rule-based policy (approximates trained behaviour)
    return this.evasionPolicy(state);
  }

  /**
   * Store a transition in the replay buffer.
   * Phase 2: call trainStep() every 4 steps after buffer warms up.
   */
  storeTransition(t: Transition): void {
    this.replayBuffer.push(t);
  }

  /**
   * One TD-learning update step using a sampled mini-batch.
   * Phase 2: Full DDQN gradient update — currently stubbed.
   */
  trainStep(): void {
    if (this.replayBuffer.size < this.config.batchSize) return;

    // Phase 2:
    // const batch = this.replayBuffer.sample(this.config.batchSize);
    // const targets = batch.map(t => this._computeTarget(t));
    // this.onlineNetwork.update(batch, targets);
    // if (this.step % this.config.targetSyncSteps === 0) this._syncTargetNetwork();
  }

  /**
   * Rule-based evasion policy — deterministic fallback for prototype.
   * Approximates trained agent behaviour based on threat detection signals.
   */
  evasionPolicy(state: DDQNState): EvasionAction {
    if (state.rfJamming && state.altitudeSafetyMarginM > 30) {
      return EvasionAction.ALTITUDE_DROP; // Dive below jammer effective altitude
    }
    if (state.radarDetected && state.altitudeSafetyMarginM > 50) {
      return EvasionAction.TERRAIN_MASK; // Use terrain masking to reduce RCS
    }
    if (state.nearbyAllies > 2 && Math.random() > 0.7) {
      return EvasionAction.SWARM_SPLIT; // Split to saturate C-UAS engagement capacity
    }
    if (state.distanceToTargetM > 500 && Math.random() > 0.6) {
      return EvasionAction.SPEED_BURST;
    }
    return EvasionAction.MAINTAIN_COURSE;
  }

  get explorationRate(): number { return this.epsilon; }

  private _decayEpsilon(): void {
    this.epsilon = Math.max(
      this.config.epsilonEnd,
      this.config.epsilonStart -
        (this.config.epsilonStart - this.config.epsilonEnd) *
          (this.step / this.config.epsilonDecaySteps)
    );
  }
}
