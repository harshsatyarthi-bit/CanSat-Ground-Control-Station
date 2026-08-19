import { useMissionStore } from '@/store/useMissionStore';
import { PHASE_ORDER, PHASE_SHORT, PHASE_LABELS } from '@/lib/constants';
import { Play, Pause, Square, RotateCcw, AlertTriangle, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { 
    status, phase, telemetry, health, 
    startMission, pauseMission, resumeMission, stopMission, resetMission,
    armPayloadSeparation, abortDeployParachute
  } = useMissionStore();

  const isLive = status !== 'idle';

  return (
    <div className="space-y-8 pb-10" data-testid="page-dashboard">
      
      {/* LIVE TELEMETRY SECTION */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold tracking-tight">LIVE TELEMETRY</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {isLive ? '10 CHANNELS · LIVE' : '10 CHANNELS · AWAITING DOWNLINK'}
            </span>
            {status === 'running' && <div className="w-2 h-2 rounded-full bg-primary live-dot" />}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {/* Row 1 */}
          <TelemetryCard 
            label="ALTITUDE" value={telemetry.altitude} unit="m" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          <TelemetryCard 
            label="TEMPERATURE" value={telemetry.temperature} unit="°C" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          <TelemetryCard 
            label="PRESSURE" value={telemetry.pressure} unit="hPa" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          <TelemetryCard 
            label="BATTERY" value={telemetry.battery} unit="V" 
            status={!isLive ? 'IDLE' : telemetry.battery > 3.6 ? 'NOMINAL' : telemetry.battery > 3.4 ? 'CAUTION' : 'CRITICAL'} 
          />
          <TelemetryCard 
            label="PACKETS" value={telemetry.packetCount} unit="pkts" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          
          {/* Row 2 */}
          <TelemetryCard 
            label="DESCENT RATE" value={telemetry.descentRate} unit="m/s" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          <TelemetryCard 
            label="GPS SATS" value={telemetry.gpsFix} unit="fix" 
            status={!isLive ? 'IDLE' : telemetry.gpsFix >= 6 ? 'NOMINAL' : telemetry.gpsFix >= 3 ? 'CAUTION' : 'CRITICAL'} 
          />
          <TelemetryCard 
            label="ROLL" value={telemetry.roll} unit="°" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          <TelemetryCard 
            label="PITCH" value={telemetry.pitch} unit="°" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
          <TelemetryCard 
            label="YAW" value={telemetry.yaw} unit="°" 
            status={isLive ? 'NOMINAL' : 'IDLE'} 
          />
        </div>
      </section>

      {/* MISSION CONTROL SECTION */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold tracking-tight">MISSION CONTROL</h2>
          <div className="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-xs font-mono text-primary">CONSOLE READY</div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-mono disabled:opacity-50"
              disabled={status !== 'idle'}
              onClick={startMission}
              data-testid="btn-start"
            >
              <Play className="w-4 h-4 mr-2" /> START MISSION
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 font-mono"
              disabled={status !== 'running'}
              onClick={pauseMission}
              data-testid="btn-pause"
            >
              <Pause className="w-4 h-4 mr-2" /> PAUSE
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 font-mono"
              disabled={status !== 'paused'}
              onClick={resumeMission}
              data-testid="btn-resume"
            >
              <Play className="w-4 h-4 mr-2" /> RESUME
            </Button>
            <Button 
              variant="destructive"
              className="flex-1 font-mono"
              onClick={stopMission}
              disabled={status === 'idle' || status === 'complete'}
              data-testid="btn-stop"
            >
              <Square className="w-4 h-4 mr-2" /> STOP
            </Button>
            <Button 
              variant="ghost"
              className="flex-1 font-mono text-muted-foreground hover:text-foreground"
              onClick={resetMission}
              data-testid="btn-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> RESET
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="flex-1 h-12 font-mono text-muted-foreground hover:text-foreground hover:bg-secondary border-border"
              onClick={armPayloadSeparation}
              disabled={status === 'idle'}
              data-testid="btn-arm-separation"
            >
              <Crosshair className="w-4 h-4 mr-2" /> ARM PAYLOAD SEPARATION
            </Button>
            <Button 
              variant="outline"
              className="flex-1 h-12 font-mono text-destructive border-destructive/50 hover:bg-destructive/10"
              onClick={abortDeployParachute}
              disabled={status === 'idle'}
              data-testid="btn-abort-parachute"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> ABORT / DEPLOY PARACHUTE
            </Button>
          </div>

          <div className="pt-2 border-t border-border flex justify-between items-center">
            <span className="text-xs uppercase text-muted-foreground font-mono">CURRENT PHASE</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold">{PHASE_LABELS[phase]}</span>
              <div className="px-2 py-1 bg-secondary border border-border rounded text-xs font-mono text-muted-foreground">
                {status === 'complete' ? 'MISSION COMPLETE' : phase}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION TIMELINE SECTION */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono font-bold tracking-tight">MISSION TIMELINE</h2>
          <div className="px-2 py-1 bg-secondary border border-border rounded text-xs font-mono text-muted-foreground">
            {status === 'complete' ? 'MISSION COMPLETE' : phase}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max gap-4 relative">
            {/* Connecting line */}
            <div className="absolute top-3 left-3 right-3 h-0.5 bg-border -z-10" />
            
            {PHASE_ORDER.map((p) => {
              const pIndex = PHASE_ORDER.indexOf(p);
              const currentIndex = PHASE_ORDER.indexOf(phase);
              const isPast = pIndex < currentIndex || status === 'complete';
              const isCurrent = pIndex === currentIndex && status !== 'complete';
              
              return (
                <div key={p} className="flex flex-col items-center gap-3 relative z-10 w-20">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-card
                    ${isPast ? 'border-primary bg-primary' : isCurrent ? 'border-primary' : 'border-muted-foreground'}`}
                  >
                    {isPast && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    {isCurrent && <div className="w-3 h-3 rounded-full bg-primary live-dot" />}
                  </div>
                  <span className={`text-[10px] font-mono whitespace-nowrap
                    ${isPast || isCurrent ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
                  >
                    {PHASE_SHORT[p]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VEHICLE HEALTH SECTION */}
      <section>
        <h2 className="text-lg font-mono font-bold tracking-tight mb-4">VEHICLE HEALTH</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <HealthRow label="COMMUNICATION" status={health.communication} isLive={isLive} />
            <HealthRow label="POWER" status={health.power} isLive={isLive} />
            <HealthRow label="GPS" status={health.gps} isLive={isLive} />
          </div>
          <div className="space-y-2">
            <HealthRow label="PAYLOAD" status={health.payload} isLive={isLive} />
            <HealthRow label="RECOVERY" status={health.recovery} isLive={isLive} />
            <div className="pt-2 mt-2 border-t border-border">
              <HealthRow label="OVERALL STATUS" status={health.overall} isLive={isLive} bold />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function TelemetryCard({ label, value, unit, status }: { label: string; value: number; unit: string; status: 'NOMINAL' | 'CAUTION' | 'CRITICAL' | 'IDLE' }) {
  const statusColors = {
    NOMINAL: 'text-primary bg-primary',
    CAUTION: 'text-yellow-500 bg-yellow-500',
    CRITICAL: 'text-destructive bg-destructive',
    IDLE: 'text-muted-foreground bg-muted-foreground'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 flex flex-col justify-between h-28" data-testid={`telemetry-${label.toLowerCase()}`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-mono text-muted-foreground tracking-widest">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusColors[status].split(' ')[1]}`} />
          <span className={`text-[9px] font-mono font-bold ${statusColors[status].split(' ')[0]}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold tracking-tighter">
          {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
        </span>
        <span className="text-sm font-mono text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function HealthRow({ label, status, isLive, bold = false }: { label: string; status: string; isLive: boolean; bold?: boolean }) {
  const displayStatus = !isLive ? 'IDLE' : status;
  
  const statusColors = {
    NOMINAL: 'text-primary',
    WARNING: 'text-yellow-500',
    CRITICAL: 'text-destructive',
    IDLE: 'text-muted-foreground'
  };

  const bgColors = {
    NOMINAL: 'bg-primary',
    WARNING: 'bg-yellow-500',
    CRITICAL: 'bg-destructive',
    IDLE: 'bg-muted-foreground'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg" data-testid={`health-${label.toLowerCase().replace(' ', '-')}`}>
      <span className={`font-mono text-sm ${bold ? 'font-bold' : 'text-muted-foreground'}`}>{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${bgColors[displayStatus as keyof typeof bgColors]}`} />
        <span className={`font-mono text-sm font-bold ${statusColors[displayStatus as keyof typeof statusColors]}`}>
          {displayStatus}
        </span>
      </div>
    </div>
  );
}
