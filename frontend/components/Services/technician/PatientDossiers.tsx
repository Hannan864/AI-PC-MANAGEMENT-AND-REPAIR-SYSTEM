import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Icons } from '../../../constants';
import { PatientDossier, ReportSummary, SystemReport } from '../../../types';
import { systemReportApi } from '../../../services/systemReportApi';
import { DossierChart } from '../common/DossierChart';

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

const typeMeta: Record<string, { label: string; cls: string }> = {
  daily:   { label: 'Daily',   cls: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  weekly:  { label: 'Weekly',  cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  monthly: { label: 'Monthly', cls: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  manual:  { label: 'Manual',  cls: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
};

const typeLabel = (t?: string | null): string =>
  typeMeta[t ?? '']?.label ?? (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Manual');

const dateFmt = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

const dateTimeFmt = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const healthColor = (h: number | null | undefined): string => {
  if (h === null || h === undefined) return 'text-slate-500';
  return h >= 80 ? 'text-emerald-400' : h >= 60 ? 'text-amber-400' : 'text-rose-400';
};

const healthRing = (h: number | null | undefined): string => {
  if (h === null || h === undefined) return 'text-slate-500 border-white/10';
  return h >= 80 ? 'text-emerald-400 border-emerald-500/40' : h >= 60 ? 'text-amber-400 border-amber-500/40' : 'text-rose-400 border-rose-500/40';
};

const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: string; accent?: string }> = ({ label, value, sub, accent = 'text-white' }) => (
  <div className="glass rounded-xl border border-white/5 px-4 py-3">
    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">{label}</span>
    <span className={`text-lg font-bold tracking-tight ${accent}`}>{value}</span>
    {sub && <span className="block text-[10px] text-slate-600 mt-0.5">{sub}</span>}
  </div>
);

/**
 * Received Reports — technician database view.
 *
 * A master-detail "PC medical database": the left rail lists every customer
 * whose system reports were delivered to this technician (plus customers with
 * an active assigned job); selecting one opens their full report history —
 * every daily / weekly / monthly / manual snapshot they sent — as an
 * inspectable table. Clicking a row loads that report's full medical chart.
 */
export const PatientDossiers: React.FC = () => {
  const [patients, setPatients] = useState<PatientDossier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recent' | 'name' | 'health'>('recent');
  const [filter, setFilter] = useState<'all' | string>('all');

  // Full-report viewer state. Full charts are fetched on demand and cached.
  const [viewing, setViewing] = useState<SystemReport | null>(null);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const reportCache = useRef(new Map<string, SystemReport>());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemReportApi.technicianPatients();
      setPatients(data);
      // The latest report is already fully included — seed the cache with it
      // so opening it later is instant.
      data.forEach(p => {
        if (p.latestReport) reportCache.current.set(p.latestReport.id, p.latestReport);
      });
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load received reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-select the first customer once the list arrives.
  useEffect(() => {
    if (patients.length > 0 && !selectedId) setSelectedId(patients[0].userId);
  }, [patients, selectedId]);

  const selected = patients.find(p => p.userId === selectedId) ?? null;

  const openReport = useCallback(async (summary: ReportSummary) => {
    const cached = reportCache.current.get(summary.id);
    if (cached) {
      setReportError(null);
      setViewing(cached);
      return;
    }
    setFetchingId(summary.id);
    setViewing(null);
    setReportError(null);
    try {
      const full = await systemReportApi.technicianShow(summary.id);
      reportCache.current.set(summary.id, full);
      setViewing(full);
    } catch (err) {
      console.error('Error loading report:', err);
      setReportError('Failed to load this report. Please try again.');
    } finally {
      setFetchingId(null);
    }
  }, []);

  const selectCustomer = useCallback((id: string) => {
    setSelectedId(id);
    setFilter('all');
    setViewing(null);
    setReportError(null);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = patients.filter(
      p => !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'health') return (b.healthScore ?? -1) - (a.healthScore ?? -1);
      const ta = a.lastCaptured ? new Date(a.lastCaptured).getTime() : 0;
      const tb = b.lastCaptured ? new Date(b.lastCaptured).getTime() : 0;
      return tb - ta;
    });
  }, [patients, query, sort]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    selected?.reports.forEach(r => {
      counts[r.reportType] = (counts[r.reportType] ?? 0) + 1;
    });
    return counts;
  }, [selected]);

  const filteredReports = useMemo(
    () => (filter === 'all' ? (selected?.reports ?? []) : (selected?.reports ?? []).filter(r => r.reportType === filter)),
    [selected, filter]
  );

  const FILTERS = ['all', 'daily', 'weekly', 'monthly', 'manual'] as const;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Received Reports</h2>
        <p className="text-slate-400">
          A live database of every system snapshot your customers sent you — daily, weekly and monthly — ready to inspect.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4">
          <div className="glass rounded-2xl border border-white/5 p-4 space-y-3 animate-pulse h-72">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg" />
            ))}
          </div>
          <div className="glass rounded-2xl border border-white/5 p-6 space-y-4 animate-pulse h-72">
            <div className="h-6 bg-white/5 rounded w-1/3" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
            <div className="h-40 bg-white/5 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <div className="p-12 text-center glass rounded-2xl border border-rose-500/20">
          <p className="text-rose-400 mb-3">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 lg:h-[calc(100vh-13rem)]">
          {/* ── Master rail: customers ─────────────────────────────── */}
          <aside className="glass rounded-2xl border border-white/10 flex flex-col overflow-hidden min-h-[320px]">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-rose-400">{Icons.database}</span>
                <span className="text-sm font-semibold text-white tracking-tight">Customers</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 tabular-nums">
                {patients.length}
              </span>
            </div>

            <div className="px-3 pt-3 space-y-2 shrink-0">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{Icons.search}</span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search name or email…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 focus:border-rose-400/50 focus:outline-none text-sm text-white placeholder-slate-500 transition-colors"
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value as typeof sort)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 focus:border-rose-400/50 focus:outline-none text-xs text-slate-300 transition-colors"
              >
                <option value="recent" className="bg-slate-900">Sort: Most Recent</option>
                <option value="name" className="bg-slate-900">Sort: Name (A–Z)</option>
                <option value="health" className="bg-slate-900">Sort: Health Score</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-slate-500">
                    {patients.length === 0 ? 'No reports received yet.' : 'No customers match your search.'}
                  </p>
                </div>
              ) : (
                filtered.map(p => {
                  const active = p.userId === selectedId;
                  return (
                    <button
                      key={p.userId}
                      onClick={() => selectCustomer(p.userId)}
                      className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-3 text-left transition-all border ${
                        active
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : 'border-transparent hover:bg-white/[0.04] hover:border-white/5'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center font-bold text-white">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        {p.job && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500/90 border-2 border-slate-900 flex items-center justify-center text-[8px] text-slate-900">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-white truncate">{p.name}</span>
                          {p.reportStatus && (
                            <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${p.reportStatus === 'HEALTHY' ? 'bg-emerald-400' : p.reportStatus === 'WARNING' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{p.email}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5 tabular-nums">
                          {p.reportCount} report{p.reportCount === 1 ? '' : 's'} · last {dateFmt(p.lastCaptured)}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-bold tabular-nums ${healthColor(p.healthScore)}`}>
                        {p.healthScore ?? '—'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── Detail pane ────────────────────────────────────────── */}
          <main className="glass rounded-2xl border border-white/10 overflow-y-auto scrollbar-hide min-h-[320px] relative">
            {!selected ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 mb-4">
                  {Icons.database}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">Select a customer</h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  Choose a customer from the list to inspect their full report history — every daily, weekly and monthly snapshot they sent you.
                </p>
              </div>
            ) : viewing ? (
              /* ── Full report chart ─────────────────────────────── */
              <div className="p-5 md:p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setViewing(null); setReportError(null); }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    {selected.name}
                  </button>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs font-medium text-slate-300 truncate">{viewing.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${typeMeta[viewing.reportType]?.cls ?? typeMeta.manual.cls}`}>
                    {typeLabel(viewing.reportType)}
                  </span>
                  <span className="text-[11px] text-slate-500 tabular-nums">{dateTimeFmt(viewing.createdAt)}</span>
                </div>

                <DossierChart report={viewing} />
              </div>
            ) : (
              /* ── Customer overview + report history table ──────── */
              <div className="p-5 md:p-6 space-y-5">
                {/* Inline fetch error — keeps the user on the history view */}
                {reportError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm text-rose-300">{reportError}</span>
                    <button
                      onClick={() => setReportError(null)}
                      className="text-[11px] font-bold uppercase tracking-widest text-rose-400/80 hover:text-rose-300 transition-colors shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/30 to-indigo-500/30 border border-white/10 flex items-center justify-center font-bold text-xl text-white shrink-0">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl font-bold text-white tracking-tight">{selected.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${statusBadge[selected.reportStatus ?? ''] ?? 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {selected.reportStatus ?? 'NO REPORTS'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">{selected.email}</p>
                      <p className="text-[11px] text-slate-600 font-mono mt-0.5">CUST-{selected.userId.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-lg font-bold tabular-nums shrink-0 ${healthRing(selected.healthScore)}`}>
                    {selected.healthScore ?? '—'}
                  </div>
                </div>

                {/* Active job banner */}
                {selected.job && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4 flex flex-wrap items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      {Icons.briefcase}
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-400 block">Active Repair Job</span>
                      <span className="text-sm font-medium text-white">{selected.job.gigTitle}</span>
                    </div>
                    <p className="text-xs text-slate-400 flex-1 min-w-[180px]">{selected.job.issue}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                      {selected.job.status}
                    </span>
                  </div>
                )}

                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <Stat label="Total Reports" value={selected.reports.length} sub="received by you" />
                  <Stat label="Daily" value={typeCounts.daily ?? 0} accent={typeCounts.daily ? 'text-sky-400' : 'text-slate-600'} />
                  <Stat label="Weekly" value={typeCounts.weekly ?? 0} accent={typeCounts.weekly ? 'text-indigo-400' : 'text-slate-600'} />
                  <Stat label="Monthly" value={typeCounts.monthly ?? 0} accent={typeCounts.monthly ? 'text-violet-400' : 'text-slate-600'} />
                  <Stat label="Last Captured" value={dateFmt(selected.lastCaptured)} accent="text-slate-200" />
                </div>

                {/* History toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Report History</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 tabular-nums">
                      {filteredReports.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {FILTERS.map(f => {
                      const count = f === 'all' ? selected.reports.length : (typeCounts[f] ?? 0);
                      const active = filter === f;
                      return (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          disabled={count === 0}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                            active
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                              : count === 0
                                ? 'text-slate-700 border-white/5 cursor-not-allowed'
                                : 'text-slate-400 border-white/10 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          {f === 'all' ? 'All' : typeLabel(f)} · {count}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* History table */}
                {filteredReports.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-rose-400">
                      {Icons.heart}
                    </div>
                    <h4 className="text-base font-semibold text-white mb-1">
                      {selected.reports.length === 0 ? 'No Reports Received' : 'No Reports of This Type'}
                    </h4>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      {selected.reports.length === 0
                        ? 'This customer has an assigned job but hasn\u2019t sent you a report yet. Ask them to open My System Report and press Capture & Send.'
                        : 'None of this customer\u2019s reports match the selected type.'}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/5 overflow-hidden">
                    {/* Column headers */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      <span className="w-[76px] shrink-0">Type</span>
                      <span className="flex-1 min-w-0">Report</span>
                      <span className="hidden md:block w-[150px] shrink-0 text-right">Captured</span>
                      <span className="w-[56px] shrink-0 text-right">Health</span>
                      <span className="w-[88px] shrink-0 text-right">Status</span>
                      <span className="w-4 shrink-0" />
                    </div>

                    {filteredReports.map((r, i) => {
                      const fetching = fetchingId === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => openReport(r)}
                          disabled={fetching}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all group border-b border-white/5 last:border-b-0 ${
                            i % 2 === 0 ? 'bg-white/[0.01]' : 'bg-transparent'
                          } hover:bg-rose-500/[0.06] disabled:opacity-60`}
                        >
                          <span className={`w-[76px] shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border text-center ${typeMeta[r.reportType]?.cls ?? typeMeta.manual.cls}`}>
                            {typeLabel(r.reportType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-white truncate group-hover:text-rose-200 transition-colors">{r.title}</span>
                            <span className="block text-[10px] text-slate-600 font-mono truncate">REP-{r.id.substring(0, 8).toUpperCase()}</span>
                          </div>
                          <span className="hidden md:block w-[150px] shrink-0 text-right text-xs text-slate-500 tabular-nums">
                            {dateTimeFmt(r.createdAt)}
                          </span>
                          <span className={`w-[56px] shrink-0 text-right text-sm font-bold tabular-nums ${healthColor(r.healthScore)}`}>
                            {r.healthScore ?? '—'}
                          </span>
                          <span className={`w-[88px] shrink-0 text-right px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border inline-block ${statusBadge[r.status ?? ''] ?? 'bg-white/5 text-slate-500 border-white/10'}`}>
                            {r.status ?? '—'}
                          </span>
                          <span className="w-4 shrink-0 text-slate-600 group-hover:text-rose-400 transition-colors">
                            {fetching ? (
                              <span className="block w-3.5 h-3.5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};
