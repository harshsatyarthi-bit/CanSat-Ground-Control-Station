// ─── Mission State Machine ────────────────────────────────────────────────────

export type MissionPhase =
  | 'PRE_LAUNCH'
  | 'SYS_CHECK'
  | 'GPS_LOCK'
  | 'COUNTDOWN'
  | 'LAUNCH'
  | 'ASCENT'
  | 'COAST'
  | 'APOGEE'
  | 'DEPLOY'
  | 'DESCENT'
  | 'LANDING'
  | 'COMPLETE';

export type MissionStatus = 'idle' | 'running' | 'paused' | 'complete';

// ─── Health & Severity ────────────────────────────────────────────────────────

export type HealthStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';

export type LogSeverity = 'NOMINAL' | 'CAUTION' | 'WARNING' | 'CRITICAL';

export type LogStatus = 'OK' | 'WARN' | 'NOTE' | 'CRIT';

// ─── Telemetry ────────────────────────────────────────────────────────────────

/** A single point-in-time snapshot of all vehicle telemetry. */
export interface TelemetrySnapshot {
  missionTime: number;   // seconds since T=0 (mission start)
  altitude: number;      // meters AGL
  pressure: number;      // hPa
  temperature: number;   // °C (ambient + sensor effect)
  battery: number;       // Volts
  descentRate: number;   // m/s  (positive = ascending, negative = descending)
  gpsFix: number;        // satellite count (0–9)
  roll: number;          // degrees
  pitch: number;         // degrees
  yaw: number;           // degrees
  packetCount: number;   // cumulative received packet counter
  lat: number;           // degrees N (0 when no fix)
  lon: number;           // degrees E (negative = W, 0 when no fix)
  hdop: number;          // horizontal dilution of precision (99.9 = no fix)
}

// ─── Graph History ────────────────────────────────────────────────────────────

/** A single (time, value) data point for graphs. */
export interface GraphPoint {
  t: number;  // mission time (seconds)
  v: number;  // channel value
}

/** Rolling history buffers for the five charted channels. */
export interface GraphHistory {
  altitude: GraphPoint[];
  pressure: GraphPoint[];
  temperature: GraphPoint[];
  battery: GraphPoint[];
  descentRate: GraphPoint[];
}

// ─── Mission Logs ─────────────────────────────────────────────────────────────

export interface MissionLogEntry {
  id: number;
  time: number;         // mission elapsed seconds when event occurred
  event: string;
  severity: LogSeverity;
  status: LogStatus;
}

// ─── Vehicle Health ───────────────────────────────────────────────────────────

export interface VehicleHealthState {
  communication: HealthStatus;
  power: HealthStatus;
  gps: HealthStatus;
  payload: HealthStatus;
  recovery: HealthStatus;
  overall: HealthStatus;
}
