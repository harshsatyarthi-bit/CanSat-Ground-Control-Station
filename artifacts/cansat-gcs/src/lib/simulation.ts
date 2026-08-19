/**
 * CanSat Mission Simulation Engine
 *
 * All functions are PURE (no side effects, no Math.random).
 * Every value is computed deterministically from mission elapsed time `t`.
 */

import type {
  MissionPhase,
  TelemetrySnapshot,
  GraphHistory,
  GraphPoint,
  MissionLogEntry,
  VehicleHealthState,
  HealthStatus,
  LogSeverity,
  LogStatus,
} from './types';
import { PHASE_TIMES, PEAK_ALTITUDE, MAX_HISTORY_POINTS } from './constants';

// ─── Math Utilities ───────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Smooth cubic Hermite interpolation (0→1 domain). */
function smoothstep(t: number) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Normalize t into [0,1] over the window [start, end]. */
function prog(t: number, start: number, end: number) {
  return clamp((t - start) / (end - start), 0, 1);
}

// ─── Phase Determination ──────────────────────────────────────────────────────

export function computePhase(t: number): MissionPhase {
  const P = PHASE_TIMES;
  if (t >= P.COMPLETE) return 'COMPLETE';
  if (t >= P.LANDING)  return 'LANDING';
  if (t >= P.DESCENT)  return 'DESCENT';
  if (t >= P.DEPLOY)   return 'DEPLOY';
  if (t >= P.APOGEE)   return 'APOGEE';
  if (t >= P.COAST)    return 'COAST';
  if (t >= P.ASCENT)   return 'ASCENT';
  if (t >= P.LAUNCH)   return 'LAUNCH';
  if (t >= P.COUNTDOWN)return 'COUNTDOWN';
  if (t >= P.GPS_LOCK) return 'GPS_LOCK';
  if (t >= P.SYS_CHECK)return 'SYS_CHECK';
  return 'PRE_LAUNCH';
}

// ─── Altitude Profile ─────────────────────────────────────────────────────────
//
//  0 ─────── ASCENT ────────── COAST ─ APOGEE ─ DEPLOY ─── DESCENT ────── LANDING
//  0 m                            550 m                              0 m
//
//  Descent rate ≈ 550 * 0.99 / 39 s ≈ −14 m/s (parachute terminal velocity)

export function computeAltitude(t: number): number {
  const P = PHASE_TIMES;

  if (t < P.ASCENT) return 0;

  // Powered ascent: 0 → 88 % of peak (smooth acceleration curve)
  if (t <= P.COAST) {
    const p = prog(t, P.ASCENT, P.COAST);
    return PEAK_ALTITUDE * 0.88 * smoothstep(p);
  }

  // Coast: 88 % → 100 % (decelerating, still climbing)
  if (t <= P.APOGEE) {
    const p = prog(t, P.COAST, P.APOGEE);
    // Ease-out: fast at start, slow at peak
    const eased = 1 - (1 - p) * (1 - p);
    return lerp(PEAK_ALTITUDE * 0.88, PEAK_ALTITUDE, eased);
  }

  // Apogee plateau: nearly flat (tiny drift)
  if (t <= P.DEPLOY) {
    const p = prog(t, P.APOGEE, P.DEPLOY);
    return lerp(PEAK_ALTITUDE, PEAK_ALTITUDE * 0.998, p);
  }

  // Parachute deploy: slight jerk / altitude drop
  if (t <= P.DESCENT) {
    const p = prog(t, P.DEPLOY, P.DESCENT);
    return lerp(PEAK_ALTITUDE * 0.998, PEAK_ALTITUDE * 0.99, p);
  }

  // Parachute descent: linear fall  (nearly constant 14 m/s)
  if (t < P.LANDING) {
    const startAlt = PEAK_ALTITUDE * 0.99; // ≈ 544.5 m
    const p = prog(t, P.DESCENT, P.LANDING);
    // Tiny slowdown near ground (ground effect / flare)
    const fraction = 1 - p * (0.85 + 0.15 * p);
    return Math.max(0, startAlt * fraction);
  }

  return 0;
}

// ─── Pressure ─────────────────────────────────────────────────────────────────
// Simplified ISA barometric formula: P = P₀ · exp(−h / 8 500)

export function computePressure(altitude: number): number {
  return 1013.25 * Math.exp(-altitude / 8500);
}

// ─── Temperature ─────────────────────────────────────────────────────────────
// ISA lapse rate: −6.5 °C / km.
// Slight sensor heating during powered ascent; slow recovery after landing.

