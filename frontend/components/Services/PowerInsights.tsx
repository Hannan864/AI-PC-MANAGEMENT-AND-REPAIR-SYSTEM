import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import LastUpdated from '../Common/LastUpdated';

interface PowerProfile {
  guid: string;
  name: string;
  desc: string;
  active: boolean;
  color: string;
  systemName?: string;
}

interface ConsumptionItem {
  label: string;
  watts: number;
  percent: number;
}

interface BatteryInfo {
  level: number | null;
  isCharging: boolean | null;
  onAc: boolean | null;
  status: string;
  type: string;
  healthPercent: number | null;
  wearPercent: number | null;
  runTimeMinutes: number | null;
}

interface PowerData {
  hasBattery: boolean;
  battery: BatteryInfo;
  profiles: PowerProfile[];
  activeGuid: string | null;
  powerCfgAvailable: boolean;
  consumption: { items: ConsumptionItem[]; totalWatts: number; estimated: boolean };
  totalWatts: number;
  healthScore: number;
  uptime: string;
  serverTime: string;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

type DataSource = 'checking' | 'live' | 'estimated' | 'offline';

const REFRESH_INTERVAL_MS = 30000;

/** Circular progress gauge (SVG) used for battery level and power health. */
const RingGauge: React.FC<{
  value: number;
  size?: number;
  stroke?: number;
  colorClass: string;
  children?: React.ReactNode;
}> = ({ value, size = 120, stroke = 9, colorClass, children }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${clamped}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-white/5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={`${colorClass} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

const PowerInsights: React.FC = () => {
  const [data, setData] = useState<PowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource>('checking');
  const [lastUpdated, setLastUpdated] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [applyingGuid, setApplyingGuid] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  const showToast = (type: ToastState['type'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  // Mock data for when the power service is unavailable.
  // Marked as `estimated` so the UI can be transparent about the source.
  const getMockPowerData = (): PowerData => ({
    hasBattery: false,
    battery: {
      level: null,
      isCharging: null,
      onAc: true,
      status: 'AC Power Connected',
      type: 'Desktop - No Battery',
      healthPercent: null,
      wearPercent: null,
      runTimeMinutes: null,
    },
    profiles: [
      { guid: 'a1841308-3226-4c29-8552-e56d756e987a', name: 'Balanced', desc: 'Balances performance with energy consumption', active: true, color: 'text-emerald-400' },
      { guid: '87597866-bad9-4d94-98cd-b3ece1258378', name: 'High Performance', desc: 'Maximum performance, higher power usage', active: false, color: 'text-amber-400' },
      { guid: 'a1841308-3226-4c29-8552-e56d756e987b', name: 'Power Saver', desc: 'Minimizes power consumption', active: false, color: 'text-slate-400' },
    ],
    activeGuid: 'a1841308-3226-4c29-8552-e56d756e987a',
    powerCfgAvailable: false,
    consumption: {
      items: [
        { label: 'CPU', watts: 45, percent: 35 },
        { label: 'GPU', watts: 25, percent: 20 },
        { label: 'RAM', watts: 8, percent: 45 },
        { label: 'Storage', watts: 6, percent: 15 },
      ],
      totalWatts: 84,
      estimated: true,
    },
    totalWatts: 84,
    healthScore: 85,
    uptime: '2d 14h 32m',
    serverTime: new Date().toISOString(),
  });

  const fetchPower = useCallback(async (opts?: { manual?: boolean }) => {
    if (opts?.manual) setIsRefreshing(true);
    const seq = ++requestSeq.current;
    try {
      const res = await api.get('/v1/power');
      if (seq !== requestSeq.current) return;
      const payload = res.data?.data ?? res.data;
      if (!payload) {
        // Transition to offline and drop any stale readings so the UI
        // never silently presents outdated values.
        setData(null);
        setDataSource('offline');
        return;
      }
      setData(payload);
      setDataSource('live');
      setLastUpdated(Date.now());
    } catch (err) {
      if (seq !== requestSeq.current) return;
      console.warn('[PowerInsights] Power service unavailable, using estimated data:', err);
      // Graceful degradation: show standard estimates, clearly labelled.
      setData(getMockPowerData());
      setDataSource('estimated');
      setLastUpdated(Date.now());
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Initial fetch on mount; when paused, do nothing so toggling off
    // does not trigger an unnecessary refetch.
    if (!autoRefresh) return;
    fetchPower();
    const interval = setInterval(() => fetchPower(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPower, autoRefresh]);

  const applyProfile = async (guid: string) => {
    if (applyingGuid) return;
    setApplyingGuid(guid);
    try {
      const res = await api.post('/v1/power/profile', { guid });
      showToast('success', res.data?.message || 'Power plan applied successfully.');
      await fetchPower();
    } catch (err: any) {
      showToast(
        'error',
        err.response?.data?.message ||
          'Could not apply the power plan. The server may need administrator privileges.'
      );
    } finally {
      setApplyingGuid(null);
    }
  };

  const healthColor = (score: number) =>
    score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';

  const sourceBadge = () => {
    if (dataSource === 'checking') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
          Connecting
        </span>
      );
    }
    if (dataSource === 'live') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.7)]"></span>
          Live Data
        </span>
      );
    }
    if (dataSource === 'estimated') {
      return (
        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Estimated Data
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Offline
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6" aria-busy={loading}>
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Power Insights</h1>
          <p className="text-slate-400 mt-1">
            Real-time battery status, active power plan, and consumption estimates.
          </p>
          <LastUpdated timestamp={lastUpdated} isRefreshing={isRefreshing || loading} className="mt-1.5" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {sourceBadge()}
          <button
            onClick={() => setAutoRefresh(v => !v)}
            aria-pressed={autoRefresh}
            aria-label={autoRefresh ? 'Pause auto refresh' : 'Resume auto refresh'}
            title={autoRefresh ? 'Auto-refreshes every 30s — click to pause' : 'Auto-refresh paused — click to resume'}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
              autoRefresh
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300 hover:bg-amber-500/15'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400'}`}></span>
            {autoRefresh ? 'Auto · 30s' : 'Paused'}
          </button>
          <button
            onClick={() => fetchPower({ manual: true })}
            disabled={isRefreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-3 rounded-2xl border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {toast.message}
        </div>
      )}

