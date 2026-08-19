import { useMissionStore } from '@/store/useMissionStore';
import { formatMissionTime } from '@/lib/format';
import { useRef, useEffect, useState } from 'react';
import { Play, Square, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Canvas draw helpers ──────────────────────────────────────────────────────

function drawNoSignal(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);
  // Static noise pattern
  for (let i = 0; i < 4000; i++) {
    const x = (Math.sin(i * 3.7) * 0.5 + 0.5) * W;
    const y = (Math.cos(i * 5.3) * 0.5 + 0.5) * H;
    const v = Math.floor(((Math.sin(i * 13.1) * 0.5) + 0.5) * 40);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 1);
  }
  // Labels
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(100,100,100,0.9)';
  ctx.textAlign = 'center';
  ctx.fillText('NO SIGNAL', W / 2, H / 2 - 12);
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(70,70,70,0.8)';
  ctx.fillText('CAM_01  PAYLOAD  OFFLINE', W / 2, H / 2 + 12);
  ctx.textAlign = 'left';
}

function drawLive(
  canvas: HTMLCanvasElement,
  altitude: number,
  descentRate: number,
  battery: number,
  gpsFix: number,
  missionTime: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;

  // Sky fraction grows with altitude (downward-facing wide-angle camera)
  const skyFrac = Math.min(altitude / 580, 0.68);
  const horizonY = H * (1 - skyFrac - 0.06);

  // ── Sky ───────────────────────────────────────────────────────────────────
  if (altitude > 5) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (altitude > 250) {
      skyGrad.addColorStop(0, '#000208');
      skyGrad.addColorStop(1, '#010b28');
    } else if (altitude > 80) {
      skyGrad.addColorStop(0, '#020d22');
      skyGrad.addColorStop(1, '#0b2248');
    } else {
      skyGrad.addColorStop(0, '#0a1830');
      skyGrad.addColorStop(1, '#1a3860');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    // Stars visible at high altitude
    if (altitude > 150) {
      const starAlpha = Math.min((altitude - 150) / 300, 0.75);
      ctx.fillStyle = `rgba(255,255,255,${starAlpha})`;
      for (let i = 0; i < 100; i++) {
        const sx = ((i * 137.508) % 1) * W;
        const sy = ((i * 97.331)  % 1) * horizonY;
        const sz = i % 4 === 0 ? 1.5 : 0.7;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), sz, sz);
      }
    }
  } else {
    ctx.fillStyle = '#040404';
    ctx.fillRect(0, 0, W, horizonY > 0 ? horizonY : 0);
  }

  // ── Ground ────────────────────────────────────────────────────────────────
  const gGrad = ctx.createLinearGradient(0, horizonY, 0, H);
  gGrad.addColorStop(0, '#0e2008');
  gGrad.addColorStop(1, '#070f04');
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, Math.max(0, horizonY), W, H);

  // Ground perspective grid (lines vanish at center-horizon)
  const vx = W / 2, vy = Math.max(horizonY, 0);
  ctx.strokeStyle = 'rgba(35,90,18,0.35)';
  ctx.lineWidth = 0.7;
  const nLines = 12;
  for (let i = 0; i <= nLines; i++) {
    const bx = (W / nLines) * i;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }
  for (let d = 1; d <= 6; d++) {
    const gy = vy + (H - vy) * (d / 6);
    const s  = d / 6;
    ctx.beginPath();
    ctx.moveTo(vx - vx * s, gy);
    ctx.lineTo(vx + (W - vx) * s, gy);
    ctx.stroke();
  }

  // Horizon line
  if (altitude > 5) {
    ctx.strokeStyle = 'rgba(60,160,40,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(W, horizonY);
    ctx.stroke();
  }

  // ── Crosshair / reticle ───────────────────────────────────────────────────
  const cx = W / 2, cy = H / 2;
  ctx.strokeStyle = 'rgba(0,230,70,0.75)';
  ctx.lineWidth = 1;
  const gap = 16, arm = 44;
  ctx.beginPath();
  // horizontal
  ctx.moveTo(cx - arm - gap, cy); ctx.lineTo(cx - gap, cy);
  ctx.moveTo(cx + gap, cy);       ctx.lineTo(cx + arm + gap, cy);
  // vertical
  ctx.moveTo(cx, cy - arm - gap); ctx.lineTo(cx, cy - gap);
  ctx.moveTo(cx, cy + gap);       ctx.lineTo(cx, cy + arm + gap);
  ctx.stroke();
  ctx.strokeRect(cx - 6, cy - 6, 12, 12); // center box
  // Corner ticks
  const ctl = 20;
  [[cx - ctl, cy - ctl], [cx + ctl, cy - ctl],
   [cx - ctl, cy + ctl], [cx + ctl, cy + ctl]].forEach(([px, py]) => {
    ctx.strokeRect(px - 3, py - 3, 6, 6);
  });

  // ── Scanlines ─────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

  // ── Vignette ──────────────────────────────────────────────────────────────
  const vig = ctx.createRadialGradient(cx, H / 2, H * 0.25, cx, H / 2, H * 0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── HUD overlays ──────────────────────────────────────────────────────────
  ctx.font = '12px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(0,230,70,0.88)';

  // Top-left
  ctx.textAlign = 'left';
  ctx.fillText('CAM_01  SC-001  PAYLOAD', 16, 26);

  // Top-right: timestamp + REC
  ctx.textAlign = 'right';
  ctx.fillText(`◉ REC  ${formatMissionTime(missionTime)}`, W - 16, 26);

  // Bottom-left: flight data
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,210,65,0.78)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillText(`ALT    ${altitude.toFixed(1).padStart(7)} m`, 16, H - 48);
  ctx.fillText(`RATE   ${descentRate.toFixed(1).padStart(7)} m/s`, 16, H - 32);
  ctx.fillText(`BATT   ${battery.toFixed(2).padStart(7)} V`, 16, H - 16);

  // Bottom-right
  ctx.textAlign = 'right';
  ctx.fillText(`GPS ${gpsFix} SAT`, W - 16, H - 32);
  ctx.fillText('1080p  30fps', W - 16, H - 16);
  ctx.textAlign = 'left';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Camera() {
  const telemetry    = useMissionStore((s) => s.telemetry);
  const missionTime  = useMissionStore((s) => s.missionTime);
  const status       = useMissionStore((s) => s.status);

  const [streaming, setStreaming]       = useState(false);
  const [snapshotCount, setSnapshotCount] = useState(0);

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  // Keep refs current without triggering animation-loop restart
  const telRef       = useRef(telemetry);
  const timeRef      = useRef(missionTime);
  telRef.current  = telemetry;
  timeRef.current = missionTime;

  const isLive = streaming && status === 'running';

  // Draw no-signal frame whenever streaming is off
  useEffect(() => {
    if (!streaming && canvasRef.current) {
      drawNoSignal(canvasRef.current);
    }
  }, [streaming]);

  // Animation loop — only depends on `streaming`, reads live values via refs
  useEffect(() => {
    if (!streaming) return;
    let frameId = 0;
    let lastTs  = 0;
    const animate = (ts: number) => {
      if (ts - lastTs >= 33) { // ~30 fps
        const tel = telRef.current;
        const t   = timeRef.current;
        if (canvasRef.current) {
          drawLive(canvasRef.current, tel.altitude, tel.descentRate, tel.battery, tel.gpsFix, t);
        }
        lastTs = ts;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [streaming]);

  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cansat_snapshot_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setSnapshotCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" data-testid="page-camera">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono font-bold tracking-tight">PAYLOAD CAMERA</h2>
        <div className="flex items-center gap-3">
          {snapshotCount > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {snapshotCount} snapshot{snapshotCount !== 1 ? 's' : ''} saved
            </span>
          )}
          <div className={`flex items-center gap-2 px-3 py-1 border rounded text-xs font-mono font-bold ${
            isLive
              ? 'text-destructive border-destructive/50 bg-destructive/10'
              : 'text-muted-foreground border-border'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-destructive live-dot' : 'bg-muted-foreground'}`} />
            {isLive ? 'REC' : streaming ? 'STANDBY' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div className="bg-black border border-border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-auto block"
          data-testid="camera-canvas"
        />
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-lg p-4 flex gap-4">
        <Button
          variant="outline"
          className={`flex-1 font-mono transition-colors ${
            streaming
              ? 'border-primary/50 text-primary'
              : 'hover:bg-primary/10 hover:text-primary hover:border-primary/50'
          }`}
          onClick={() => setStreaming(true)}
          disabled={streaming}
          data-testid="btn-cam-start"
        >
          <Play className="w-4 h-4 mr-2" /> START STREAM
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-mono hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-colors"
          onClick={() => setStreaming(false)}
          disabled={!streaming}
          data-testid="btn-cam-stop"
        >
          <Square className="w-4 h-4 mr-2" /> STOP STREAM
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-mono hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/50 transition-colors"
          onClick={handleSnapshot}
          data-testid="btn-cam-snap"
        >
          <ImageIcon className="w-4 h-4 mr-2" /> SNAPSHOT
        </Button>
      </div>

      {/* Camera spec footer */}
      <div className="bg-card border border-border rounded-lg p-4 text-xs font-mono text-muted-foreground">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <span className="text-muted-foreground/60 block mb-1">SENSOR</span>
            <span className="text-foreground">12 MP CMOS / 1/2.3"</span>
          </div>
          <div>
            <span className="text-muted-foreground/60 block mb-1">FOV</span>
            <span className="text-foreground">120° WIDE ANGLE</span>
          </div>
          <div>
            <span className="text-muted-foreground/60 block mb-1">RESOLUTION</span>
            <span className="text-foreground">1920 × 1080 / 30fps</span>
          </div>
          <div>
            <span className="text-muted-foreground/60 block mb-1">LINK</span>
            <span className={streaming ? 'text-primary' : 'text-muted-foreground'}>
              {streaming ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