export function computeTemperature(t: number, altitude: number): number {
  const envTemp = 20 - altitude * 0.0065;

  if (t >= PHASE_TIMES.LANDING) {
    // Sensor warms up after touchdown (touches warm ground)
    const p = prog(t, PHASE_TIMES.LANDING, PHASE_TIMES.COMPLETE);
    return lerp(envTemp, 19.0, smoothstep(p));
  }

  if (t >= PHASE_TIMES.DESCENT) {
    // Slight aerodynamic heating offset
    return envTemp + 0.3;
  }

  return envTemp;
}

// ─── Battery Voltage ──────────────────────────────────────────────────────────
// Drains from 4.15 V at launch to ~3.82 V at mission end.
// Slightly non-linear (faster drain during radio transmissions).

export function computeBattery(t: number): number {
  const startV = 4.15;
  const endV   = 3.82;
  const p = clamp(t / PHASE_TIMES.COMPLETE, 0, 1);
  const drain = p * 0.7 + p * p * 0.3;   // slightly accelerating drain
  return startV - (startV - endV) * drain;
}

// ─── Descent Rate ─────────────────────────────────────────────────────────────
// Numerical derivative of altitude (positive = climbing, negative = descending).

export function computeDescentRate(t: number): number {
  const dt = 0.05;
  if (t <= 0) return 0;
  const prev = computeAltitude(Math.max(0, t - dt));
  const curr = computeAltitude(t);
  return (curr - prev) / dt;
}

// ─── GPS Satellite Count ──────────────────────────────────────────────────────

export function computeGpsFix(t: number): number {
  const P = PHASE_TIMES;
  if (t < P.GPS_LOCK)   return 0;
  if (t < P.COUNTDOWN)  return Math.round(lerp(0, 9, smoothstep(prog(t, P.GPS_LOCK, P.COUNTDOWN))));
  return 9;
}

// ─── GPS Position ─────────────────────────────────────────────────────────────
// Base: launch site near Gulf coast (plausible CanSat competition location).
// Slow NE drift simulates wind displacement during ascent and descent.

const BASE_LAT =  28.601686;
const BASE_LON = -88.603428;

export function computeGpsPosition(t: number): { lat: number; lon: number; hdop: number } {
  const sats = computeGpsFix(t);
  if (sats === 0) return { lat: 0, lon: 0, hdop: 99.9 };

  // Gentle northeast drift: ~15 m N and ~25 m E total over 112 s mission
  const driftLat = 0.0000014 * t;
  const driftLon = 0.0000025 * t;

  // HDOP improves as satellite count increases
  const hdop = sats >= 8 ? 1.1 : sats >= 6 ? 1.4 : sats >= 4 ? 2.1 : 5.0;

  return {
    lat:  Math.round((BASE_LAT + driftLat) * 1_000_000) / 1_000_000,
    lon:  Math.round((BASE_LON + driftLon) * 1_000_000) / 1_000_000,
    hdop,
  };
}

// ─── Vehicle Orientation ──────────────────────────────────────────────────────
//
// Roll:  small oscillation from aerodynamics, settles after landing.
// Pitch: follows trajectory angle.
// Yaw:   steady slow precession — hits ~254° at t ≈ 109 s (200 + 0.5 × 108 = 254 ✓).

export function computeOrientation(t: number): { roll: number; pitch: number; yaw: number } {
  const P = PHASE_TIMES;

  const yaw = (200 + t * 0.5) % 360;

  let roll: number;
  let pitch: number;

  if (t < P.ASCENT) {
    roll  = 0;
    pitch = 0;
  } else if (t < P.APOGEE) {
    // Spin-stabilised ascent: small roll oscillation
    roll  =  Math.sin(t * 0.8) * 2.5;
    pitch = Math.sin(t * 0.3) * 1.5 + 1.0;
  } else if (t < P.DEPLOY) {
    // At apogee / tumbling before chute
    const amp = lerp(2.5, 4, prog(t, P.APOGEE, P.DEPLOY));
    roll  = Math.sin(t * 1.1) * amp;
    pitch = Math.sin(t * 0.9) * amp * 0.8;
  } else if (t < P.LANDING) {
    // Parachute stabilises the vehicle
    const p = prog(t, P.DEPLOY, P.LANDING);
    const amp = lerp(4, 1.2, smoothstep(p));
    roll  = Math.sin(t * 0.55) * amp;
    pitch = Math.sin(t * 0.35) * amp * 0.6 - 1.0;
  } else {
    // Resting on ground
    roll  = 1.0;
    pitch = -1.4;
  }

  return {
    roll:  Math.round(roll  * 10) / 10,
    pitch: Math.round(pitch * 10) / 10,
    yaw:   Math.round(yaw   * 10) / 10,
  };
}

