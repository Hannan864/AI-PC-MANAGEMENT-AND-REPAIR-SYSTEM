
import React, { useState } from 'react';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';
import api from '../../services/api';

const PerformanceOptimizer: React.FC = () => {
  const { state, refreshNow } = useTelemetry();
  const combined = state.performance;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);

  const perf = combined.perf;
  const procs = combined.procs;
  const totalProcesses = combined.totalProcesses;

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    setOptimizationResult(null);

    try {
      const res = await api.post('/v1/optimize');
      const data = res.data?.data ?? res.data;
      setOptimizationResult(data);

      refreshNow();

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('smartpc:refresh-alerts'));
        window.dispatchEvent(new CustomEvent('smartpc:refresh-health'));
      }, 1000);
    } catch (err) {
      console.error('[PerformanceOptimizer] Optimization failed:', err);
    } finally {
      setTimeout(() => setIsAnalyzing(false), 500);
    }
  };

  const killProcess = async (pid: number, name: string) => {
    if (!confirm(`Kill process "${name}" (PID: ${pid})?`)) return;
    setKillingPid(pid);
    try {
      await api.post('/v1/optimize/kill', { pid });
      refreshNow();
    } catch (err) {
      console.error('[PerformanceOptimizer] Kill failed:', err);
    } finally {
      setKillingPid(null);
    }
  };

  const cpuPct = perf.cpu;
  const ramUsedGB = ((perf.ram.totalMB - perf.ram.freeMB) / 1024).toFixed(1);
  const ramTotalGB = (perf.ram.totalMB / 1024).toFixed(1);
  const ramPct = perf.ram.usedPercent;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Optimizer</h1>
          <p className="text-slate-400 mt-1">Intelligent resource rebalancing and active memory compression.</p>
          <LastUpdated timestamp={state.lastUpdated} isRefreshing={state.isRefreshing} className="mt-1" />
        </div>
        <button 
          onClick={performAnalysis}
          disabled={isAnalyzing}
          className={`
            relative px-10 py-4 rounded-2xl font-bold transition-all overflow-hidden
            ${isAnalyzing 
              ? 'bg-slate-800 text-slate-500 cursor-wait' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 active:scale-95'}
          `}
        >
          <span className="relative z-10">{isAnalyzing ? 'Optimizing...' : 'One-Click Global Optimize'}</span>
          {isAnalyzing && (
            <div className="absolute inset-0 bg-indigo-400/20 animate-pulse"></div>
          )}
        </button>
      </div>

      {optimizationResult && (
        <div className="glass p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Optimization Complete</p>
          <div className="flex flex-wrap gap-3">
            {(optimizationResult.actions ?? []).map((a: any, i: number) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                {a.action}: {a.status}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Completed in {optimizationResult.elapsedMs}ms • Metrics refreshed
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass p-5 rounded-2xl border-l-4 border-indigo-500">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Real-Time Load</p>
          <p className="text-2xl font-bold mono mt-1">{cpuPct.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-0.5">CPU Usage</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-emerald-500">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Memory Usage</p>
          <p className="text-2xl font-bold mono mt-1 text-emerald-400">{`${ramUsedGB} GB / ${ramTotalGB} GB`}</p>
          <p className="text-xs text-slate-400 mt-0.5">{`${ramPct}% utilized`}</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Running Processes</p>
          <p className="text-2xl font-bold mono mt-1">{totalProcesses}</p>
          <p className="text-xs text-slate-400 mt-0.5">Active</p>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-rose-500">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">System Performance</p>
          <p className="text-2xl font-bold mono mt-1">{perf?.performanceHealth ?? '...'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{`Score: ${perf?.performanceScore ?? 0}/100`}</p>
        </div>
      </div>

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            High Intensity Processes
          </h3>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter w-fit">
            System Optimization Engine
          </span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Process Identity</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Threads</th>
                <th className="px-6 py-4 text-center">Memory Private Set</th>
                <th className="px-6 py-4 text-center">Impact Score</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {procs.map((proc, i) => (
                <tr key={`${proc.pid}-${i}`} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                      <span className="font-medium text-slate-200">{proc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                      {proc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center mono text-indigo-400 font-bold">{proc.threads ?? '—'}</td>
                  <td className="px-6 py-4 text-center mono text-slate-300">{proc.ramMB} MB</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`
                      px-2 py-0.5 rounded text-[10px] font-bold uppercase
                      ${proc.impact === 'High' ? 'bg-rose-500/10 text-rose-400' : proc.impact === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}
                    `}>
                      {proc.impact}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => killProcess(proc.pid, proc.name)}
                      disabled={killingPid === proc.pid}
                      className="p-2 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    >
                      {killingPid === proc.pid ? (
                        <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {procs.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-xs">No process data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-white/5">
          {procs.map((proc, i) => (
            <div key={`${proc.pid}-${i}`} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                  <span className="font-bold text-slate-200 text-sm">{proc.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                  {proc.status}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Threads</span>
                  <span className="text-xs font-bold text-indigo-400 mono">{proc.threads ?? '—'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-500">RAM</span>
                  <span className="text-xs font-bold text-slate-300 mono">{proc.ramMB}MB</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Impact</span>
                  <span className={`
                    w-fit px-1.5 py-0.5 rounded text-[8px] font-bold uppercase
                    ${proc.impact === 'High' ? 'bg-rose-500/10 text-rose-400' : proc.impact === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}
                  `}>
                    {proc.impact}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizer;
