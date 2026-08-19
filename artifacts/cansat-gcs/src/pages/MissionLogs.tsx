import { useMissionStore } from '@/store/useMissionStore';
import { formatLogTime } from '@/lib/format';
import { useState, useEffect, useRef } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function MissionLogs() {
  const logs   = useMissionStore((s) => s.logs);
  const status = useMissionStore((s) => s.status);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'ALL' || log.severity === filterLevel;
    const matchesSearch = log.event.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Auto-scroll to newest entry while the mission is running and no filter active
  useEffect(() => {
    if (status === 'running' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs.length, status]);

  const severityColors = {
    NOMINAL: 'bg-primary/10 text-primary border-primary/20',
    CAUTION: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    WARNING: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    CRITICAL: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const statusColors = {
    OK: 'bg-primary text-primary-foreground',
    WARN: 'bg-yellow-500 text-yellow-950',
    NOTE: 'bg-secondary text-muted-foreground',
    CRIT: 'bg-destructive text-destructive-foreground'
  };

  return (
    <div className="space-y-6 pb-10 flex flex-col h-[calc(100vh-120px)]" data-testid="page-logs">
      
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-mono font-bold tracking-tight">MISSION LOGS</h2>
          <div className="px-2 py-1 bg-secondary rounded text-xs font-mono text-muted-foreground">
            {logs.length} ENTRIES
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-40">
            <Filter className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <select 
              className="w-full bg-card border border-border rounded-md py-2 pl-9 pr-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary"
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              data-testid="select-filter-level"
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="NOMINAL">NOMINAL</option>
              <option value="CAUTION">CAUTION</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 font-mono text-sm bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-logs"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1" ref={scrollRef}>
          <table className="w-full text-left font-mono text-sm border-collapse relative">
            <thead className="sticky top-0 bg-card border-b border-border z-10 shadow-sm">
              <tr>
                <th className="py-3 px-4 text-muted-foreground font-medium w-24">TIME</th>
                <th className="py-3 px-4 text-muted-foreground font-medium">EVENT</th>
                <th className="py-3 px-4 text-muted-foreground font-medium w-28">SEVERITY</th>
                <th className="py-3 px-4 text-muted-foreground font-medium w-20">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground font-mono">
                    No log entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => (
                  <tr key={log.id} className={`border-b border-border/50 hover:bg-muted/10 transition-colors ${i % 2 === 0 ? 'bg-background/30' : 'bg-transparent'}`}>
                    <td className="py-3 px-4 text-muted-foreground">{formatLogTime(log.time)}</td>
                    <td className="py-3 px-4 text-foreground">{log.event}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] border font-bold ${severityColors[log.severity]}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${statusColors[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
