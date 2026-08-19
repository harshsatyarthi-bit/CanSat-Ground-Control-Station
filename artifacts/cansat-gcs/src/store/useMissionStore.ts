/**
 * Global mission store (Zustand).
 *
 * The simulation interval runs outside React (module scope) so it is not
 * affected by React Strict Mode double-invocation of effects.
 */

import { create } from 'zustand';
import type {
  MissionPhase,
  MissionStatus,
  TelemetrySnapshot,
  GraphHistory,
  MissionLogEntry,
  VehicleHealthState,
} from '@/lib/types';
import {
  computePhase,
  computeTelemetry,
  computeHealth,
  appendHistory,
  generatePhaseLog,
  generateTimedLog,
  getInitialTelemetry,
  getInitialHealth,
  emptyHistory,
} from '@/lib/simulation';
import { SIMULATION_MS, SIMULATION_DT } from '@/lib/constants';

// ─── Module-level simulation state ───────────────────────────────────────────
// (Not React state — no re-render triggers here)

let _interval:     ReturnType<typeof setInterval> | null = null;
let _packetCount = 0;
let _simMs  = SIMULATION_MS;   // interval duration (ms) — updated by setSimHz
let _simDt  = SIMULATION_DT;   // seconds advanced per tick — updated by setSimHz

function _startInterval() {
  _stopInterval();
  _interval = setInterval(_tick, _simMs);
}

function _stopInterval() {
  if (_interval) { clearInterval(_interval); _interval = null; }
}

// Main simulation tick — runs every _simMs when mission is active.
function _tick() {
  const s = useMissionStore.getState();
  if (s.status !== 'running') { _stopInterval(); return; }

  // Advance time by one tick (kept to 3 decimal places to avoid float drift).
  const newTime  = parseFloat((s.missionTime + _simDt).toFixed(3));
  _packetCount  += 1;

  const newPhase     = computePhase(newTime);
  const newTelemetry = computeTelemetry(newTime, _packetCount);
  const newHistory   = appendHistory(s.history, newTime, newTelemetry);
  const newHealth    = computeHealth(newPhase, newTelemetry);

  // Collect new log entries for this tick.
  const newLogs = [...s.logs];
  if (newPhase !== s.phase) {
    const entry = generatePhaseLog(newPhase, newTime, newTelemetry);
    if (entry) newLogs.push(entry);
  }
  const timedEntry = generateTimedLog(s.missionTime, newTime, newTelemetry, newLogs);
  if (timedEntry) newLogs.push(timedEntry);

  const justCompleted = newPhase === 'COMPLETE' && s.phase !== 'COMPLETE';

  useMissionStore.setState({
    missionTime: newTime,
    phase:       newPhase,
    telemetry:   newTelemetry,
    history:     newHistory,
    health:      newHealth,
    logs:        newLogs,
    ...(justCompleted ? { status: 'complete' } : {}),
  });

  if (justCompleted) _stopInterval();
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface MissionStore {
  // Reactive state
  status:      MissionStatus;
  phase:       MissionPhase;
  missionTime: number;
  telemetry:   TelemetrySnapshot;
  history:     GraphHistory;
  logs:        MissionLogEntry[];
  health:      VehicleHealthState;
  simHz:       number;

  // Mission control actions
  startMission:          () => void;
  pauseMission:          () => void;
  resumeMission:         () => void;
  stopMission:           () => void;
  resetMission:          () => void;
  armPayloadSeparation:  () => void;
  abortDeployParachute:  () => void;
  setSimHz:              (hz: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMissionStore = create<MissionStore>()((set, get) => ({
  // ── Initial state ───────────────────────────────────────────────────────────
  status:      'idle',
  phase:       'PRE_LAUNCH',
  missionTime: 0,
  telemetry:   getInitialTelemetry(),
  history:     emptyHistory(),
  logs:        [],
  health:      getInitialHealth(),
  simHz:       10,

  // ── Actions ─────────────────────────────────────────────────────────────────
  startMission() {
    if (get().status !== 'idle') return;
    _packetCount = 0;
    set({
      status:      'running',
      missionTime: 0,
      // Start in PRE_LAUNCH so the first tick detects the PRE_LAUNCH→SYS_CHECK
      // transition and generates the SYS_CHECK log entry correctly.
      phase:       'PRE_LAUNCH',
      logs:        [],
      history:     emptyHistory(),
      telemetry:   getInitialTelemetry(),
    });
    _startInterval();
  },

  pauseMission() {
    if (get().status !== 'running') return;
    _stopInterval();
    set({ status: 'paused' });
  },

  resumeMission() {
    if (get().status !== 'paused') return;
    set({ status: 'running' });
    _startInterval();
  },

  stopMission() {
    _stopInterval();
    set({ status: 'complete' });
  },

  resetMission() {
    _stopInterval();
    _packetCount = 0;
    set({
      status:      'idle',
      phase:       'PRE_LAUNCH',
      missionTime: 0,
      telemetry:   getInitialTelemetry(),
      history:     emptyHistory(),
      logs:        [],
      health:      getInitialHealth(),
    });
  },

  armPayloadSeparation() {
    const { missionTime, logs } = get();
    set({
      logs: [
        ...logs,
        {
          id:       Date.now(),
          time:     missionTime,
          event:    'Payload separation ARMED. Awaiting deploy command',
          severity: 'CAUTION',
          status:   'WARN',
        },
      ],
    });
  },

  abortDeployParachute() {
    const { missionTime, logs } = get();
    set({
      logs: [
        ...logs,
        {
          id:       Date.now(),
          time:     missionTime,
          event:    'ABORT: Emergency parachute deployment commanded',
          severity: 'CAUTION',
          status:   'WARN',
        },
      ],
    });
  },

  setSimHz(hz: number) {
    _simMs = Math.round(1000 / hz);
    _simDt = parseFloat((1 / hz).toFixed(4));
    // Restart interval at new rate if currently running
    if (get().status === 'running') _startInterval();
    set({ simHz: hz });
  },
}));
