import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { Icons } from '../../constants';

interface MaintenanceTask {
  id: number;
  name: string;
  frequency: string;
  next_run: string | null;
  active: boolean;
  category: string;
  last_run_at: string | null;
  last_result: string | null;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string; chip: string }> = {
  storage: { label: 'Storage', icon: Icons.database, color: 'text-sky-400', chip: 'bg-sky-500/10 text-sky-400 border-sky-500/25' },
  performance: { label: 'Performance', icon: Icons.zap, color: 'text-amber-400', chip: 'bg-amber-500/10 text-amber-400 border-amber-500/25' },
  security: { label: 'Security', icon: Icons.shield, color: 'text-emerald-400', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' },
  backup: { label: 'Backup', icon: Icons.monitor, color: 'text-indigo-400', chip: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' },
  general: { label: 'General', icon: Icons.settings, color: 'text-slate-400', chip: 'bg-slate-500/10 text-slate-400 border-slate-500/25' },
};

const MaintenanceScheduler: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/v1/maintenance/tasks');
      const data = res.data?.data ?? res.data;
      setTasks(Array.isArray(data) ? data : []);
      setLoadError(null);
    } catch (err) {
      console.error('[MaintenanceScheduler] Failed to fetch tasks:', err);
      setLoadError('Could not reach the maintenance engine. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (task: MaintenanceTask) => {
    setBusyId(task.id);
    try {
      const res = await api.post(`/v1/maintenance/tasks/${task.id}/toggle`);
      const updated = res.data?.data;
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, active: updated?.active ?? !t.active } : t)));
      showToast('success', `${task.name} ${updated?.active ? 'scheduled' : 'paused'}.`);
    } catch (err) {
      console.error('[MaintenanceScheduler] Toggle failed:', err);
      showToast('error', `Could not update ${task.name}. Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const runNow = async (task: MaintenanceTask) => {
    setRunningId(task.id);
    try {
      const res = await api.post(`/v1/maintenance/tasks/${task.id}/run`);
      const updated = res.data?.data;
      if (updated) {
        setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, last_run_at: updated.last_run_at, last_result: updated.last_result } : t)));
      }
      showToast('success', res.data?.message || `${task.name} completed.`);
    } catch (err: any) {
      console.error('[MaintenanceScheduler] Run failed:', err);
      showToast('error', err.response?.data?.message || `Could not run ${task.name}. Please try again.`);
    } finally {
      setRunningId(null);
    }
  };

  const categorySet = new Set<string>(tasks.map(t => t.category));
  const categories: string[] = ['all', ...categorySet];
  const visibleTasks = filter === 'all' ? tasks : tasks.filter(t => t.category === filter);
  const activeCount = tasks.filter(t => t.active).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Maintenance Scheduler</h1>
        <p className="text-slate-400 mt-1">Orchestrate automated system health routines and background optimizations.</p>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Total Routines</span>
          <div className="text-2xl font-bold mt-1">{tasks.length}</div>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Active</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Paused</span>
          <div className="text-2xl font-bold text-slate-400 mt-1">{tasks.length - activeCount}</div>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Last Executed</span>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{tasks.filter(t => t.last_run_at).length}</div>
        </div>
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button onClick={fetchTasks} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            Retry
          </button>
        </div>
      )}

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="font-bold">Scheduled Routines</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                  filter === cat
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_META[cat]?.label ?? cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500 italic">Loading routines...</p>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic">
              {tasks.length === 0 ? 'No scheduled routines yet.' : 'No routines match this category.'}
            </div>
          ) : (
            visibleTasks.map(task => {
              const meta = CATEGORY_META[task.category] ?? CATEGORY_META.general;
              return (
                <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.active ? 'bg-indigo-500/10 ' + meta.color : 'bg-slate-800 text-slate-500'}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold">{task.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${meta.chip}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Frequency: {task.frequency}
                        {task.next_run ? ` • Next: ${task.next_run}` : ''}
                      </p>
                      {task.last_run_at && (
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Last run: {new Date(task.last_run_at).toLocaleString()}
                        </p>
                      )}
                      {task.last_result && (
                        <p className={`text-[10px] font-mono mt-0.5 ${String(task.last_result).toLowerCase().includes('off') || String(task.last_result).toLowerCase().includes('cleanup recommended') ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                          {task.last_result}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => runNow(task)}
                      disabled={runningId === task.id || busyId === task.id}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <span className={runningId === task.id ? 'animate-spin inline-block' : ''}>{Icons.activity}</span>
                      {runningId === task.id ? 'Running...' : 'Run Now'}
                    </button>
                    <button
                      onClick={() => toggleTask(task)}
                      disabled={busyId === task.id || runningId === task.id}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                        task.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border-transparent hover:bg-slate-700'
                      }`}
                    >
                      {busyId === task.id ? '...' : task.active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/5">
        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <p className="text-xs text-indigo-300 leading-relaxed font-medium">
            Pro Tip: Scheduling maintenance during "Active Hours" is not recommended to ensure peak performance for your current tasks.
            Use <span className="font-bold">Run Now</span> to execute a routine immediately — results are recorded here.
          </p>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-md animate-[fadeIn_0.2s_ease-out] ${toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-400/30 text-white' : 'bg-rose-600/95 border-rose-400/30 text-white'}`}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? Icons.check : Icons.x}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceScheduler;
