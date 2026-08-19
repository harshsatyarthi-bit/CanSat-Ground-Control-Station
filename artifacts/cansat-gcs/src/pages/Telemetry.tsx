import { useMissionStore } from '@/store/useMissionStore';

export default function Telemetry() {
  const telemetry = useMissionStore((s) => s.telemetry);
  const status = useMissionStore((s) => s.status);
  const isLive = status !== 'idle';

  const channels = [
    { label: 'ALTITUDE', value: telemetry.altitude, unit: 'm', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'AGL from launch pad' },
    { label: 'TEMPERATURE', value: telemetry.temperature, unit: '°C', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'Ambient + sensor heating' },
    { label: 'PRESSURE', value: telemetry.pressure, unit: 'hPa', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'Barometric' },
    { label: 'BATTERY', value: telemetry.battery, unit: 'V', status: !isLive ? 'IDLE' : telemetry.battery > 3.6 ? 'NOMINAL' : telemetry.battery > 3.4 ? 'CAUTION' : 'CRITICAL', notes: 'Main bus voltage' },
    { label: 'PACKET COUNT', value: telemetry.packetCount, unit: 'pkts', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'Cumulative received' },
    { label: 'DESCENT RATE', value: telemetry.descentRate, unit: 'm/s', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'Negative = descending' },
    { label: 'GPS FIX', value: telemetry.gpsFix, unit: 'sats', status: !isLive ? 'IDLE' : telemetry.gpsFix >= 6 ? 'NOMINAL' : telemetry.gpsFix >= 3 ? 'CAUTION' : 'CRITICAL', notes: 'Satellites locked' },
    { label: 'ROLL', value: telemetry.roll, unit: '°', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'X-axis rotation' },
    { label: 'PITCH', value: telemetry.pitch, unit: '°', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'Y-axis rotation' },
    { label: 'YAW', value: telemetry.yaw, unit: '°', status: isLive ? 'NOMINAL' : 'IDLE', notes: 'Z-axis rotation (magnetic)' },
  ];

  const statusColors = {
    NOMINAL: 'text-primary bg-primary',
    CAUTION: 'text-yellow-500 bg-yellow-500',
    CRITICAL: 'text-destructive bg-destructive',
    IDLE: 'text-muted-foreground bg-muted-foreground'
  };

  return (
    <div className="space-y-6 pb-10" data-testid="page-telemetry">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-mono font-bold tracking-tight">LIVE TELEMETRY — 10 CHANNELS</h2>
        <div className="px-3 py-1.5 bg-card border border-border rounded font-mono text-sm">
          PKTS: <span className="text-primary font-bold">{telemetry.packetCount}</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left font-mono text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="py-3 px-4 text-muted-foreground font-medium w-1/4">CHANNEL</th>
              <th className="py-3 px-4 text-muted-foreground font-medium w-1/4">VALUE</th>
              <th className="py-3 px-4 text-muted-foreground font-medium w-1/6">UNIT</th>
              <th className="py-3 px-4 text-muted-foreground font-medium w-1/6">STATUS</th>
              <th className="py-3 px-4 text-muted-foreground font-medium">NOTES</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, i) => (
              <tr key={ch.label} className={`border-b border-border hover:bg-muted/10 transition-colors ${i % 2 === 0 ? 'bg-background/50' : 'bg-transparent'}`}>
                <td className="py-3 px-4 font-bold text-foreground">{ch.label}</td>
                <td className="py-3 px-4 text-lg tabular-nums">
                  {typeof ch.value === 'number' ? ch.value.toFixed(ch.value % 1 === 0 ? 0 : 2) : ch.value}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{ch.unit}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[ch.status as keyof typeof statusColors].split(' ')[1]}`} />
                    <span className={`font-bold ${statusColors[ch.status as keyof typeof statusColors].split(' ')[0]}`}>{ch.status}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">{ch.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
