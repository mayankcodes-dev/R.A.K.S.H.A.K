// All 3 RAKSHAK scenarios
export const SCENARIOS = [
  {
    id: 'fiber_optic_fpv',
    index: 1,
    name: 'Silent Intruder',
    subtitle: 'Fiber-Optic FPV Drone',
    difficulty: 'HARD',
    difficultyColor: '#ff0033',
    tags: ['NIGHT OPS', 'URBAN EDGE', 'ZERO RF'],
    icon: 'silent',
    description: 'A fiber-optic tethered FPV drone with zero RF signature approaches from Sector 4. Standard EW countermeasures are completely ineffective.',
    keyChallenge: 'RF Jam & GPS Spoof will FAIL. Hard-kill only.',
    threatType: 'fiber_optic_fpv',
    briefing: `CLASSIFIED — PRIORITY ALPHA

Intelligence reports confirm insurgent elements in Sector 4 have acquired fiber-optic FPV drones from cross-border supply chains.

These platforms emit ZERO radio frequency signature. They are completely immune to electronic warfare countermeasures including RF jamming and GPS spoofing.

The fiber-optic control link operates through a physical tether, making the drone invisible to standard C-UAS detection systems that rely on RF signature analysis.

Your mission: Detect, classify, and neutralize the incoming threat using appropriate countermeasures.`,
    events: [
      { time: 0, type: 'SPAWN', statusUpdate: 'SCANNING — Searching for contacts...' },
      { time: 5, type: 'RADAR_CONTACT', statusUpdate: 'CONTACT — Track 0042 acquired', distance: 1500 },
      { time: 10, type: 'CLASSIFICATION', statusUpdate: 'CLASSIFYING — RF silent, micro-Doppler positive', confidence: 0.72, distance: 1200 },
      { time: 15, type: 'PROMPT_ACTION', statusUpdate: 'WARNING — Engagement window closing. Select countermeasure.', confidence: 0.87, distance: 800 },
    ],
    correctAction: 'KINETIC_INTERCEPT',
    wrongResponses: {
      RF_JAM: 'INEFFECTIVE — Target emits NO RF signature. Fiber-optic link is unjammable. The drone continues unaffected!',
      GPS_SPOOF: 'INEFFECTIVE — Target is not GPS-dependent. Fiber-optic FPV drones use direct visual navigation via tethered camera feed!',
    },
  },
  {
    id: 'swarm_storm',
    index: 2,
    name: 'Swarm Storm',
    subtitle: '12-Drone Autonomous Swarm',
    difficulty: 'EXTREME',
    difficultyColor: '#ff0033',
    tags: ['DAY OPS', 'OPEN FIELD', 'MULTI-TRACK'],
    icon: 'swarm',
    description: 'An autonomous 12-drone swarm using mesh networking and distributed AI. Multiple simultaneous tracks require rapid threat prioritization.',
    keyChallenge: 'Prioritize lead drone — neutralize command node first.',
    threatType: 'autonomous_swarm',
    briefing: `CLASSIFIED — PRIORITY CRITICAL

Satellite imagery confirms a 12-unit autonomous UAS swarm has been launched from coordinates 28.61°N 77.20°E. The swarm uses mesh networking — drones share sensor data and coordinate autonomously without human control.

All drones emit standard 2.4GHz control signals EXCEPT the lead command drone (TRK-0001), which is autonomous and requires kinetic intercept.

Follower drones (TRK-0002 through TRK-0012) are GPS-dependent and can be disrupted by GPS spoofing. However, neutralizing follower drones while the command node survives will only slow the swarm — it will re-coordinate.

PRIORITY TARGET: Lead command node (TRK-0001).
SECONDARY: GPS spoof follower drones to break formation.`,
    events: [
      { time: 0, type: 'SPAWN', statusUpdate: 'SCANNING — Detecting multiple returns...' },
      { time: 3, type: 'RADAR_CONTACT', statusUpdate: 'MULTI-CONTACT — 12 tracks acquired', distance: 2000 },
      { time: 8, type: 'CLASSIFICATION', statusUpdate: 'CLASSIFYING — Swarm pattern detected, command node at TRK-0001', confidence: 0.65, distance: 1500 },
      { time: 12, type: 'PROMPT_ACTION', statusUpdate: 'WARNING — SWARM CLOSING. Prioritize command node!', confidence: 0.91, distance: 900 },
    ],
    correctAction: 'KINETIC_INTERCEPT',
    wrongResponses: {
      RF_JAM: 'PARTIAL EFFECT — Follower drones disrupted but command node continues. Swarm re-coordinating via autonomous mesh!',
      GPS_SPOOF: 'PARTIAL EFFECT — Follower drones scattered but command node (autonomous) is GPS-independent. Primary threat continues!',
    },
  },
  {
    id: 'urban_ambush',
    index: 3,
    name: 'Urban Ambush',
    subtitle: 'Drone Near Civilian Infrastructure',
    difficulty: 'MEDIUM',
    difficultyColor: '#ff6600',
    tags: ['DUSK OPS', 'URBAN CORE', 'ROE CRITICAL'],
    icon: 'urban',
    description: 'A hostile RF-controlled drone is loitering near a civilian hospital. Rules of Engagement strictly prohibit kinetic intercept in civilian proximity zones.',
    keyChallenge: 'Hard-kill is PROHIBITED near civilians. EW only.',
    threatType: 'rf_controlled_uav',
    briefing: `CLASSIFIED — PRIORITY HIGH

A hostile RF-controlled quadrotor has been detected loitering at 45m altitude, 120m from Sector 7 Civilian Hospital (protected site under international humanitarian law).

This target IS RF-dependent and can be neutralized via electronic warfare. However, the target's current position creates an EXCLUSION ZONE for kinetic intercept — fragmentation debris risk to civilian infrastructure is unacceptable.

ROE CONSTRAINTS:
- Kinetic intercept: PROHIBITED (civilian proximity < 200m)
- GPS Spoofing: AUTHORIZED (draws drone away from civilian zone first)
- RF Jamming: AUTHORIZED (severs control link, drone enters failsafe RTH)

CORRECT SEQUENCE: GPS Spoof (draw away) OR RF Jam (sever control).
WARNING: Kinetic intercept will result in mission failure and ROE violation.`,
    events: [
      { time: 0, type: 'SPAWN', statusUpdate: 'SCANNING — Radar sweep active...' },
      { time: 4, type: 'RADAR_CONTACT', statusUpdate: 'CONTACT — Track 0077 loitering detected', distance: 800 },
      { time: 7, type: 'CLASSIFICATION', statusUpdate: 'CLASSIFYING — RF-controlled UAV, near civilian zone', confidence: 0.88, distance: 600 },
      { time: 10, type: 'PROMPT_ACTION', statusUpdate: 'ROE ACTIVE — Civilian zone restriction. EW only.', confidence: 0.95, distance: 400 },
    ],
    correctAction: 'GPS_SPOOF', // or RF_JAM — both acceptable
    correctActions: ['GPS_SPOOF', 'RF_JAM'],
    wrongResponses: {
      KINETIC_INTERCEPT: 'ROE VIOLATION — Kinetic intercept PROHIBITED within 200m of civilian infrastructure. Collateral damage risk! Mission failed.',
    },
  },
] as const;

export type ScenarioId = typeof SCENARIOS[number]['id'];
export type Scenario = typeof SCENARIOS[number];