// ─── Full Telemetry Snapshot ──────────────────────────────────────────────────

export function computeTelemetry(t: number, packetCount: number): TelemetrySnapshot {
  const altitude = computeAltitude(t);
  const { roll, pitch, yaw } = computeOrientation(t);
  const { lat, lon, hdop } = computeGpsPosition(t);

  return {
    missionTime:  Math.round(t * 10) / 10,
    altitude:     Math.round(altitude * 10) / 10,
    pressure:     Math.round(computePressure(altitude) * 10) / 10,
    temperature:  Math.round(computeTemperature(t, altitude) * 10) / 10,
    battery:      Math.round(computeBattery(t) * 100) / 100,
    descentRate:  Math.round(computeDescentRate(t) * 10) / 10,
    gpsFix:       computeGpsFix(t),
    roll,
    pitch,
    yaw,
    packetCount,
    lat,
    lon,
    hdop,
  };
}

// ─── Initial / Reset Values ───────────────────────────────────────────────────

export function getInitialTelemetry(): TelemetrySnapshot {
  return {
    missionTime: 0,
    altitude:    0,
    pressure:    1013.25,
    temperature: 20.0,
    battery:     4.15,
    descentRate: 0,
    gpsFix:      0,
    roll:        0,
    pitch:       0,
    yaw:         0,
    packetCount: 0,
    lat:         0,
    lon:         0,
    hdop:        99.9,
  };
}

export function getInitialHealth(): VehicleHealthState {
  return {
    communication: 'NOMINAL',
    power:         'NOMINAL',
    gps:           'NOMINAL',
    payload:       'NOMINAL',
    recovery:      'NOMINAL',
    overall:       'NOMINAL',
  };
}

export function emptyHistory(): GraphHistory {
  return { altitude: [], pressure: [], temperature: [], battery: [], descentRate: [] };
}

// ─── History Buffer Management ────────────────────────────────────────────────

export function appendHistory(history: GraphHistory, t: number, tel: TelemetrySnapshot): GraphHistory {
  function add(arr: GraphPoint[], val: number): GraphPoint[] {
    const next = [...arr, { t, v: val }];
    return next.length > MAX_HISTORY_POINTS
      ? next.slice(next.length - MAX_HISTORY_POINTS)
      : next;
  }

  return {
    altitude:    add(history.altitude,    tel.altitude),
    pressure:    add(history.pressure,    tel.pressure),
    temperature: add(history.temperature, tel.temperature),
    battery:     add(history.battery,     tel.battery),
    descentRate: add(history.descentRate, tel.descentRate),
  };
}

// ─── Vehicle Health ───────────────────────────────────────────────────────────

export function computeHealth(_phase: MissionPhase, tel: TelemetrySnapshot): VehicleHealthState {
  const power: HealthStatus =
    tel.battery > 3.6 ? 'NOMINAL' :
    tel.battery > 3.4 ? 'WARNING' : 'CRITICAL';

  const gps: HealthStatus =
    tel.gpsFix >= 6 ? 'NOMINAL' :
    tel.gpsFix >= 3 ? 'WARNING' : 'CRITICAL';

  const communication: HealthStatus = 'NOMINAL';
  const payload:       HealthStatus = 'NOMINAL';
  const recovery:      HealthStatus = 'NOMINAL';

  const hasCritical = power === 'CRITICAL' || gps === 'CRITICAL';
  const hasWarning  = power === 'WARNING'  || gps === 'WARNING';
  const overall: HealthStatus = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : 'NOMINAL';

  return { communication, power, gps, payload, recovery, overall };
}

// ─── Log Generation ───────────────────────────────────────────────────────────

type LogDef = {
  event: (tel: TelemetrySnapshot, t: number) => string;
  severity: LogSeverity;
  status: LogStatus;
};

