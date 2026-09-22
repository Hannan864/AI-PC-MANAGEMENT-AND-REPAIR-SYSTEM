
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { RequestTechnicianHelp } from './RequestTechnicianHelp';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';

const HealthIntelligence: React.FC = () => {
  const { state, refreshNow } = useTelemetry();
  const { healthData: healthData, history, lastUpdated, isRefreshing } = {
    healthData: state.health,
    history: state.history,
    lastUpdated: state.lastUpdated,
    isRefreshing: state.isRefreshing,
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getSnapshot = () => ({
    stats: { cpu: healthData.cpu, ram: healthData.ram.usedPercent, disk: healthData.disk.usedPercent },
    healthData,
    historyLength: history.length,
  });

  const cpuPct = healthData.cpu;
  const ramPct = healthData.ram.usedPercent;
  const diskPct = healthData.disk.usedPercent;

  // Honest freshness: serverTime is when the snapshot was actually collected.
  const serverTimeMs = healthData.serverTime ? new Date(healthData.serverTime).getTime() : 0;
  const dataAgeSec = serverTimeMs ? Math.max(0, Math.floor((Date.now() - serverTimeMs) / 1000)) : null;
  // Realistic freshness window: the snapshot loop refreshes sections every
  // ~1-2 minutes (slow wmic/hardware collectors), so flag only genuinely
  // stale data (monitor down).
  const isStale = dataAgeSec !== null && dataAgeSec > 150;
  const ageLabel =
    dataAgeSec === null
      ? ''
      : dataAgeSec < 60
        ? 'now'
        : dataAgeSec < 3600
          ? `${Math.floor(dataAgeSec / 60)}m ago`
          : `${Math.floor(dataAgeSec / 3600)}h ${Math.floor((dataAgeSec % 3600) / 60)}m ago`;

  const getGlobalScore = (): number => {
    let score = 100;
    if (healthData.cpu > 80) score -= 20;
    else if (healthData.cpu > 60) score -= 10;
    if (healthData.ram.usedPercent > 85) score -= 20;
    else if (healthData.ram.usedPercent > 70) score -= 10;
    if (healthData.disk.usedPercent > 90) score -= 15;
    if (healthData.backendStatus !== 'Online') score -= 25;
    if (healthData.databaseStatus !== 'Connected') score -= 25;
    return Math.max(0, Math.min(100, score));
  };

  const globalScore = getGlobalScore();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Health Intelligence</h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">Real-time physiological audit of system state.</p>
          <LastUpdated timestamp={lastUpdated} isRefreshing={isRefreshing} className="mt-1" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <RequestTechnicianHelp moduleName="Health Intelligence" getSnapshot={getSnapshot} />
          <div className="flex items-center justify-between sm:justify-end gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 leading-none">Global Score</p>
              <p className={`text-xl md:text-2xl font-bold mono ${getHealthColor(globalScore)}`}>
                {globalScore}%
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-slate-800 flex items-center justify-center overflow-hidden">
              <div className={`w-full h-full animate-pulse opacity-20 ${getHealthColor(globalScore).replace('text-', 'bg-')}`}></div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-5 md:p-6 rounded-3xl border border-white/5">
            <h3 className="text-xs font-semibold text-slate-400 mb-6 uppercase tracking-wider">CPU & RAM Load Timeline</h3>
            <div className="h-48 md:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="ram" stroke="#10b981" fillOpacity={1} fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="glass p-5 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">CPU Usage</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold mono">{cpuPct.toFixed(1)}%</span>
                  <span className={`text-[10px] md:text-xs mb-1.5 ${cpuPct > 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {cpuPct > 75 ? 'High Load' : 'Optimal'}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${cpuPct > 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, cpuPct)}%`}}></div>
                </div>
             </div>
             <div className="glass p-5 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-widest">Memory Usage</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl md:text-3xl font-bold mono">{ramPct.toFixed(1)}%</span>
                  <span className="text-[10px] md:text-xs text-indigo-400 mb-1.5">{healthData.ram.freeMB}MB free</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${Math.min(100, ramPct)}%`}}></div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-6 rounded-3xl relative overflow-hidden min-h-[200px]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
               <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
               <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-300">System Status</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Backend Status</span>
                <span className={`text-xs font-bold ${healthData.backendStatus === 'Online' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {healthData.backendStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Database</span>
                <span className={`text-xs font-bold ${healthData.databaseStatus === 'Connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {healthData.databaseStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">System Monitor</span>
                <span className={`text-xs font-bold ${isRefreshing ? 'text-amber-400' : isStale ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isRefreshing ? 'Updating...' : isStale ? 'Stale' : 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Last Refresh</span>
                <span className={`text-[10px] mono ${isStale ? 'text-amber-400' : 'text-slate-500'}`}>
                  {healthData.serverTime ? new Date(healthData.serverTime).toLocaleTimeString() : '--:--:--'}
                </span>
              </div>
              {isStale && !isRefreshing && (
                <div className="flex items-center gap-2 mt-1 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span className="text-[10px] text-amber-300 font-bold">
                    Stale data — collected {ageLabel}. Start the snapshot monitor to see live values.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">System Metrics</h3>
            <div className="space-y-3">
              {[
                { label: 'Disk Usage', value: `${diskPct.toFixed(1)}%`, detail: healthData.disk.totalGB > 0 ? `${healthData.disk.freeGB}GB free / ${healthData.disk.totalGB}GB total` : '', color: diskPct > 90 ? 'text-rose-400' : diskPct > 75 ? 'text-amber-400' : 'text-emerald-400' },
                { label: 'System Uptime', value: healthData.uptime, detail: '', color: 'text-slate-300' },
                { label: 'PHP Version', value: healthData.phpVersion || 'N/A', detail: '', color: 'text-slate-300' },
                { label: 'Laravel Version', value: healthData.laravelVersion || 'N/A', detail: '', color: 'text-indigo-400' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  <div className="text-right">
                    <span className={`${item.color} font-bold`}>{item.value}</span>
                    {item.detail && <span className="block text-[10px] text-slate-600">{item.detail}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthIntelligence;
