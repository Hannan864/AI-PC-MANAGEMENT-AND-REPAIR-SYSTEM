import React, { useState, useEffect } from 'react';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';

export const IncomingRequestsTech = () => {
  const { session, user } = useAuth();
  const [requests, setRequests] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'active'>('all');

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assignedRes, unassignedRes] = await Promise.all([
        repairApi.list({ per_page: 50 }),
        repairApi.getUnassigned({ per_page: 50 }),
      ]);

      const assigned = assignedRes.data.filter(r =>
        r.status !== RepairRequestStatus.COMPLETED &&
        r.status !== RepairRequestStatus.CANCELLED
      );

      const incoming = unassignedRes.data;

      const merged = [...incoming, ...assigned.filter(a => !incoming.some(u => u.id === a.id))];
      setRequests(merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [session]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (req: RepairRequestData, status: RepairRequestStatus) => {
    let note = '';
    if (['WAITING_PARTS', 'TESTING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const msg = prompt(`Add an optional note for this state update (${status}):`);
      if (msg !== null) note = msg;
    }

    try {
      if (status === RepairRequestStatus.COMPLETED) {
        await repairApi.complete(req.id, {
          issue_summary: req.issueDescription.substring(0, 100),
          root_cause: note || 'Repair completed',
          labor_cost: 0,
          time_spent_minutes: 1,
          work_notes: note,
        });
      } else {
        await repairApi.updateStatus(req.id, status, note || undefined);
      }
      showToast('success', `Job marked as ${status.replace(/_/g, ' ').toLowerCase()}`);
      loadRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('error', 'Failed to update status. Please try again.');
    }
  };

  const isUnassigned = (req: RepairRequestData) => !req.technicianId;
  const filteredRequests = filter === 'incoming'
    ? requests.filter(isUnassigned)
    : filter === 'active'
      ? requests.filter(r => !isUnassigned(r))
      : requests;

  const requestAge = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Active Jobs & Incoming Requests</h2>
          <p className="text-slate-400">Manage your active pipeline and track job lifecycles.</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'incoming', 'active'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              {f === 'all' ? 'All' : f === 'incoming' ? `Incoming (${requests.filter(isUnassigned).length})` : `My Jobs (${requests.filter(r => !isUnassigned(r)).length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
           <div className="space-y-4">
             {[...Array(3)].map((_, i) => (
               <div key={i} className="glass rounded-xl p-5 border border-white/5 animate-pulse">
                 <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-xl bg-white/10"></div>
                   <div className="flex-1 space-y-3">
                     <div className="h-4 bg-white/10 rounded w-1/3"></div>
                     <div className="h-3 bg-white/10 rounded w-2/3"></div>
                     <div className="h-20 bg-white/10 rounded"></div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        ) : error ? (
           <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
             <p className="text-rose-400 mb-3">{error}</p>
             <button onClick={loadRequests} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
               Retry
             </button>
           </div>
        ) : filteredRequests.length === 0 ? (
           <div className="p-12 text-center glass rounded-xl border border-white/5">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
                {Icons.bell}
             </div>
             <h3 className="text-lg font-semibold text-white mb-1">No {filter === 'incoming' ? 'Incoming' : filter === 'active' ? 'Active' : ''} Jobs</h3>
             <p className="text-slate-500">Your queue from the marketplace is currently clear.</p>
           </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className={`glass rounded-xl p-5 border flex flex-col md:flex-row gap-6 items-start md:items-center ${isUnassigned(req) ? 'border-amber-500/20 bg-amber-500/5' : 'border-indigo-500/20 bg-indigo-500/5'}`}>
               <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                 {(req.userName || req.user?.name || '?').charAt(0).toUpperCase()}
               </div>

               <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                     <h3 className="text-lg font-semibold text-white tracking-tight">
                        {req.gigTitle || `Auto-Routed: ${req.issueCategory || 'General Issue'}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isUnassigned(req) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            UNASSIGNED
                          </span>
                        )}
                        <span className="text-sm font-medium text-slate-400">{req.userName || req.user?.name || 'Unknown'}</span>
                      </div>
                  </div>

                  {req.severityLevel && (
                     <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border
                          ${req.severityLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                            req.severityLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}
                        `}>
                          {req.severityLevel.toUpperCase()} PRIORITY {req.severityScore != null ? `(${req.severityScore}/100)` : ''}
                        </span>
                        {req.issueCategory && (
                           <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/30">
                             {req.issueCategory}
                           </span>
                        )}
                     </div>
                  )}

                  <div className="bg-[#020617]/50 rounded-lg p-3 border border-white/5 my-3 text-sm text-slate-300 relative space-y-2">
                     <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${req.attachedDiagnostics ? 'bg-indigo-500' : 'bg-slate-500'}`}></div>
                     <p>{req.issueDescription}</p>
                     {req.attachedDiagnostics && (
                       <div className="mt-3 pt-3 border-t border-white/5">
                         <div className="flex items-center text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></span>
                           Attached: {req.attachedDiagnostics.sourceModule} Snapshot
                         </div>
                         <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto p-2 bg-black/40 rounded border border-white/5 whitespace-pre-wrap max-h-32">
                           {JSON.stringify(req.attachedDiagnostics.data, null, 2)}
                         </pre>
                       </div>
                     )}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-4">
                      <span className="font-mono">ID: {req.id.split('_')[1] || req.id.substring(0, 8)}</span>
                     <span>Booked: {new Date(req.createdAt).toLocaleString()}</span>
                     <span>Age: {requestAge(req.createdAt)}</span>
                  </div>

                  {req.lifecycleEvents && req.lifecycleEvents.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Job Timeline</div>
                        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-white/10 text-slate-300">
                          {req.lifecycleEvents.slice(-3).map((ev, i) => (
                             <div key={i} className="relative flex items-start gap-3">
                               <div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900 mt-1 z-10 shrink-0"></div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-bold text-indigo-400">{ev.status.replace(/_/g, ' ')}</span>
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

               <div className="flex flex-col gap-2 min-w-[140px] w-full md:w-auto mt-4 md:mt-0 relative">
                  {(req.status === RepairRequestStatus.SUBMITTED || isUnassigned(req)) && (
                     <>
                        <button
                          onClick={() => handleAction(req, RepairRequestStatus.ACCEPTED)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20"
                        >
                          {isUnassigned(req) ? 'Assign To Me' : 'Accept Job'}
                        </button>
                        <button
                          onClick={() => handleAction(req, RepairRequestStatus.CANCELLED)}
                          className="px-4 py-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 border border-white/10 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                        >
                          Decline
                        </button>
                     </>
                  )}

                  {[RepairRequestStatus.ACCEPTED, RepairRequestStatus.TECHNICIAN_ASSIGNED, RepairRequestStatus.WAITING_PARTS, RepairRequestStatus.TESTING].includes(req.status as RepairRequestStatus) && (
                     <button
                       onClick={() => handleAction(req, RepairRequestStatus.IN_PROGRESS)}
                       className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/20"
                     >
                       {req.status === RepairRequestStatus.ACCEPTED || req.status === RepairRequestStatus.TECHNICIAN_ASSIGNED ? 'Start Job' : 'Resume Work'}
                     </button>
                  )}

                  {req.status === RepairRequestStatus.IN_PROGRESS && (
                     <>
                        <button
                          onClick={() => handleAction(req, RepairRequestStatus.WAITING_PARTS)}
                          className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-medium transition-colors text-center"
                        >
                          Wait for Parts
                        </button>
                        <button
                          onClick={() => handleAction(req, RepairRequestStatus.TESTING)}
                          className="px-4 py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-400 border border-fuchsia-500/30 rounded-lg text-sm font-medium transition-colors text-center"
                        >
                          Begin Testing
                        </button>
                        <button
                          onClick={() => handleAction(req, RepairRequestStatus.COMPLETED)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20"
                        >
                          Mark Completed
                        </button>
                     </>
                  )}
               </div>
            </div>
          ))
        )}
      </div>

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
