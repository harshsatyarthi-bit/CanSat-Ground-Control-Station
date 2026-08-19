import { useMissionStore } from '@/store/useMissionStore';
import { PHASE_LABELS } from '@/lib/constants';
import { formatMissionTime } from '@/lib/format';
import { Rocket, Moon } from 'lucide-react';

export function Header() {
  const { status, phase, missionTime } = useMissionStore();

  return (
    <header className="fixed top-0 left-48 right-0 h-13 bg-card border-b border-border z-50 flex items-center justify-between px-4" data-testid="header">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Rocket className="w-5 h-5 text-primary" />
        <div className="flex items-center gap-2">
          <div className="flex flex-col justify-center">
            <span className="text-[10px] uppercase text-muted-foreground leading-none">Mission</span>
            <span className="text-sm font-mono font-bold leading-tight">CanSat-01</span>
          </div>
          <span className="text-muted-foreground mx-1">·</span>
          <span className="text-xs uppercase text-muted-foreground font-medium">{PHASE_LABELS[phase]}</span>
          <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary border border-border">
            {status === 'running' && (
              <><div className="w-1.5 h-1.5 rounded-full bg-primary live-dot" /><span className="text-[10px] font-mono font-bold text-primary">ACTIVE</span></>
            )}
            {status === 'paused' && (
              <><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /><span className="text-[10px] font-mono font-bold text-yellow-500">PAUSED</span></>
            )}
            {status === 'complete' && (
              <><div className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-[10px] font-mono font-bold text-primary">COMPLETE</span></>
            )}
            {status === 'idle' && (
              <><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /><span className="text-[10px] font-mono font-bold text-muted-foreground">STANDBY</span></>
            )}
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="text-xl font-mono font-bold text-primary" data-testid="mission-timer">
          {formatMissionTime(missionTime)}
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-sm border ${status !== 'idle' ? 'border-primary/50 text-primary bg-primary/10' : 'border-border text-muted-foreground bg-secondary'}`}>
          <div className={`w-2 h-2 rounded-full ${status !== 'idle' ? 'bg-primary live-dot' : 'bg-muted-foreground'}`} />
          <span className="text-xs font-mono font-bold">{status !== 'idle' ? 'LINK ACTIVE' : 'LINK STANDBY'}</span>
        </div>

        <button
          className="p-1.5 text-muted-foreground opacity-40 cursor-not-allowed rounded-sm"
          title="Dark mode — always active"
          disabled
          data-testid="theme-toggle"
        >
          <Moon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
