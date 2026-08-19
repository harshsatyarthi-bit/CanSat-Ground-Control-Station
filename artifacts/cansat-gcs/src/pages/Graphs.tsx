import { useMissionStore } from '@/store/useMissionStore';
import { formatGraphTick } from '@/lib/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { GraphPoint } from '@/lib/types';

export default function Graphs() {
  const history = useMissionStore((s) => s.history);
  const status = useMissionStore((s) => s.status);

  return (
    <div className="space-y-6 pb-10" data-testid="page-graphs">
      <h2 className="text-xl font-mono font-bold tracking-tight">LIVE TELEMETRY GRAPHS</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartPanel 
          title="ALTITUDE" 
          unit="m" 
          data={history.altitude} 
          color="#22c55e" 
          gradId="grad-alt" 
          status={status} 
        />
        <ChartPanel 
          title="PRESSURE" 
          unit="hPa" 
          data={history.pressure} 
          color="#06b6d4" 
          gradId="grad-press" 
          status={status} 
        />
        <ChartPanel 
          title="TEMPERATURE" 
          unit="°C" 
          data={history.temperature} 
          color="#f59e0b" 
          gradId="grad-temp" 
          status={status} 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartPanel 
          title="BATTERY VOLTAGE" 
          unit="V" 
          data={history.battery} 
          color="#a78bfa" 
          gradId="grad-batt" 
          status={status} 
        />
        <ChartPanel 
          title="DESCENT RATE" 
          unit="m/s" 
          data={history.descentRate} 
          color="#f87171" 
          gradId="grad-rate" 
          status={status} 
        />
      </div>
    </div>
  );
}

function ChartPanel({ 
  title, 
  unit, 
  data, 
  color, 
  gradId, 
  status 
}: { 
  title: string; 
  unit: string; 
  data: GraphPoint[]; 
  color: string; 
  gradId: string;
  status: string;
}) {
  const simHz   = useMissionStore((s) => s.simHz);
  const isIdle  = status === 'idle' || data.length === 0;
  const isPaused = status === 'paused';
  
  const tLast  = data.length > 0 ? data[data.length - 1].t : 0;
  const tStart = Math.max(0, tLast - 60);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col h-[300px]" data-testid={`chart-${title.toLowerCase().replace(' ', '-')}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/10 shrink-0">
        <div className="font-mono text-sm font-bold text-foreground flex items-baseline gap-2">
          {title} <span className="text-muted-foreground text-xs">{unit}</span>
        </div>
        {status === 'running' && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive live-dot" />
            <span className="text-[10px] font-mono font-bold text-destructive">LIVE</span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative p-2">
        {isIdle ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xs uppercase font-mono text-muted-foreground tracking-widest mb-1">AWAITING STREAM</div>
            <div className="text-xs font-mono text-muted-foreground/50">// graph will render here</div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#1f2937" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={[tStart, tLast]}
                  tickCount={7}
                  tickFormatter={formatGraphTick}
                  stroke="#374151"
                  tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  stroke="#374151"
                  tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  width={40}
                  tickFormatter={(v: number) => Number(v).toFixed(1)}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                  dot={false}
                  activeDot={{ r: 3, fill: color }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f0f0f',
                    border: '1px solid #1f2937',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  labelFormatter={(t: number) => formatGraphTick(t)}
                  formatter={(v: number) => [Number(v).toFixed(2), '']}
                  cursor={{ stroke: '#374151', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {isPaused && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
                <div className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-500 font-mono text-sm font-bold shadow-lg">
                  ⏸ PAUSED
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border flex justify-between items-center text-[10px] font-mono text-muted-foreground bg-muted/5 shrink-0">
        <div>{isIdle ? '00:00' : formatGraphTick(tStart)} · {isIdle ? 'IDLE' : 'LIVE'}</div>
        <div>{simHz}Hz · {isIdle ? '——:——' : formatGraphTick(tLast)}</div>
      </div>
    </div>
  );
}