const PHASE_LOG_DEFS: Partial<Record<MissionPhase, LogDef>> = {
  SYS_CHECK:  { event: () => 'System self-test initiated. IMU \u2713  Comms \u2713  Power \u2713  All nominal', severity: 'NOMINAL', status: 'OK' },
  GPS_LOCK:   { event: () => 'GPS acquisition started. Scanning for satellites\u2026', severity: 'NOMINAL', status: 'NOTE' },
  COUNTDOWN:  { event: (tel) => `GPS fix acquired. ${tel.gpsFix} satellites locked. Proceeding to T\u22120 countdown`, severity: 'NOMINAL', status: 'OK' },
  LAUNCH:     { event: () => 'T\u22120. IGNITION SEQUENCE. Launch commit criteria met. Vehicle on internal power', severity: 'NOMINAL', status: 'OK' },
  ASCENT:     { event: () => 'Liftoff confirmed. Positive acceleration detected. Telemetry nominal', severity: 'NOMINAL', status: 'OK' },
  COAST:      { event: (tel) => `Motor burnout. Coast phase. Alt ${tel.altitude.toFixed(0)} m. Rate +${tel.descentRate.toFixed(1)} m/s`, severity: 'NOMINAL', status: 'OK' },
  APOGEE:     { event: (tel) => `Apogee detected. Alt ${tel.altitude.toFixed(0)} m AGL. Vertical velocity \u2248 0 m/s`, severity: 'NOMINAL', status: 'OK' },
  DEPLOY:     { event: () => 'Parachute deployment sequence initiated. Ejection charge fired', severity: 'NOMINAL', status: 'OK' },
  DESCENT:    { event: (tel) => `Parachute deployed. Descent rate ${tel.descentRate.toFixed(1)} m/s. Recovery tracking active`, severity: 'NOMINAL', status: 'OK' },
  LANDING:    { event: () => 'TOUCHDOWN \u2013 high-g impact detected. Accelerometer saturation 47g', severity: 'NOMINAL', status: 'OK' },
  COMPLETE:   { event: (tel, t) => `Mission complete. Touchdown stable. Flight time T+${Math.round(t)} s. Battery ${tel.battery.toFixed(2)} V`, severity: 'NOMINAL', status: 'OK' },
};

export function generatePhaseLog(
  phase: MissionPhase,
  t: number,
  tel: TelemetrySnapshot,
): MissionLogEntry | null {
  const def = PHASE_LOG_DEFS[phase];
  if (!def) return null;
  return {
    id: Date.now() + Math.floor(Math.random() * 999),
    time: t,
    event: def.event(tel, t),
    severity: def.severity,
    status: def.status,
  };
}

// Altitude thresholds that trigger log entries during descent.
const DESCENT_THRESHOLDS: Array<{
  altitude: number;
  event: (tel: TelemetrySnapshot) => string;
  severity: LogSeverity;
  status: LogStatus;
}> = [
  {
    altitude: 400,
    event: (tel) => `Alt ${tel.altitude.toFixed(0)} m AGL. Rate ${tel.descentRate.toFixed(1)} m/s. Descent nominal`,
    severity: 'NOMINAL', status: 'NOTE',
  },
  {
    altitude: 200,
    event: (tel) => `Alt ${tel.altitude.toFixed(0)} m AGL. Rate ${tel.descentRate.toFixed(1)} m/s. Recovery crew on alert`,
    severity: 'NOMINAL', status: 'NOTE',
  },
  {
    altitude: 100,
    event: (tel) => `Alt ${tel.altitude.toFixed(0)} m AGL. Final approach. Rate ${tel.descentRate.toFixed(1)} m/s`,
    severity: 'CAUTION', status: 'WARN',
  },
  {
    altitude: 50,
    event: () => 'Alt <50 m. Bracing for impact. Recovery crew on standby',
    severity: 'CAUTION', status: 'WARN',
  },
  {
    altitude: 15,
    event: () => 'Low-altitude threshold. Alt \u22480 m. Bracing for touchdown',
    severity: 'CAUTION', status: 'WARN',
  },
];

export function generateTimedLog(
  prevT: number,
  currT: number,
  tel: TelemetrySnapshot,
  existingLogs: MissionLogEntry[],
): MissionLogEntry | null {
  // Post-landing self-test fires once, 2 s after touchdown.
  const selfTestT = PHASE_TIMES.LANDING + 2;
  if (prevT < selfTestT && currT >= selfTestT) {
    return {
      id: Date.now() + 1,
      time: currT,
      event: 'Post-landing self-test: IMU \u2713  GPS fix \u2713  TM link \u2713  Battery OK',
      severity: 'NOMINAL',
      status: 'OK',
    };
  }

  // Altitude-threshold logs during active descent.
  if (tel.descentRate < -1) {
    const prevAlt = computeAltitude(prevT);
    for (const thr of DESCENT_THRESHOLDS) {
      if (prevAlt > thr.altitude && tel.altitude <= thr.altitude) {
        // Guard: don't duplicate if we already logged for this threshold.
        const already = existingLogs.some((l) => l.event.includes(`${thr.altitude}`));
        if (!already) {
          return {
            id: Date.now() + thr.altitude,
            time: currT,
            event: thr.event(tel),
            severity: thr.severity,
            status: thr.status,
          };
        }
      }
    }
  }

  return null;
}
