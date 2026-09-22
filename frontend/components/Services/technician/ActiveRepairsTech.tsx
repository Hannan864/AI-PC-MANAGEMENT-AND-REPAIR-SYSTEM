import React, { useState, useEffect } from 'react';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { RepairRequestStatus, ServiceCompletionReport } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';
import { ServiceCompletionModal } from './ServiceCompletionModal';

export const ActiveRepairsTech: React.FC = () => {
  const { session } = useAuth();
  const [repairs, setRepairs] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepairForCompletion, setSelectedRepairForCompletion] = useState<RepairRequestData | null>(null);

  const loadRepairs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await repairApi.list({ per_page: 50 });
      const filtered = res.data.filter(r => 
        r.status === RepairRequestStatus.IN_PROGRESS || 
        r.status === RepairRequestStatus.WAITING_PARTS ||
        r.status === RepairRequestStatus.TESTING
      );
      setRepairs(filtered);
    } catch (err) {
      console.error('Error loading active repairs:', err);
      setError('Failed to load active repairs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, [session]);

  const handleCompletionSubmit = async (report: ServiceCompletionReport, techImages: string[]) => {
    if (!selectedRepairForCompletion) return;
    const req = selectedRepairForCompletion;

    try {
      await repairApi.complete(req.id, {
        issue_summary: report.issueSummary,
        root_cause: report.rootCauseAnalysis,
        parts_replaced: report.partsReplaced.map(p => ({ name: p.name, cost: p.price, qty: p.quantity })),
        labor_cost: report.laborCost,
        work_notes: report.workNotes,
        time_spent_minutes: report.timeSpentMinutes,
      });

      setSelectedRepairForCompletion(null);
      loadRepairs();
    } catch (err) {
      console.error('Error submitting service completion:', err);
      alert('Failed to submit completion report. Please try again.');
    }
  };

  const handleAction = async (req: RepairRequestData, status: RepairRequestStatus) => {
    const note = prompt(`Enter work log comments for status change to [${status.replace('_', ' ')}]:`);
    if (note === null) return;

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
      loadRepairs();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update repair status. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case RepairRequestStatus.IN_PROGRESS:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case RepairRequestStatus.WAITING_PARTS:
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case RepairRequestStatus.TESTING:
        return 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20';
      default:
        return 'bg-slate-500/10 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Active Repairs Workshop</h2>
        <p className="text-slate-400">Track and log daily milestones for hardware assemblies, kernel repairs, and performance adjustments in progress.</p>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
            <p className="text-rose-400 mb-3">{error}</p>
            <button onClick={loadRepairs} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
              Retry
            </button>
          </div>
        ) : repairs.length === 0 ? (
          <div className="p-12 text-center glass rounded-2xl border border-white/5 space-y-3">
             <div className="w-12 h-12 rounded-full bg-slate-850/50 text-slate-500 flex items-center justify-center mx-auto">
               ✓
             </div>
             <p className="text-sm text-slate-500 font-medium">All systems normal. No active repairs require service.</p>
          </div>
        ) : (
          repairs.map(rep => (
            <div key={rep.id} className="glass rounded-2xl p-6 border border-white/5 flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
              <div className="flex-1 space-y-4 min-w-0">
                 <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-indigo-400 font-mono font-bold tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">ID: {rep.id.split('_')[1] || rep.id.substring(0, 8)}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(rep.status)}`}>
                       {rep.status.replace(/_/g, ' ')}
                    </span>
                 </div>

                 <div>
                    <h3 className="text-lg font-bold text-slate-100">{rep.gigTitle || 'Diagnostic Service Tuning'}</h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">{rep.issueDescription}</p>
                 </div>
              </div>

              <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 pt-4 lg:pt-0 lg:pl-6">
                 {rep.status !== RepairRequestStatus.IN_PROGRESS && (
                    <button 
                      onClick={() => handleAction(rep, RepairRequestStatus.IN_PROGRESS)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      Resume Assembly
                    </button>
                 )}
                 {rep.status !== RepairRequestStatus.WAITING_PARTS && (
                    <button 
                      onClick={() => handleAction(rep, RepairRequestStatus.WAITING_PARTS)}
                      className="w-full py-2 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border border-orange-500/20 rounded-lg text-xs font-semibold transition-all"
                    >
                      Hold for Spare Parts
                    </button>
                 )}
                 {rep.status !== RepairRequestStatus.TESTING && (
                    <button 
                      onClick={() => handleAction(rep, RepairRequestStatus.TESTING)}
                      className="w-full py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-400 border border-fuchsia-500/20 rounded-lg text-xs font-semibold transition-all"
                    >
                      Stress Testing
                    </button>
                 )}
                 <button 
                   onClick={() => setSelectedRepairForCompletion(rep)}
                   className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-lg active:scale-95"
                 >
                    Complete Report & Handover
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRepairForCompletion && (
        <ServiceCompletionModal
          isOpen={!!selectedRepairForCompletion}
          onClose={() => setSelectedRepairForCompletion(null)}
          onSubmit={handleCompletionSubmit}
          req={selectedRepairForCompletion as any}
        />
      )}
    </div>
  );
};
