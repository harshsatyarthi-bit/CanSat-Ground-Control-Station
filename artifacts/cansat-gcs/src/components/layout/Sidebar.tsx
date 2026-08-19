import { useMissionStore } from '@/store/useMissionStore';
import { Link, useLocation } from 'wouter';
import { 
  Rocket, LayoutDashboard, Activity, Gamepad2, 
  BarChart2, MapPin, Compass, Camera as CameraIcon, 
  FileText, Download, Settings 
} from 'lucide-react';

export function Sidebar() {
  const [location] = useLocation();
  const status = useMissionStore((s) => s.status);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Telemetry', path: '/telemetry', icon: Activity },
    { name: 'Mission Control', path: '/control', icon: Gamepad2 },
    { name: 'Graphs', path: '/graphs', icon: BarChart2 },
    { name: 'GPS Tracking', path: '/gps', icon: MapPin },
    { name: 'Orientation', path: '/orientation', icon: Compass },
    { name: 'Camera', path: '/camera', icon: CameraIcon },
    { name: 'Mission Logs', path: '/logs', icon: FileText },
    { name: 'Data Export', path: '/export', icon: Download },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-48 bg-sidebar border-r border-sidebar-border flex flex-col z-40" data-testid="sidebar">
      {/* Brand Header */}
      <div className="h-13 border-b border-sidebar-border flex items-center px-4 gap-3 shrink-0">
        <Rocket className="w-5 h-5 text-primary" />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-muted-foreground leading-tight">Mission</span>
          <span className="text-sm font-mono font-bold leading-tight">CanSat-01</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navLinks.map((link) => {
            const isActive = location === link.path;
            return (
              <li key={link.path}>
                <Link href={link.path} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-sm transition-colors ${isActive ? 'bg-sidebar-accent text-primary border-l-2 border-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'} `} data-testid={`nav-link-${link.name.toLowerCase().replace(' ', '-')}`}>
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Telemetry Link Status */}
      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/20 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          {status !== 'idle' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-primary live-dot" />
              <span className="text-xs font-mono font-bold text-primary">LINK ACTIVE</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-xs font-mono font-bold text-muted-foreground">STANDBY</span>
            </>
          )}
        </div>
        {status !== 'idle' && (
          <p className="text-[10px] text-muted-foreground leading-tight">
            Receiving active data stream from vehicle.
          </p>
        )}
      </div>
    </aside>
  );
}
