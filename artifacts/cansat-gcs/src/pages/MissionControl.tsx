import { useMissionStore } from '@/store/useMissionStore';
import { PHASE_LABELS } from '@/lib/constants';
import { formatMissionTime } from '@/lib/format';
import { Play, Pause, Square, RotateCcw, AlertTriangle, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MissionControl() {
  const { 
    status, phase, missionTime,
    startMission, pauseMission, resumeMission, stopMission, resetMission,
    armPayloadSeparation, abortDeployParachute
  } = useMissionStore();

  const phaseDescriptions: Record<string, string> = {
    PRE_LAUNCH: 'System idle on pad. Awaiting start command.',
    SYS_CHECK: 'Running pre-flight diagnostics and sensor calibration.',
    GPS_LOCK: 'Acquiring satellite constellation fix for navigation.',
    COUNTDOWN: 'Final terminal countdown to ignition.',
    LAUNCH: 'Ignition sequence active. Vehicle ascending.',
    ASCENT: 'Powered ascent phase.',
    COAST: 'Motor burnout. Coasting to apogee.',
    APOGEE: 'Peak altitude reached. Vertical velocity zero.',
    DEPLOY: 'Firing ejection charges for recovery system.',
    DESCENT: 'Descending under canopy.',
    LANDING: 'Touchdown detected. Securing systems.',
    COMPLETE: 'Mission terminated safely. Data logged.'
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10" data-testid="page-control">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight mb-2">MISSION CONTROL</h1>
          <p className="text-muted-foreground font-mono">Primary command interface</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-muted-foreground mb-1">MISSION CLOCK</div>
          <div className="text-4xl font-mono font-bold text-primary tracking-tighter" data-testid="control-timer">
            {formatMissionTime(missionTime)}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 space-y-8 shadow-sm">
        
        {/* Current Phase Display */}
        <div className="bg-background border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-sm uppercase text-muted-foreground font-mono tracking-widest">CURRENT MISSION PHASE</span>
          <h2 className="text-4xl font-mono font-bold text-foreground">
            {PHASE_LABELS[phase]}
          </h2>
          <p className="text-muted-foreground font-mono max-w-md">
            {phaseDescriptions[phase]}
          </p>
          {status === 'complete' && (
            <div className="mt-4 px-4 py-1.5 bg-primary/10 border border-primary/30 rounded text-primary font-mono font-bold">
              MISSION COMPLETE
            </div>
          )}
        </div>

        {/* Primary Controls */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase text-muted-foreground font-mono tracking-widest border-b border-border pb-2">Primary Sequence</h3>
          <div className="grid grid-cols-5 gap-3">
            <Button 
              className="h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm disabled:opacity-50 transition-all"
              disabled={status !== 'idle'}
              onClick={startMission}
              data-testid="btn-start"
            >
              <div className="flex flex-col items-center gap-1">
                <Play className="w-5 h-5" />
                <span>START</span>
              </div>
            </Button>
            <Button 
              variant="outline"
              className="h-16 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 font-mono text-sm transition-all"
              disabled={status !== 'running'}
              onClick={pauseMission}
              data-testid="btn-pause"
            >
              <div className="flex flex-col items-center gap-1">
                <Pause className="w-5 h-5" />
                <span>PAUSE</span>
              </div>
            </Button>
            <Button 
              variant="outline"
              className="h-16 border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 font-mono text-sm transition-all"
              disabled={status !== 'paused'}
              onClick={resumeMission}
              data-testid="btn-resume"
            >
              <div className="flex flex-col items-center gap-1">
                <Play className="w-5 h-5" />
                <span>RESUME</span>
              </div>
            </Button>
            <Button 
              variant="destructive"
              className="h-16 font-mono text-sm transition-all"
              onClick={stopMission}
              disabled={status === 'idle' || status === 'complete'}
              data-testid="btn-stop"
            >
              <div className="flex flex-col items-center gap-1">
                <Square className="w-5 h-5" />
                <span>STOP</span>
              </div>
            </Button>
            <Button 
              variant="ghost"
              className="h-16 font-mono text-sm text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary transition-all"
              onClick={resetMission}
              data-testid="btn-reset"
            >
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-5 h-5" />
                <span>RESET</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Manual Overrides */}
        <div className="space-y-4">
          <h3 className="text-sm uppercase text-muted-foreground font-mono tracking-widest border-b border-border pb-2">Manual Overrides</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              className="h-20 font-mono text-base text-muted-foreground hover:text-foreground hover:bg-secondary border-border transition-all"
              onClick={armPayloadSeparation}
              disabled={status === 'idle'}
              data-testid="btn-arm-separation"
            >
              <Crosshair className="w-5 h-5 mr-3" /> 
              ARM PAYLOAD SEPARATION
            </Button>
            <Button 
              variant="outline"
              className="h-20 font-mono text-base text-destructive border-destructive/50 hover:bg-destructive/10 transition-all"
              onClick={abortDeployParachute}
              disabled={status === 'idle'}
              data-testid="btn-abort-parachute"
            >
              <AlertTriangle className="w-5 h-5 mr-3" /> 
              ABORT / DEPLOY PARACHUTE
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
