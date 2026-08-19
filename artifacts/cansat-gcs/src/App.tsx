import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { MainLayout } from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Telemetry from '@/pages/Telemetry';
import MissionControl from '@/pages/MissionControl';
import Graphs from '@/pages/Graphs';
import GPSTracking from '@/pages/GPSTracking';
import Orientation from '@/pages/Orientation';
import Camera from '@/pages/Camera';
import MissionLogs from '@/pages/MissionLogs';
import DataExport from '@/pages/DataExport';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient();

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/telemetry" component={Telemetry} />
        <Route path="/control" component={MissionControl} />
        <Route path="/graphs" component={Graphs} />
        <Route path="/gps" component={GPSTracking} />
        <Route path="/orientation" component={Orientation} />
        <Route path="/camera" component={Camera} />
        <Route path="/logs" component={MissionLogs} />
        <Route path="/export" component={DataExport} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