      {dataSource === 'estimated' && data && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 text-amber-300 text-sm">
          <span>
            ⚠️ Live power telemetry is unreachable — showing <strong>standard estimated values</strong>. These are safe defaults, not your system's live readings.
          </span>
          <button
            onClick={() => fetchPower({ manual: true })}
            disabled={isRefreshing}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-[11px] font-bold uppercase tracking-widest transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {dataSource === 'offline' && (
        <div className="glass p-12 rounded-3xl text-center border border-rose-500/20">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <p className="text-rose-300 font-medium">Power service is offline.</p>
          <p className="text-slate-500 text-sm mt-2">No live or estimated data could be loaded.</p>
          <button
            onClick={() => fetchPower({ manual: true })}
            disabled={isRefreshing}
            className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse mb-4"></div>
            <div className="w-24 h-8 bg-slate-800 rounded animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="md:col-span-2 glass p-8 rounded-3xl border border-white/5 space-y-4">
            <div className="w-40 h-4 bg-slate-800 rounded animate-pulse"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : !data ? (
        <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-white/5">
          <p className="text-slate-500 italic">Power data unavailable.</p>
        </div>
      ) : (
        <>
          {/* Health strip */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-black uppercase tracking-widest ${healthColor(data.healthScore)}`}>
              Power Health · {data.healthScore}/100
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-xs text-slate-500">Uptime {data.uptime}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-xs text-slate-500">
              {data.powerCfgAvailable ? 'Power plan control available' : 'Power plan control unavailable'}
            </span>
            {!data.powerCfgAvailable && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span className="text-[10px] text-amber-400/80 font-medium">⚡ Estimated Data</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Battery / AC card */}
            <div className="glass p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect><line x1="23" y1="13" x2="23" y2="11"></line></svg>
              </div>

              {data.hasBattery ? (
                <>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">Battery Charge</p>
                  <RingGauge
                    value={data.battery.level ?? 0}
                    size={132}
                    stroke={9}
                    colorClass={data.battery.level !== null && data.battery.level <= 20 ? 'stroke-amber-400' : 'stroke-indigo-400'}
                  >
                    <div className="text-center">
                      <div className="text-4xl font-black mono text-indigo-400">{data.battery.level}%</div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">charge</p>
                    </div>
                  </RingGauge>
                  <p className="text-xs font-bold mt-5 flex items-center gap-2">
                    {data.battery.isCharging ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                        <span className="text-emerald-400">⚡ {data.battery.status}</span>
                      </>
                    ) : (
                      <>
                        <span className={`w-2 h-2 rounded-full ${data.battery.onAc ? 'bg-slate-400' : 'bg-amber-400'}`}></span>
                        <span className={data.battery.onAc ? 'text-slate-300' : 'text-amber-300'}>{data.battery.status}</span>
                      </>
                    )}
                  </p>
                  <div className="w-full mt-6 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                      style={{ width: `${data.battery.level}%` }}
                    ></div>
                  </div>
                  {data.battery.runTimeMinutes !== null && !data.battery.isCharging && (
                    <p className="text-[11px] text-slate-400 mt-3">
                      ≈ {Math.floor(data.battery.runTimeMinutes / 60)}h {data.battery.runTimeMinutes % 60}m remaining
                    </p>
                  )}
                  <div className="w-full mt-4 space-y-1 text-center">
                    {data.battery.healthPercent !== null && (
                      <p className="text-[11px] text-slate-400">
                        Battery Health: <span className={healthColor(data.battery.healthPercent)}>{data.battery.healthPercent}%</span>
                        {data.battery.wearPercent !== null && (
                          <span className="text-slate-500"> · {data.battery.wearPercent}% wear</span>
                        )}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">{data.battery.type}</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Power Source</p>
                  <div className="text-5xl font-black text-slate-300">AC</div>
                  <p className="text-xs text-emerald-400 font-bold mt-4">✓ {data.battery.status}</p>
                  <div className="mt-4 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-emerald-500/60"></div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">AC line power — full supply available</p>
                  <p className="text-[11px] text-slate-500 mt-3 text-center">
                    No battery detected — this system runs on AC power, so battery health tracking does not apply.
                  </p>
                </>
              )}
            </div>

            {/* Power profiles */}
            <div className="md:col-span-2 glass p-8 rounded-3xl border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Active Power Plan</h3>
                {data.powerCfgAvailable && (
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    Click a plan to apply it
                  </span>
                )}
              </div>

              {!data.powerCfgAvailable && (
                <p className="mb-4 text-xs text-amber-300/80 bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2">
                  Power plan control is unavailable — `powercfg` could not list schemes on this system. Profiles shown are the standard Windows plans.
                </p>
              )}

              <div className="space-y-4">
                {data.profiles.length === 0 ? (
                  <div className="p-8 text-center border-dashed border-2 border-white/5 rounded-2xl">
                    <p className="text-slate-500 italic text-sm">No power plans detected.</p>
                    <p className="text-[10px] text-slate-600 mt-1">The system agent could not enumerate Windows power schemes.</p>
                  </div>
                ) : (
                  data.profiles.map(p => {
                    const applying = applyingGuid === p.guid;
                    return (
                      <button
                        key={p.guid}
                        onClick={() => applyProfile(p.guid)}
                        disabled={!data.powerCfgAvailable || !!applyingGuid}
                        aria-pressed={p.active}
                        aria-busy={applying}
                        aria-label={`Apply power plan ${p.name}${p.active ? ' (currently active)' : ''}`}
                        className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                          p.active
                            ? 'bg-white/5 border-white/10'
                            : 'border-white/5 hover:bg-white/2 hover:border-white/10'
                        } ${!data.powerCfgAvailable || applyingGuid ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <div className="flex justify-between items-center gap-3">
                          <div>
                            <h4 className={`font-bold ${p.active ? p.color : 'text-slate-300 group-hover:text-slate-200'}`}>
                              {p.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                            {p.systemName && p.systemName !== p.name && (
                              <p className="text-[10px] text-slate-600 mt-0.5">System scheme: {p.systemName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {applying ? (
                              <span className="text-xs text-indigo-300 font-bold flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></span>
                                Applying…
                              </span>
                            ) : p.active ? (
                              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                                Active
                              </span>
                            ) : data.powerCfgAvailable ? (
                              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 group-hover:text-indigo-300 transition-colors">
                                Apply
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Consumption analytics */}
          <div className="glass p-6 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-bold">Consumption Analytics</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Estimated from live utilization</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest text-indigo-300">
                  {data.consumption.totalWatts}W total
                </span>
              </div>
            </div>

            {data.consumption.items.length === 0 ? (
              <div className="p-8 text-center border-dashed border-2 border-white/5 rounded-2xl">
                <p className="text-slate-500 italic text-sm">No consumption breakdown available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.consumption.items.map((item, i) => (
                  <div key={i} className="bg-white/2 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold text-slate-500">{item.label}</p>
                      <span className="text-[9px] mono text-slate-600">{item.percent}%</span>
                    </div>
                    <p className="text-lg font-black mono mt-1">{item.watts}W</p>
                    <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400/70 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(2, item.percent))}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Total estimated draw: <span className="font-black text-slate-300">{data.totalWatts}W</span> — figures are heuristics
                derived from real CPU/RAM utilization, not direct metering.
              </p>
              {data.serverTime && (
                <p className="text-[9px] mono text-slate-600">
                  Server sync: {new Date(data.serverTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PowerInsights;
