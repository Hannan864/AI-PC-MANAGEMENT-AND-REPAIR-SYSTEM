import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

interface AutomationScript {
  id: number;
  name: string;
  trigger_condition: string;
  actions: string[];
  status: string;
  last_run: string | null;
  last_result: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Counts {
  total: number;
  armed: number;
  paused: number;
  executed: number;
}

interface AutomationData {
  scripts: AutomationScript[];
  counts: Counts;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const ACTION_META: Record<string, { fn: string; args: string; label: string; color: string }> = {
  purge_temp: { fn: 'purge', args: 'TEMP_FILES', label: 'Purge temp files', color: 'text-amber-400' },
  optimize_ram: { fn: 'optimize', args: 'RAM', label: 'Optimize RAM', color: 'text-emerald-400' },
  flush_dns: { fn: 'flush', args: 'DNS_CACHE', label: 'Flush DNS cache', color: 'text-cyan-400' },
  security_scan: { fn: 'verify', args: 'SECURITY', label: 'Security scan', color: 'text-rose-400' },
  backup_check: { fn: 'check', args: 'BACKUPS', label: 'Backup check', color: 'text-indigo-400' },
  report_summary: { fn: 'report', args: 'SUMMARY', label: 'Report summary', color: 'text-slate-300' },
};

const ALL_ACTIONS = Object.keys(ACTION_META);

const formatLastRun = (iso: string | null) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const AutomationHub: React.FC = () => {
  const [data, setData] = useState<AutomationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newActions, setNewActions] = useState<string[]>(['report_summary']);
  const [creating, setCreating] = useState(false);

