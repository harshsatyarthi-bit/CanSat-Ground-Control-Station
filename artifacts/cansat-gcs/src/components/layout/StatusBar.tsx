import { useMissionStore } from '@/store/useMissionStore';
import { GCS_VERSION } from '@/lib/constants';

export function StatusBar() {
  const status = useMissionStore((s) => s.status);

  return (
    <footer className="fixed bottom-0 left-48 right-0 h-7 bg-black border-t border-border flex items-center justify-between px-4 text-xs font-mono z-50" data-testid="status-bar">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">MISSION:</span>
        {status === 'running' && <span className="text-primary font-bold">ACTIVE</span>}
        {status === 'paused' && <span className="text-yellow-500 font-bold">PAUSED</span>}
        {status === 'complete' && <span className="text-primary font-bold">COMPLETE</span>}
        {status === 'idle' && <span className="text-muted-foreground font-bold">STANDBY</span>}
      </div>

      <div className="text-muted-foreground opacity-50">
        GCS {GCS_VERSION}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">LINK ·</span>
        {status !== 'idle' ? (
          <span className="text-primary font-bold">ACTIVE</span>
        ) : (
          <span className="text-muted-foreground font-bold">STANDBY</span>
        )}
      </div>
    </footer>
  );
}
