import { useMissionStore } from '@/store/useMissionStore';
import { GCS_VERSION } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const HZ_OPTIONS = [
  { value: 5,  label: '5 Hz  (200 ms)' },
  { value: 10, label: '10 Hz (100 ms)' },
  { value: 20, label: '20 Hz (50 ms)'  },
];

export default function Settings() {
  const simHz    = useMissionStore((s) => s.simHz);
  const setSimHz = useMissionStore((s) => s.setSimHz);
  const status   = useMissionStore((s) => s.status);

  const [missionName, setMissionName] = useState('CanSat-01');
  const [vehicleId,   setVehicleId]   = useState('SC-001');

  const isRunning = status === 'running' || status === 'paused';

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10" data-testid="page-settings">
      <h2 className="text-xl font-mono font-bold tracking-tight">SYSTEM SETTINGS</h2>

      <div className="space-y-6">

        {/* Mission Configuration */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm uppercase text-muted-foreground font-mono tracking-widest border-b border-border pb-3 mb-4">
            Mission Configuration
          </h3>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="mission-name" className="font-mono text-xs">Mission Name</Label>
              <Input
                id="mission-name"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                className="font-mono bg-background"
                data-testid="input-mission-name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vehicle-id" className="font-mono text-xs">Vehicle ID</Label>
              <Input
                id="vehicle-id"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="font-mono bg-background"
                data-testid="input-vehicle-id"
              />
            </div>
          </div>
        </section>

        {/* Simulation Settings */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm uppercase text-muted-foreground font-mono tracking-widest border-b border-border pb-3 mb-4">
            Simulation Parameters
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="font-mono text-sm block">Telemetry Update Rate</Label>
                <span className="text-xs text-muted-foreground">
                  Simulation cycle frequency — affects graph resolution and CPU usage
                </span>
              </div>
              <select
                className="bg-background border border-border rounded-md py-2 px-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                value={simHz}
                onChange={(e) => setSimHz(Number(e.target.value))}
                disabled={isRunning}
                data-testid="select-sim-hz"
              >
                {HZ_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {isRunning && (
              <p className="text-[11px] font-mono text-yellow-500/80">
                Stop or reset the mission before changing the update rate.
              </p>
            )}
            <div className="flex items-center justify-between py-2 border-t border-border">
              <div>
                <Label className="font-mono text-sm block">Dark Mode</Label>
                <span className="text-xs text-muted-foreground">Mission control theme</span>
              </div>
              <div className="px-3 py-1.5 bg-primary/20 border border-primary/50 text-primary rounded text-sm font-mono font-bold">
                ALWAYS ON
              </div>
            </div>
          </div>
        </section>

        {/* System Information */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm uppercase text-muted-foreground font-mono tracking-widest border-b border-border pb-3 mb-4">
            System Information
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <InfoRow label="Software Version"   value={GCS_VERSION} />
            <InfoRow label="Simulation Engine"  value="Deterministic / 10 Hz default" />
            <InfoRow label="Render Stack"        value="React 19 + Vite 7 + Recharts 2" />
            <InfoRow label="Build Target"        value="Production / Web" />
            <InfoRow label="Peak Altitude"       value="550 m AGL" />
            <InfoRow label="Mission Duration"    value="112 s / 12 phases" />
          </div>
        </section>

      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