  const [busyId, setBusyId] = useState<number | null>(null); // run/toggle in-flight
  const [runningId, setRunningId] = useState<number | null>(null); // run in-flight
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const showToast = (type: ToastState['type'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const fetchScripts = async () => {
    try {
      const res = await api.get('/v1/automation/scripts');
      const d = res.data?.data ?? res.data;
      const scripts = Array.isArray(d) ? d : d?.scripts ?? [];
      const counts: Counts = Array.isArray(d)
        ? {
            total: scripts.length,
            armed: scripts.filter((s: AutomationScript) => s.status === 'Armed').length,
            paused: scripts.filter((s: AutomationScript) => s.status === 'Paused').length,
            executed: scripts.filter((s: AutomationScript) => s.last_run).length,
          }
        : d?.counts ?? { total: scripts.length, armed: 0, paused: 0, executed: 0 };
      setData({ scripts, counts });
      setLoadError(null);
      if (selectedId === null && scripts.length > 0) {
        setSelectedId(scripts[0].id);
      }
    } catch (err) {
      console.error('[AutomationHub] Failed to fetch scripts:', err);
      setLoadError('Could not reach the automation service. Retrying automatically…');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
    const interval = setInterval(fetchScripts, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchScript = (updated: AutomationScript) => {
    setData(prev => {
      if (!prev) return prev;
      const scripts = prev.scripts.map(s => (s.id === updated.id ? updated : s));
      return {
        scripts,
        counts: {
          total: scripts.length,
          armed: scripts.filter(s => s.status === 'Armed').length,
          paused: scripts.filter(s => s.status === 'Paused').length,
          executed: scripts.filter(s => s.last_run).length,
        },
      };
    });
  };

  const runScript = async (script: AutomationScript) => {
    if (runningId) return;
    setRunningId(script.id);
    try {
      const res = await api.post(`/v1/automation/scripts/${script.id}/run`);
      showToast('success', res.data?.message || 'Automation executed.');
      patchScript(res.data?.data ?? { ...script, last_run: new Date().toISOString(), last_result: res.data?.message });
    } catch (err: any) {
      showToast('error', err.response?.data?.message || `Could not execute ${script.name}. Please try again.`);
    } finally {
      setRunningId(null);
    }
  };

  const toggleScript = async (script: AutomationScript) => {
    if (busyId) return;
    setBusyId(script.id);
    try {
      const res = await api.post(`/v1/automation/scripts/${script.id}/toggle`);
      const updated = res.data?.data ?? script;
      showToast('success', `${script.name} ${updated.status === 'Armed' ? 'armed' : 'paused'}.`);
      patchScript(updated);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || `Could not update ${script.name}. Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteScript = async (script: AutomationScript) => {
    if (!window.confirm(`Delete automation "${script.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/v1/automation/scripts/${script.id}`);
      setData(prev => {
        if (!prev) return prev;
        const scripts = prev.scripts.filter(s => s.id !== script.id);
        return {
          scripts,
          counts: {
            total: scripts.length,
            armed: scripts.filter(s => s.status === 'Armed').length,
            paused: scripts.filter(s => s.status === 'Paused').length,
            executed: scripts.filter(s => s.last_run).length,
          },
        };
      });
      if (selectedId === script.id) {
        const remaining = (data?.scripts ?? []).filter(s => s.id !== script.id);
        setSelectedId(remaining[0]?.id ?? null);
      }
      showToast('success', `Automation "${script.name}" deleted.`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || `Could not delete ${script.name}.`);
    }
  };

  const createScript = async () => {
    if (!newName.trim() || !newTrigger.trim() || newActions.length === 0) return;
    setCreating(true);
    try {
      const res = await api.post('/v1/automation/scripts', {
        name: newName.trim(),
        trigger_condition: newTrigger.trim(),
        actions: newActions,
      });
      const created = res.data?.data ?? res.data;
      setData(prev => {
        const scripts = prev ? [...prev.scripts, created] : [created];
        return {
          scripts,
          counts: {
            total: scripts.length,
            armed: scripts.filter((s: AutomationScript) => s.status === 'Armed').length,
            paused: scripts.filter((s: AutomationScript) => s.status === 'Paused').length,
            executed: scripts.filter((s: AutomationScript) => s.last_run).length,
          },
        };
      });
      setSelectedId(created.id);
      setNewName('');
      setNewTrigger('');
      setNewActions(['report_summary']);
      setShowCreate(false);
      showToast('success', `Automation "${created.name}" created and armed.`);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Could not create automation.');
    } finally {
      setCreating(false);
    }
  };

  const toggleAction = (action: string) => {
    setNewActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : prev.length < 3 ? [...prev, action] : prev
    );
  };

  const selected = data?.scripts.find(s => s.id === selectedId) ?? null;

  const renderDsl = (script: AutomationScript | null) => {
    if (!script) {
      return (
        <>
          <span className="text-slate-500">// Sentinel DSL v1.0</span>
          <br />
          <span className="text-slate-500">// Select an automation to preview its real script</span>
          <br />
          <span className="text-purple-400">on</span>(SYSTEM_IDLE) {'{'}
          <br />
          &nbsp;&nbsp;<span className="text-emerald-400">purge</span>(TEMP_FILES);
          <br />
          &nbsp;&nbsp;<span className="text-emerald-400">optimize</span>(RAM);
          <br />
          &nbsp;&nbsp;<span className="text-emerald-400">report</span>(SUMMARY);
          <br />
          {'}'}
        </>
      );
    }
    const actions = (script.actions ?? []).slice(0, 3);
    return (
      <>
        <span className="text-slate-500">// Sentinel DSL v1.0 — {script.name}</span>
        <br />
        <span className="text-purple-400">on</span>({script.trigger_condition}) {'{'}
        {actions.length === 0 && (
          <>
            <br />
            &nbsp;&nbsp;<span className="text-slate-600">// no actions defined</span>
          </>
        )}
        {actions.map(a => {
          const meta = ACTION_META[a];
          if (!meta) return null;
          return (
            <span key={a}>
              <br />
              &nbsp;&nbsp;<span className="text-emerald-400">{meta.fn}</span>({meta.args});
            </span>
          );
        })}
        <br />
        {'}'}
      </>
    );
  };

  const counts = data?.counts ?? { total: 0, armed: 0, paused: 0, executed: 0 };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Hub</h1>
          <p className="text-slate-400 mt-1">
            Sandbox orchestration for custom system triggers and scripts — executed for real.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all text-sm shadow-lg shadow-indigo-600/20"
        >
          + New Automation
        </button>
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
            onClick={fetchScripts}
            className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats strip */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.total, color: 'text-slate-200' },
            { label: 'Armed', value: counts.armed, color: 'text-emerald-400' },
            { label: 'Paused', value: counts.paused, color: 'text-amber-400' },
            { label: 'Executed', value: counts.executed, color: 'text-indigo-400' },
          ].map(s => (
            <div key={s.label} className="glass p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{s.label}</p>
              <p className={`text-2xl font-black mono mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automations list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-slate-900/30 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Active Automations</h3>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-800/50 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              ) : !data || data.scripts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No automations configured.</div>
              ) : (
                data.scripts.map(script => {
                  const isRunning = runningId === script.id;
                  const isBusy = busyId === script.id;
                  const isSelected = selectedId === script.id;
                  return (
                    <div
                      key={script.id}
                      className={`p-4 rounded-2xl transition-all border ${
                        isSelected ? 'bg-white/5 border-indigo-500/20' : 'border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-100 truncate">{script.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                                  script.status === 'Armed'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {script.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Trigger: <span className="font-mono text-slate-300">{script.trigger_condition}</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {(script.actions ?? []).slice(0, 3).map(action => {
                                const meta = ACTION_META[action];
                                return (
                                  <span
                                    key={action}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 border border-white/5 ${meta?.color ?? 'text-slate-400'}`}
                                  >
                                    {meta?.label ?? action}
                                  </span>
                                );
                              })}
                            </div>
                            {script.last_result && (
                              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed line-clamp-2">
                                {script.last_result}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-600 mt-1.5">
                              Last run: <span className="text-slate-400">{formatLastRun(script.last_run)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => runScript(script)}
                              disabled={!!runningId}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                isRunning
                                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 cursor-wait'
                                  : 'bg-indigo-600/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/25'
                              }`}
                            >
                              {isRunning ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></span>
                                  Running…
                                </span>
                              ) : (
                                '▶ Run Now'
                              )}
                            </button>
                            <button
                              onClick={() => toggleScript(script)}
                              disabled={!!busyId}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                isBusy
                                  ? 'bg-white/5 text-slate-400 border-white/10 cursor-wait'
                                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              {isBusy
                                ? '…'
                                : script.status === 'Armed'
                                  ? 'Pause'
                                  : 'Arm'}
                            </button>
                            <button
                              onClick={() => deleteScript(script)}
                              className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                              title="Delete automation"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                          </div>
                          <button
                            onClick={() => setSelectedId(script.id)}
                            className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              isSelected ? 'text-indigo-300' : 'text-slate-500 hover:text-indigo-300'
                            }`}
                          >
                            {isSelected ? '● Viewing in sandbox' : 'View DSL'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Scripting sandbox */}
        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4 self-start">
          <div className="flex items-center justify-between">
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500">Scripting Sandbox</h3>
            {selected && (
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider truncate max-w-[140px]">
                {selected.name}
              </span>
            )}
          </div>
          <div className="bg-[#0f172a] p-4 rounded-xl border border-white/5 mono text-[11px] text-indigo-300 min-h-[150px] leading-relaxed overflow-x-auto">
            {renderDsl(selected)}
          </div>
          <button
            onClick={() => selected && runScript(selected)}
            disabled={!selected || !!runningId}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              selected && !runningId
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            {runningId === selected?.id
              ? 'Executing…'
              : selected
                ? '▶ Run in Sandbox'
                : 'Select an automation to run'}
          </button>
          <p className="text-xs text-slate-500 italic leading-relaxed">
            The script above is generated from this automation's real trigger and actions — running it executes those
            exact safe operations on this system.
          </p>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Create Automation</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Nightly Cleanup"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">Trigger Condition</label>
                <input
                  type="text"
                  value={newTrigger}
                  onChange={e => setNewTrigger(e.target.value)}
                  placeholder="e.g. SYSTEM_IDLE"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1.5">
                  Actions (max 3)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ACTIONS.map(action => {
                    const meta = ACTION_META[action];
                    const checked = newActions.includes(action);
                    const atLimit = newActions.length >= 3 && !checked;
                    return (
                      <button
                        key={action}
                        onClick={() => toggleAction(action)}
                        disabled={atLimit}
                        className={`text-left px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${
                          checked
                            ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-300'
                            : atLimit
                              ? 'bg-white/2 border-white/5 text-slate-600 cursor-not-allowed'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className={checked ? meta.color : 'text-slate-400'}>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={createScript}
                disabled={creating || !newName.trim() || !newTrigger.trim() || newActions.length === 0}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create & Arm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationHub;
