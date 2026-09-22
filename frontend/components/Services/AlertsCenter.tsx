import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { Icons } from '../../constants';

interface AlertData {
  id: number;
  uid: string;
  ruleCode: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  sourceModule: string;
  recommendedAction: string | null;
  suggestedFix: string | null;
  fixRoute: string | null;
  fixAction: 'refresh' | 'navigate' | null;
  fixLabel: string | null;
  fixable: boolean;
  contextData: Record<string, any> | null;
  detectedAt: string;
  lastUpdatedAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  actionable: boolean;
}

interface AlertCounts {
  total: number;
  active: number;
  acknowledged: number;
  in_progress: number;
  resolved: number;
  ignored: number;
  archived: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const AlertsCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [counts, setCounts] = useState<AlertCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fixingId, setFixingId] = useState<number | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchText, setSearchText] = useState('');

  const showToast = (type: ToastState['type'], message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  const fetchAlerts = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (searchText) params.search = searchText;

      const res = await api.get('/v1/alerts', { params });
      const data = res.data?.data ?? [];
      setAlerts(Array.isArray(data) ? data : []);
      if (res.data?.counts) setCounts(res.data.counts);
      setLoadError(null);
    } catch (err) {
      console.error('[AlertsCenter] Failed to fetch alerts:', err);
      setLoadError('Could not reach the alert engine. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterCategory, filterStatus, searchText]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    const handleRefresh = () => fetchAlerts();
    window.addEventListener('smartpc:refresh-alerts', handleRefresh);
    return () => window.removeEventListener('smartpc:refresh-alerts', handleRefresh);
  }, [fetchAlerts]);

  const updateAlertStatus = async (id: number, action: string) => {
    try {
      await api.post(`/v1/alerts/${id}/${action}`);
      showToast('success', `Alert ${action === 'acknowledge' ? 'acknowledged' : action}.`);
      await fetchAlerts();
    } catch (err) {
      console.error(`[AlertsCenter] ${action} failed:`, err);
      showToast('error', `Could not ${action} the alert. Please try again.`);
    }
  };

  const handleFix = async (alert: AlertData) => {
    if (alert.fixAction === 'navigate' && alert.fixRoute) {
      navigateToModule(alert.fixRoute);
      return;
    }
    setFixingId(alert.id);
    try {
      const res = await api.post(`/v1/alerts/${alert.id}/fix`);
      showToast('success', res.data?.message || 'Monitoring refresh started...');
      await fetchAlerts();
      // The refresh runs in the background — poll until it resolves.
      setTimeout(fetchAlerts, 5000);
      setTimeout(fetchAlerts, 15000);
      setTimeout(fetchAlerts, 30000);
    } catch (err: any) {
      console.error('[AlertsCenter] fix failed:', err);
      showToast('error', err.response?.data?.message || 'Could not start the fix. Please try again.');
    } finally {
      setFixingId(null);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    try {
      const res = await api.post('/v1/alerts/refresh');
      showToast('success', res.data?.message || 'Monitoring refresh started...');
      await fetchAlerts();
      setTimeout(fetchAlerts, 5000);
      setTimeout(fetchAlerts, 15000);
      setTimeout(fetchAlerts, 30000);
    } catch (err: any) {
      console.error('[AlertsCenter] refreshAll failed:', err);
      showToast('error', err.response?.data?.message || 'Could not start the monitoring refresh. Please try again.');
    } finally {
      setRefreshingAll(false);
    }
  };

  const navigateToModule = (serviceType: string) => {
    window.dispatchEvent(new CustomEvent('smartpc:navigate', { detail: { serviceType } }));
  };

  const getSeverityStyles = (sev: string) => {
    switch (sev) {
      case 'critical': return 'border-rose-500/30 bg-rose-500/5 text-rose-400';
      case 'high': return 'border-orange-500/30 bg-orange-500/5 text-orange-400';
      case 'warning': return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
      case 'medium': return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400';
      case 'low': return 'border-sky-500/30 bg-sky-500/5 text-sky-400';
      default: return 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400';
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical': return '🚨';
      case 'high': return '🔶';
      case 'warning': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return 'ℹ️';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'acknowledged': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ignored': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'archived': return 'bg-slate-500/5 text-slate-500 border-slate-500/10';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const categories = [...new Set(alerts.map(a => a.category))].sort();
  const severities = ['critical', 'high', 'warning', 'medium', 'low', 'info'];
  const statuses = ['active', 'acknowledged', 'in_progress', 'resolved', 'ignored', 'archived'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts Center</h1>
          <p className="text-slate-400 mt-1">Operational notifications and prioritized system exceptions. Fixable alerts can be resolved right from here.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {counts && (
            <div className="glass px-4 py-2 rounded-2xl border border-white/5 flex gap-3 text-[10px] font-bold flex-wrap">
              <span className="text-rose-400">{counts.active} Active</span>
              <span className="text-amber-400">{counts.acknowledged} Acked</span>
              <span className="text-blue-400">{counts.in_progress} In Progress</span>
              <span className="text-emerald-400">{counts.resolved} Resolved</span>
            </div>
          )}
          <button
            onClick={handleRefreshAll}
            disabled={refreshingAll || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <span className={refreshingAll ? 'animate-spin inline-block' : ''}>{Icons.activity}</span>
            {refreshingAll ? 'Refreshing Data...' : 'Refresh Monitoring Data'}
          </button>
        </div>
      </header>

      <div className="glass rounded-3xl border border-white/5 p-4 flex flex-wrap gap-3 items-center">
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Severities</option>
          {severities.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
        <input
          type="text"
          placeholder="Search alerts..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 flex-1 min-w-[150px]"
        />
      </div>

      {loadError && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button onClick={fetchAlerts} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            Retry
          </button>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-white/5">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 italic">Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass p-12 rounded-3xl text-center border-dashed border-2 border-white/5">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-slate-400 font-medium">All clear — no alerts match your filters.</p>
            <p className="text-slate-600 text-xs mt-1">The alert engine evaluates system health on every check.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`glass p-5 rounded-3xl border ${getSeverityStyles(alert.severity)} transition-all hover:scale-[1.005]`}>
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 shrink-0">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold">{alert.title}</h3>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${getStatusBadge(alert.status)}`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 text-xs max-w-2xl">{alert.description}</p>
                    {alert.recommendedAction && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        <span className="font-bold">Action:</span> {alert.recommendedAction}
                      </p>
                    )}
                    {alert.suggestedFix && (
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        <span className="font-bold">Fix:</span> {alert.suggestedFix}
                      </p>
                    )}
                    <p className="text-[9px] uppercase tracking-widest font-bold text-slate-600 mt-2">
                      {new Date(alert.detectedAt).toLocaleString()}
                      {alert.lastUpdatedAt !== alert.detectedAt && ` • Updated: ${new Date(alert.lastUpdatedAt).toLocaleString()}`}
                      {` • Source: ${alert.sourceModule}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                  {alert.status === 'active' && (
                    <>
                      {alert.fixable && (
                        <button
                          onClick={() => handleFix(alert)}
                          disabled={fixingId === alert.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-indigo-600/20"
                        >
                          {fixingId === alert.id ? 'Fixing...' : alert.fixLabel || 'Fix Now'}
                        </button>
                      )}
                      <button
                        onClick={() => updateAlertStatus(alert.id, 'acknowledge')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold border border-white/10 transition-all"
                      >
                        Ack
                      </button>
                      <button
                        onClick={() => updateAlertStatus(alert.id, 'ignore')}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold border border-white/10 transition-all"
                      >
                        Ignore
                      </button>
                    </>
                  )}
                  {alert.status === 'acknowledged' && (
                    <>
                      {alert.fixAction === 'refresh' ? (
                        // Refresh-fixable alerts: the only honest path is Fix Now —
                        // resolving a still-active condition would just re-alert.
                        <button
                          onClick={() => handleFix(alert)}
                          disabled={fixingId === alert.id}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold transition-all"
                        >
                          {fixingId === alert.id ? 'Fixing...' : alert.fixLabel || 'Fix Now'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => updateAlertStatus(alert.id, 'in-progress')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold transition-all"
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => updateAlertStatus(alert.id, 'resolve')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {alert.status === 'in_progress' && (
                    alert.fixAction === 'refresh' ? (
                      <span className="px-3 py-1.5 bg-blue-500/15 text-blue-300 rounded-xl text-[10px] font-bold border border-blue-500/30 animate-pulse">
                        Refreshing — auto-resolves...
                      </span>
                    ) : (
                      <button
                        onClick={() => updateAlertStatus(alert.id, 'resolve')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-all"
                      >
                        Resolve
                      </button>
                    )
                  )}
                  {(alert.status === 'resolved' || alert.status === 'ignored') && (
                    <button
                      onClick={() => updateAlertStatus(alert.id, 'archive')}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold border border-white/10 transition-all"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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

export default AlertsCenter;
