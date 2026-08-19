import { useMissionStore } from '@/store/useMissionStore';
import { useEffect, useState } from 'react';

export default function GPSTracking() {
  const telemetry = useMissionStore((s) => s.telemetry);
  const status    = useMissionStore((s) => s.status);

  const hasFix = telemetry.gpsFix >= 6;
  const isLive = status !== 'idle';

  // Animate the vehicle dot position on the radar
  const [drift, setDrift] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!isLive) { setDrift({ x: 0, y: 0 }); return; }
    const id = setInterval(() => {
      const t = Date.now() / 8000;
      setDrift({ x: Math.sin(t) * 18, y: Math.cos(t * 0.8) * 18 });
    }, 100);
    return () => clearInterval(id);
  }, [isLive]);

  // Format coordinate to 6 decimal places
  const fmtLat = (v: number) =>
    hasFix ? `${Math.abs(v).toFixed(6)}` : '---.------';
  const fmtLon = (v: number) =>
    hasFix ? `${Math.abs(v).toFixed(6)}` : '---.------';

  return (
    <div className="space-y-6 pb-10" data-testid="page-gps">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono font-bold tracking-tight">GPS TRACKING</h2>
        <div className={`px-3 py-1 border rounded text-xs font-mono font-bold ${
          !isLive
            ? 'bg-secondary text-muted-foreground border-border'
            : hasFix
              ? 'bg-primary/20 text-primary border-primary/50'
              : 'bg-destructive/20 text-destructive border-destructive/50'
        }`}>
          {!isLive ? 'SYSTEM STANDBY' : hasFix ? 'FIX ACQUIRED' : 'ACQUIRING FIX'}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Radar Display */}
        <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center w-full md:w-auto">
          <div
            className="relative w-[300px] h-[300px] bg-black rounded-full overflow-hidden border border-border"
            data-testid="radar-display"
          >
            {/* Concentric range rings */}
            <div className="absolute inset-4  rounded-full border border-primary/20" />
            <div className="absolute inset-12 rounded-full border border-primary/20" />
            <div className="absolute inset-20 rounded-full border border-primary/20" />
            <div className="absolute inset-28 rounded-full border border-primary/40" />

            {/* Range labels */}
            <span className="absolute top-[120px] left-1/2 translate-x-1 -translate-y-1/2 text-[8px] font-mono text-primary/50">150m</span>
            <span className="absolute top-[88px]  left-1/2 translate-x-1 -translate-y-1/2 text-[8px] font-mono text-primary/50">300m</span>
            <span className="absolute top-[56px]  left-1/2 translate-x-1 -translate-y-1/2 text-[8px] font-mono text-primary/50">500m</span>

            {/* Crosshair */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-primary/20 -translate-x-1/2" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-primary/20 -translate-y-1/2" />

            {/* Sweep */}
            {isLive && (
              <div className="absolute inset-0 radar-sweep-anim origin-center">
                <div className="absolute top-0 right-1/2 bottom-1/2 left-0 bg-gradient-to-tr from-transparent via-primary/10 to-primary/40 rounded-tl-full border-r border-primary" />
              </div>
            )}

            {/* Vehicle dot */}
            {isLive && hasFix && (
              <div
                className="absolute w-3 h-3 bg-cyan-400 rounded-full z-10 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                style={{
                  top:  `calc(50% + ${drift.y}px)`,
                  left: `calc(50% + ${drift.x}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {!isLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                <span className="text-muted-foreground font-mono text-xs">OFFLINE</span>
              </div>
            )}
          </div>
        </div>

        {/* Readouts */}
        <div className="flex-1">
          <div className="bg-card border border-border rounded-lg p-6 h-full flex flex-col justify-center space-y-8">
            <ReadoutRow
              label="LATITUDE"
              value={fmtLat(telemetry.lat)}
              unit={hasFix ? 'N' : ''}
            />
            <ReadoutRow
              label="LONGITUDE"
              value={fmtLon(telemetry.lon)}
              unit={hasFix ? 'W' : ''}
            />
            <ReadoutRow
              label="SATELLITES"
              value={telemetry.gpsFix.toString()}
              unit="LOCK"
              valueColor={hasFix ? 'text-primary' : telemetry.gpsFix >= 3 ? 'text-yellow-500' : 'text-destructive'}
            />

            <div className="pt-6 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block mb-1">ALTITUDE AGL</span>
                  <span className="text-lg text-foreground font-bold">
                    {telemetry.altitude.toFixed(1)} m
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">HDOP</span>
                  <span className={`text-lg font-bold ${
                    !hasFix ? 'text-muted-foreground' :
                    telemetry.hdop < 1.5 ? 'text-primary' :
                    telemetry.hdop < 3   ? 'text-yellow-500' : 'text-destructive'
                  }`}>
                    {hasFix ? telemetry.hdop.toFixed(1) : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadoutRow({
  label, value, unit, valueColor = 'text-foreground',
}: {
  label: string; value: string; unit: string; valueColor?: string;
}) {
  return (
    <div>
      <span className="text-xs font-mono text-muted-foreground block mb-1 tracking-widest">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-mono font-bold tracking-tighter ${valueColor}`}>{value}</span>
        <span className="text-sm font-mono text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
