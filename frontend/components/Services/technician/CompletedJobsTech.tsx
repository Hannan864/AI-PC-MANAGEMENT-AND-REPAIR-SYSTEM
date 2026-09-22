import React, { useState, useEffect, useMemo } from 'react';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';

export const CompletedJobsTech: React.FC = () => {
  const { session } = useAuth();
  const [completed, setCompleted] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const loadCompleted = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await repairApi.getTechnicianHistory({ per_page: 100 });
        const filtered = res.data.filter(r => r.status === RepairRequestStatus.COMPLETED);
        setCompleted(filtered);
      } catch (err) {
        console.error('Error loading completed jobs:', err);
        setError('Failed to load completed jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadCompleted();
  }, [session]);

  const retryLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await repairApi.getTechnicianHistory({ per_page: 100 });
      const filtered = res.data.filter(r => r.status === RepairRequestStatus.COMPLETED);
      setCompleted(filtered);
    } catch (err) {
      console.error('Error loading completed jobs:', err);
      setError('Failed to load completed jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let result = completed;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.gigTitle?.toLowerCase().includes(q) ||
        j.issueDescription?.toLowerCase().includes(q) ||
        j.userName?.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const da = new Date(a.updatedAt).getTime();
      const db = new Date(b.updatedAt).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
  }, [completed, searchQuery, sortOrder]);

  const stats = useMemo(() => ({
    total: completed.length,
    thisMonth: completed.filter(j => {
      const d = new Date(j.updatedAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    thisWeek: completed.filter(j => {
      const d = new Date(j.updatedAt);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      return d >= weekAgo;
    }).length,
  }), [completed]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Completed Portfolio Archive</h2>
        <p className="text-slate-400">View historically signed-off repairs, system resolutions, and SLA achievements.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 border border-white/5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
          <p className="text-rose-400 mb-3">{error}</p>
          <button onClick={retryLoad} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Retry
          </button>
        </div>
      ) : completed.length === 0 ? (
        <div className="p-12 text-center glass rounded-2xl border border-white/5 space-y-3">
           <div className="w-12 h-12 rounded-full bg-slate-800/40 text-slate-500 flex items-center justify-center mx-auto">
             {Icons.briefcase}
           </div>
           <p className="text-sm text-slate-500 font-medium">Archive empty. Completing a request moves it to this list automatically.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{Icons.search}</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by client, ticket ID, or issue..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
              />
            </div>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass p-4 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Completed</span>
              <span className="text-2xl font-bold text-white">{stats.total}</span>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">This Week</span>
              <span className="text-2xl font-bold text-emerald-400">{stats.thisWeek}</span>
            </div>
            <div className="glass p-4 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">This Month</span>
              <span className="text-2xl font-bold text-indigo-400">{stats.thisMonth}</span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center glass rounded-xl border border-white/5">
                <p className="text-sm text-slate-500">No completed jobs match your search.</p>
              </div>
            ) : (
              filteredJobs.map(job => (
                <div key={job.id} className="glass rounded-2xl p-6 border border-white/5 space-y-4 hover:border-white/10 transition-colors">
                  <div
                    className="flex items-start justify-between flex-wrap gap-4 cursor-pointer"
                    onClick={() => toggleExpand(job.id)}
                  >
                     <div className="flex-1">
                         <h3 className="text-lg font-bold text-slate-100">{job.gigTitle || 'Diagnostic Maintenance'}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                           <span className="font-mono">TICKET: {job.id.split('_')[1] || job.id.substring(0, 8)}</span>
                           <span>•</span>
                           <span>Client: {job.userName || job.user?.name || 'Unknown'}</span>
                           <span>•</span>
                           <span>Resolved {new Date(job.updatedAt).toLocaleDateString()}</span>
                        </div>
                     </div>

                     <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold tracking-widest uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                           ✓ RESOLVED
                        </span>
                        <span className="text-slate-500 text-xs">{expandedId === job.id ? '▲' : '▼'}</span>
                     </div>
                  </div>

                  {expandedId === job.id && (
                    <div className="space-y-4 border-t border-white/5 pt-4">
                      <div className="text-sm text-slate-400 bg-[#020617]/50 rounded-xl p-4 border border-white/5">
                         <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Issue Overview</span>
                         <p>{job.issueDescription}</p>
                         {job.severityLevel && (
                           <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                             ${job.severityLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                               job.severityLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                               'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}
                           `}>
                             {job.severityLevel.toUpperCase()} {job.severityScore != null ? `(${job.severityScore}/100)` : ''}
                           </span>
                         )}
                      </div>

                      {job.completionReport && (
                         <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20 space-y-3">
                           <span className="text-[10px] uppercase font-bold text-emerald-400 block">Completion Report</span>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {job.completionReport.issueSummary && (
                              <div className="col-span-2">
                                <span className="text-slate-500 block">Summary:</span>
                                <span className="text-slate-300">{job.completionReport.issueSummary}</span>
                              </div>
                            )}
                            {job.completionReport.rootCause && (
                              <div className="col-span-2">
                                <span className="text-slate-500 block">Root Cause:</span>
                                <span className="text-slate-300">{job.completionReport.rootCause}</span>
                              </div>
                            )}
                            {job.completionReport.laborCost != null && (
                              <div>
                                <span className="text-slate-500 block">Labor Cost:</span>
                                <span className="text-emerald-400 font-semibold">PKR {job.completionReport.laborCost.toLocaleString()}</span>
                              </div>
                            )}
                            {job.completionReport.timeSpentMinutes != null && (
                              <div>
                                <span className="text-slate-500 block">Time Spent:</span>
                                <span className="text-slate-300">{job.completionReport.timeSpentMinutes} min</span>
                              </div>
                            )}
                          </div>
                          {job.completionReport.workNotes && (
                            <div className="pt-2 border-t border-emerald-500/10">
                              <span className="text-slate-500 block text-xs mb-1">Work Notes:</span>
                              <p className="text-xs text-slate-300 italic">"{job.completionReport.workNotes}"</p>
                            </div>
                          )}
                          {job.completionReport.partsReplaced && job.completionReport.partsReplaced.length > 0 && (
                            <div className="pt-2 border-t border-emerald-500/10">
                              <span className="text-slate-500 block text-xs mb-1">Replaced Parts:</span>
                              <div className="space-y-1">
                                {job.completionReport.partsReplaced.map((part, i) => (
                                  <div key={i} className="flex justify-between text-xs">
                                    <span className="text-slate-300">{part.name} x{part.qty ?? part.quantity ?? 1}</span>
                                    <span className="text-emerald-400">PKR {(part.cost ?? part.price ?? 0).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                         </div>
                      )}

                      {job.technicianNote && (
                         <div className="p-3.5 bg-emerald-500/5 rounded-lg border-l-2 border-emerald-400 text-sm text-slate-300 italic">
                           <span className="block not-italic text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Final Resolution Comments:</span>
                           "{job.technicianNote}"
                         </div>
                      )}

                      {job.lifecycleEvents && job.lifecycleEvents.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Job Timeline</span>
                          <div className="space-y-2 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10 text-slate-300">
                            {job.lifecycleEvents.map((ev, i) => (
                              <div key={i} className="relative flex items-start gap-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 mt-1 z-10 shrink-0"></div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-400">{ev.status.replace(/_/g, ' ')}</span>
                                    <span className="text-[10px] text-slate-500">{new Date(ev.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                  </div>
                                  {ev.note && <div className="text-xs text-slate-400 mt-0.5">{ev.note}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
