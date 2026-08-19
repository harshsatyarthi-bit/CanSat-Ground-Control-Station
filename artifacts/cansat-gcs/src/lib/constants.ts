import type { MissionPhase } from './types';

// ─── Mission Phase Transition Times (seconds from T=0) ────────────────────────
//
// Total mission: ~112 s
// Descent rate during parachute phase: ~14 m/s  (550 m * 0.99 / 39 s ≈ 13.96 m/s)

export const PHASE_TIMES = {
  SYS_CHECK:  0,
  GPS_LOCK:   4,
  COUNTDOWN:  9,
  LAUNCH:    14,
  ASCENT:    16,
  COAST:     56,
  APOGEE:    63,
  DEPLOY:    66,
  DESCENT:   69,
  LANDING:  108,
  COMPLETE: 112,
} as const;

// ─── Simulation Parameters ────────────────────────────────────────────────────

export const PEAK_ALTITUDE = 550;          // meters at apogee

export const SIMULATION_HZ   = 10;         // ticks per second
export const SIMULATION_DT   = 1 / SIMULATION_HZ;   // 0.1 s per tick
export const SIMULATION_MS   = 1000 / SIMULATION_HZ; // 100 ms interval

export const HISTORY_DURATION_S  = 60;     // seconds of rolling history kept
export const MAX_HISTORY_POINTS  = HISTORY_DURATION_S * SIMULATION_HZ; // 600

// ─── Display Labels ───────────────────────────────────────────────────────────

export const PHASE_LABELS: Record<MissionPhase, string> = {
  PRE_LAUNCH: 'PRE LAUNCH',
  SYS_CHECK:  'SYS CHECK',
  GPS_LOCK:   'GPS LOCK',
  COUNTDOWN:  'COUNTDOWN',
  LAUNCH:     'LAUNCH',
  ASCENT:     'ASCENT',
  COAST:      'COAST',
  APOGEE:     'APOGEE',
  DEPLOY:     'DEPLOY',
  DESCENT:    'DESCENT',
  LANDING:    'LANDING',
  COMPLETE:   'COMPLETE',
};

/** Ordered list of phases for timeline display. */
export const PHASE_ORDER: MissionPhase[] = [
  'PRE_LAUNCH', 'SYS_CHECK', 'GPS_LOCK', 'COUNTDOWN',
  'LAUNCH', 'ASCENT', 'COAST', 'APOGEE',
  'DEPLOY', 'DESCENT', 'LANDING', 'COMPLETE',
];

/** Short label variants for compact timeline display. */
export const PHASE_SHORT: Record<MissionPhase, string> = {
  PRE_LAUNCH: 'PRE LAUN.',
  SYS_CHECK:  'SYS CHECK',
  GPS_LOCK:   'GPS LOCK',
  COUNTDOWN:  'COUNTDOWN',
  LAUNCH:     'LAUNCH',
  ASCENT:     'ASCENT',
  COAST:      'COAST',
  APOGEE:     'APOGEE',
  DEPLOY:     'DEPLOY',
  DESCENT:    'DESCENT',
  LANDING:    'LANDING',
  COMPLETE:   'COMPLETE',
};

export const GCS_VERSION = 'V0.1.0';
