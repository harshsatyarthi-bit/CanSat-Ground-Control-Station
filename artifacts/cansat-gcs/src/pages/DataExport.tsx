/**
 * DataExport page — server-routed file downloads
 *
 * WHY NO BLOB URLS:
 * The previous implementation used URL.createObjectURL() + a programmatic
 * anchor click.  Endpoint-security software (McAfee, Defender ATP, etc.)
 * intercepts the OS file-write that a blob-URL download produces and inspects
 * the raw bytes.  Because blob: downloads carry no HTTP response headers
 * (Content-Type, Content-Disposition, X-Content-Type-Options…) the AV engine
 * cannot confirm the file origin, and any heuristic mismatch — e.g. a BOM
 * byte sequence it hasn't seen paired with that filename — triggers a block.
 *
 * FIX — two-step server-routed download:
 *  1. Frontend POSTs the serialised data to /api/export/prepare.
 *     Server validates, generates the file content, stores it under a
 *     one-time UUID token (30 s TTL), returns { token }.
 *  2. Frontend clicks a plain <a href="/api/export/file?token=…">.
 *     Browser issues a real HTTP GET; server responds with
 *     Content-Disposition: attachment + the correct MIME type.
 *     AV software sees an ordinary server-sent file download — no blob,
 *     no JS-generated binary, nothing to flag.
 */

