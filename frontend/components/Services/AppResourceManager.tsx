import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

interface AppItem {
  name: string;
  pid: number;
  cpuPercent: number | null;
  ram: string;
  ramMB: number;
  ramPercent: number;
  threads: number;
  impact: string;
  priority: string;
  protected: boolean;
}

interface AppsData {
  apps: AppItem[];
  totalProcesses: number;
  totalRamMB: number;
  usedRamMB: number;
  cpuAvg: number | null;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const cpuColor = (pct: number | null) =>
  pct === null ? 'text-slate-500' : pct > 50 ? 'text-rose-400' : pct > 20 ? 'text-amber-400' : 'text-emerald-400';

const impactBadge = (impact: string) =>
  impact === 'High'
    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    : impact === 'Medium'
      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      : 'bg-slate-700 text-slate-400 border border-white/5';

const priorityBadge = (priority: string) =>
  priority === 'High'
    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    : priority === 'Background'
      ? 'bg-slate-700 text-slate-400 border border-white/5'
      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

const AppResourceManager: React.FC = () => {
  const [data, setData] = useState<AppsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const fetchApps = async () => {
    try {
      const res = await api.get('/v1/app-manager');
      setData(res.data?.data ?? res.data);
      setLoadError(null);
    } catch (err) {
      console.error('[AppManager] Failed to fetch apps:', err);
      setLoadError('Could not reach the app manager service. Retrying automatically…');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const killProcess = async (app: AppItem) => {
    if (killingPid) return;
    if (app.protected) {
      showToast('error', `${app.name} is a protected system process and cannot be ended.`);
      return;
    }
    if (!window.confirm(`End "${app.name}" (PID ${app.pid})? Unsaved work in this app will be lost.`)) {
      return;
    }

    setKillingPid(app.pid);
    try {
      const res = await api.post('/v1/optimize/kill', { pid: app.pid });
      showToast('success', res.data?.message || `Process ${app.pid} terminated.`);
      setTimeout(fetchApps, 1500);
    } catch (err: any) {
      showToast(
        'error',
        err.response?.data?.message || `Could not terminate ${app.name}. The server may need administrator privileges.`
      );
    } finally {
      setKillingPid(null);
    }
  };

  const ramUsedGB = data ? (data.usedRamMB / 1024).toFixed(1) : '0';
  const ramTotalGB = data ? (data.totalRamMB / 1024).toFixed(1) : '0';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">App Manager</h1>
        <p className="text-slate-400 mt-1">
          Resource allocation and prioritization for active software — live from system telemetry.
        </p>
      </header>

      {toast && (
        <div
          className={`px-4 py-3 rounded-2xl border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {toast.message}
        </div>
      )}

      {loadError && !data && (
        <div className="glass p-12 rounded-3xl text-center border border-rose-500/20">
          <p className="text-rose-300 font-medium">{loadError}</p>
          <button
            onClick={fetchApps}
            className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-slate-900/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-bold">Application Priority Control</h3>
            {data && (
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-bold">
                  {data.totalProcesses} processes
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-bold">
                  RAM {ramUsedGB} / {ramTotalGB} GB
                </span>
                <span className={`px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-bold ${cpuColor(data.cpuAvg)}`}>
                  Avg CPU {data.cpuAvg !== null ? `${data.cpuAvg}%` : '—'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : !data || data.apps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 italic">No active processes.</div>
          ) : (
            data.apps.map(app => {
              const isKilling = killingPid === app.pid;
              return (
                <div key={app.pid} className="flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-500 border border-white/5 uppercase shrink-0">
                      {app.name[0] || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 truncate">{app.name}</h4>
                        <span className="text-[10px] text-slate-600 font-mono">PID {app.pid}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        CPU: <span className={`font-bold ${cpuColor(app.cpuPercent)}`}>
                          {app.cpuPercent !== null ? `${app.cpuPercent}%` : '—'}
                        </span>{' '}
                        · RAM: {app.ram}
                        {app.threads > 0 && <span> · {app.threads} threads</span>}
                      </p>
                      <div className="mt-1.5 h-1 w-40 max-w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            app.ramPercent > 10 ? 'bg-rose-400' : app.ramPercent > 5 ? 'bg-amber-400' : 'bg-indigo-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, app.ramPercent))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${impactBadge(app.impact)}`}>
                      {app.impact}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${priorityBadge(app.priority)}`}>
                      {app.priority}
                    </span>
                    {app.protected ? (
                      <span
                        title="Protected system process"
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-800/60 text-slate-600 border border-white/5 cursor-not-allowed"
                      >
                        System
                      </span>
                    ) : (
                      <button
                        onClick={() => killProcess(app)}
                        disabled={!!killingPid}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                          isKilling
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 cursor-wait'
                            : 'bg-rose-500/5 text-rose-400/80 border-rose-500/20 hover:bg-rose-500/15 hover:text-rose-300'
                        }`}
                      >
                        {isKilling ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full border-2 border-rose-400 border-t-transparent animate-spin"></span>
                            Ending…
                          </span>
                        ) : (
                          'End Task'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {data && data.apps.some(a => a.protected) && (
        <p className="text-[11px] text-slate-600 px-2">
          System-critical processes are locked to protect system stability. Ending a task requires administrator privileges
          when the process belongs to another session.
        </p>
      )}
    </div>
  );
};

export default AppResourceManager;
