import { useMissionStore } from '@/store/useMissionStore';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Orientation() {
  const telemetry = useMissionStore((s) => s.telemetry);
  const status    = useMissionStore((s) => s.status);

  const handleRecenterIMU = () => {
    const { logs, missionTime } = useMissionStore.getState();
    useMissionStore.setState({
      logs: [
        ...logs,
        {
          id:       Date.now(),
          time:     missionTime,
          event:    'IMU re-center commanded. Gyro bias compensated. Attitude reference reset to local vertical',
          severity: 'NOMINAL' as const,
          status:   'OK'      as const,
        },
      ],
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10" data-testid="page-orientation">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono font-bold tracking-tight">3D ROCKET ORIENTATION</h2>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs"
          onClick={handleRecenterIMU}
          disabled={status === 'idle'}
          title="Log an IMU re-center event"
        >
          <RotateCcw className="w-3 h-3 mr-2" /> RE-CENTER IMU
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 3D Visualization */}
        <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center min-h-[400px]" style={{ perspective: '600px' }}>
          <div className="relative flex items-center justify-center w-full h-full">
            {/* The CanSat representation */}
            <div 
              className="w-[80px] h-[130px] rounded-[12px/18px] border-2 border-primary shadow-[0_0_24px_rgba(34,197,94,0.2)] flex items-center justify-center transition-transform duration-100"
              style={{
                background: 'linear-gradient(135deg, #1a3a2a, #0f2a1a)',
                transform: `rotateX(${telemetry.pitch}deg) rotateY(${telemetry.yaw * 0.05}deg) rotateZ(${telemetry.roll}deg)`,
                transformStyle: 'preserve-3d'
              }}
              data-testid="3d-rocket"
            >
              <span className="text-[8px] font-mono text-primary font-bold -rotate-90 tracking-widest">CANSAT-01</span>
              
              {/* Axes indicators (optional detail) */}
              <div className="absolute top-0 left-1/2 w-0.5 h-4 bg-red-500 -translate-x-1/2 -translate-y-full" />
              <div className="absolute top-1/2 right-0 w-4 h-0.5 bg-blue-500 translate-x-full -translate-y-1/2" />
            </div>
            
            {/* Base platform reference */}
            <div className="absolute bottom-10 w-48 h-48 border border-border rounded-full rotate-x-75 -z-10 opacity-30" />
            <div className="absolute bottom-10 w-[1px] h-32 bg-border -z-10 opacity-30" />
          </div>
        </div>

        {/* Readouts */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-center space-y-8">
          
          {/* ROLL */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-mono text-muted-foreground tracking-widest">ROLL (X)</span>
              <span className="text-2xl font-mono font-bold">{telemetry.roll.toFixed(1)}°</span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-muted-foreground z-10" />
              <div 
                className="absolute top-0 bottom-0 bg-cyan-500/80 transition-all duration-100"
                style={{
                  left: telemetry.roll < 0 ? `calc(50% + ${telemetry.roll * 2}%)` : '50%',
                  width: `${Math.abs(telemetry.roll * 2)}%`,
                  maxWidth: '50%'
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
              <span>-10°</span>
              <span>0°</span>
              <span>+10°</span>
            </div>
          </div>

          {/* PITCH */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-mono text-muted-foreground tracking-widest">PITCH (Y)</span>
              <span className="text-2xl font-mono font-bold">{telemetry.pitch.toFixed(1)}°</span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-muted-foreground z-10" />
              <div 
                className="absolute top-0 bottom-0 bg-yellow-500/80 transition-all duration-100"
                style={{
                  left: telemetry.pitch < 0 ? `calc(50% + ${Math.max(telemetry.pitch * 2, -50)}%)` : '50%',
                  width: `${Math.min(Math.abs(telemetry.pitch * 2), 50)}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
              <span>-25°</span>
              <span>0°</span>
              <span>+25°</span>
            </div>
          </div>

          {/* YAW */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-mono text-muted-foreground tracking-widest">YAW (Z)</span>
              <span className="text-2xl font-mono font-bold">{telemetry.yaw.toFixed(1)}°</span>
            </div>
            <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-primary/80 transition-all duration-100"
                style={{ width: `${(telemetry.yaw / 360) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground">
              <span>0°</span>
              <span>180°</span>
              <span>360°</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