import { useState } from 'react';
import { useMissionStore } from '@/store/useMissionStore';
import {
  computeGpsFix,
  computeOrientation,
  computeGpsPosition,
} from '@/lib/simulation';
import { Download, FileJson, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── API base ─────────────────────────────────────────────────────────────────
// The Replit proxy routes /api/* to the Express API server on the same origin,
// so same-origin relative URLs work in both dev and production.
const API = '/api';

// ─── Server-routed download helper ───────────────────────────────────────────

async function serverDownload(
  prepareBody: object,
  setError: (msg: string | null) => void,
): Promise<void> {
  setError(null);

  // Step 1: POST the data — server validates, builds the file, returns a token
  let token: string;
  try {
    const res = await fetch(`${API}/export/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prepareBody),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`);
      throw new Error(text || `Server error (${res.status})`);
    }

    const json = await res.json() as { token?: string };
    if (!json.token) throw new Error('Server returned no download token.');
    token = json.token;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Network error — could not reach export server.');
    return;
  }

  // Step 2: Trigger a real HTTP GET download.
  // This is a plain anchor click to a same-origin URL — the browser issues a
  // genuine HTTP request and receives a Content-Disposition: attachment response.
  // No blob URL, no JS-generated binary.  AV software sees normal HTTP traffic.
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = `${API}/export/file?token=${encodeURIComponent(token)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ─── CSV column definitions ───────────────────────────────────────────────────

const CSV_HEADERS = [
  'Time(s)', 'Altitude(m)', 'Pressure(hPa)', 'Temperature(C)',
  'Battery(V)', 'DescentRate(m/s)', 'GPS_Sats', 'HDOP',
  'Roll(deg)', 'Pitch(deg)', 'Yaw(deg)', 'PacketCount',
  'Lat(deg)', 'Lon(deg)',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataExport() {
  const { history, logs, telemetry } = useMissionStore();

  const [csvBusy,  setCsvBusy]  = useState(false);
  const [jsonBusy, setJsonBusy] = useState(false);
  const [csvError,  setCsvError]  = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    const alt = history.altitude;
    if (alt.length === 0) {
      setCsvError('No telemetry data — run a mission first.');
      return;
    }

    setCsvBusy(true);
    try {
      // Build the rows array here in the browser (same deterministic logic as
      // before); the server just formats them — it doesn't know the sim state.
      const rows: (string | number)[][] = [];

      for (let i = 0; i < alt.length; i++) {
        const t    = alt[i].t;
        const a    = alt[i].v;
        const p    = history.pressure[i]?.v    ?? 0;
        const temp = history.temperature[i]?.v ?? 0;
        const b    = history.battery[i]?.v     ?? 0;
        const d    = history.descentRate[i]?.v ?? 0;

        const sats = computeGpsFix(t);
        const ori  = computeOrientation(t);
        const pos  = computeGpsPosition(t);

        rows.push([
          t.toFixed(3), a.toFixed(1), p.toFixed(1), temp.toFixed(1),
          b.toFixed(3), d.toFixed(1), sats, pos.hdop.toFixed(1),
          ori.roll.toFixed(1), ori.pitch.toFixed(1), ori.yaw.toFixed(1),
          i + 1,                   // PacketCount = history array index + 1
          pos.lat.toFixed(6), pos.lon.toFixed(6),
        ]);
      }

      await serverDownload(
        {
          kind: 'csv',
          headers: CSV_HEADERS,
          rows,
          filename: `cansat_telemetry_${Date.now()}.csv`,
        },
        setCsvError,
      );
    } finally {
      setCsvBusy(false);
    }
  };

  // ── Export JSON ─────────────────────────────────────────────────────────────
  const handleExportJSON = async () => {
    if (logs.length === 0) {
      setJsonError('No log entries — run a mission first.');
      return;
    }

    setJsonBusy(true);
    try {
      await serverDownload(
        {
          kind: 'json',
          payload: {
            exportedAt:      new Date().toISOString(),
            missionDuration: telemetry.missionTime,
            totalPackets:    telemetry.packetCount,
            logs,
          },
          filename: `cansat_logs_${Date.now()}.json`,
        },
        setJsonError,
      );
    } finally {
      setJsonBusy(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10" data-testid="page-export">
      <h2 className="text-xl font-mono font-bold tracking-tight">DATA EXPORT</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* CSV card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-lg mb-2">Telemetry History</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete rolling history: Altitude, Pressure, Temperature, Battery, Descent Rate,
              GPS Sats, HDOP, Roll, Pitch, Yaw, Packets, Lat, Lon.
            </p>
            <div className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded inline-block">
              {history.altitude.length} Data Points · 14 Channels
            </div>
          </div>

          {csvError && (
            <div className="w-full flex items-start gap-2 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800 rounded px-3 py-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              {csvError}
            </div>
          )}

          <Button
            className="w-full font-mono font-bold"
            onClick={handleExportCSV}
            disabled={history.altitude.length === 0 || csvBusy}
            data-testid="btn-export-csv"
          >
            {csvBusy
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> PREPARING…</>
              : <><Download className="w-4 h-4 mr-2" /> EXPORT CSV</>}
          </Button>
        </div>

        {/* JSON card */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <FileJson className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-lg mb-2">Mission Logs</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete event log with timestamps, severity, status, and descriptions —
              including all phase transitions and telemetry alerts.
            </p>
            <div className="text-xs font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded inline-block">
              {logs.length} Log Entries
            </div>
          </div>

          {jsonError && (
            <div className="w-full flex items-start gap-2 text-xs font-mono text-red-400 bg-red-950/40 border border-red-800 rounded px-3 py-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
              {jsonError}
            </div>
          )}

          <Button
            className="w-full font-mono font-bold bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={handleExportJSON}
            disabled={logs.length === 0 || jsonBusy}
            data-testid="btn-export-json"
          >
            {jsonBusy
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> PREPARING…</>
              : <><Download className="w-4 h-4 mr-2" /> EXPORT JSON</>}
          </Button>
        </div>

      </div>

      {/* Column reference */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-xs uppercase font-mono text-muted-foreground tracking-widest mb-4">CSV Column Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
          {[
            ['Time(s)',          'Mission elapsed seconds'],
            ['Altitude(m)',      'AGL in metres'],
            ['Pressure(hPa)',    'Barometric pressure'],
            ['Temperature(C)',   'Ambient + sensor'],
            ['Battery(V)',       'Pack voltage'],
            ['DescentRate(m/s)', '+ascent / −descent'],
            ['GPS_Sats',         'Satellite count'],
            ['HDOP',             'Horizontal dilution'],
            ['Roll(deg)',         'X-axis rotation'],
            ['Pitch(deg)',        'Y-axis rotation'],
            ['Yaw(deg)',          'Z-axis heading'],
            ['PacketCount',       'Cumulative packets'],
            ['Lat(deg)',          'Latitude N'],
            ['Lon(deg)',          'Longitude W'],
          ].map(([col, desc]) => (
            <div key={col} className="py-1">
              <span className="text-primary font-bold block">{col}</span>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
