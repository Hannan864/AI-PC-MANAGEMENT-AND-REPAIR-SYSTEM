import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from '../../../constants';
import { DossierOverviewRow } from '../../../types';
import { systemReportApi } from '../../../services/systemReportApi';

const statusColor: Record<string, string> = {
  HEALTHY: 'text-emerald-400',
  WARNING: 'text-amber-400',
  CRITICAL: 'text-rose-400',
};

const statusBadge: Record<string, string> = {
  HEALTHY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  WARNING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const dateFmt = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

/**
 * Reports Overview — admin view.
 *
 * Every customer with their latest health score, report count, delivery
 * schedule and assigned technician. Gives operations a single command
 * center for the system report pipeline.
 */
export const DossierOverview: React.FC = () => {
  const [rows, setRows] = useState<DossierOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemReportApi.adminOverview();
      setRows(data);
    } catch (err) {
      console.error('Error loading reports overview:', err);
      setError('Failed to load the reports overview. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(r => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const stats = {
    total: rows.length,
    charted: rows.filter(r => r.healthScore !== null && r.healthScore !== undefined).length,
    scheduled: rows.filter(r => r.scheduleEnabled).length,
    critical: rows.filter(r => (r.healthScore ?? 100) < 60).length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Reports Overview</h2>
        <p className="text-slate-400">
          Every customer's system report and delivery schedule at a glance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass p-4 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Customers</span>
          <span className="text-2xl font-bold text-white">{stats.total}</span>
        </div>
        <div className="glass p-4 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">With Report</span>
          <span className="text-2xl font-bold text-indigo-400">{stats.charted}</span>
        </div>
        <div className="glass p-4 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Scheduled</span>
          <span className="text-2xl font-bold text-emerald-400">{stats.scheduled}</span>
        </div>
        <div className="glass p-4 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">At Risk</span>
          <span className="text-2xl font-bold text-rose-400">{stats.critical}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{Icons.search}</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search customers…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 focus:border-indigo-400/50 focus:outline-none text-sm text-white placeholder-slate-500 transition-colors"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 border border-white/5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
          <p className="text-rose-400 mb-3">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-14 text-center glass rounded-xl border border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-rose-400">
            {Icons.heart}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {rows.length === 0 ? 'No Customers Yet' : 'No Matches'}
          </h3>
          <p className="text-slate-500">
            {rows.length === 0
              ? 'Registered customers will appear here with their report status.'
              : 'No customer matches your search.'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-3 py-3">Health</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Reports</th>
                  <th className="text-left px-3 py-3">Schedule</th>
                  <th className="text-left px-3 py-3">Last Capture</th>
                  <th className="text-left px-5 py-3">Assigned Tech</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.userId} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="px-3 py-3.5">
                      {r.healthScore !== null && r.healthScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${statusColor[r.reportStatus ?? ''] ?? 'text-white'}`}>
                            {r.healthScore}
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(r.healthScore ?? 0) >= 80 ? 'bg-emerald-500' : (r.healthScore ?? 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, r.healthScore ?? 0)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${statusBadge[r.reportStatus ?? ''] ?? 'bg-white/5 text-slate-500 border-white/10'}`}>
                        {r.reportStatus ?? 'No report'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-slate-300 font-mono">{r.reportCount}</td>
                    <td className="px-3 py-3.5">
                      {r.scheduleEnabled ? (
                        <span className="text-emerald-400 font-medium capitalize">{r.schedule}</span>
                      ) : (
                        <span className="text-slate-600">off</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-slate-400">{dateFmt(r.lastCaptured)}</td>
                    <td className="px-5 py-3.5">
                      {r.assignedTech ? (
                        <span className="text-indigo-300 font-medium">{r.assignedTech}</span>
                      ) : (
                        <span className="text-slate-600">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
