import React, { useState, useEffect } from 'react';
import { BuildRequestStatus } from '../../../types';
import { Icons } from '../../../constants';
import { pcBuildApi } from '../../../services/pcBuildApi';

type BackendStatus = 'draft' | 'submitted_review' | 'under_review' | 'reviewed' | 'rejected' | 'in_progress' | 'completed';

const FRONTEND_STATUS_MAP: Record<string, BuildRequestStatus> = {
  draft: BuildRequestStatus.DRAFT,
  submitted_review: BuildRequestStatus.SUBMITTED,
  under_review: BuildRequestStatus.UNDER_REVIEW,
  reviewed: BuildRequestStatus.APPROVED,
  rejected: BuildRequestStatus.REJECTED,
  in_progress: BuildRequestStatus.IN_PROGRESS,
  completed: BuildRequestStatus.COMPLETED,
};

const BACKEND_STATUS_MAP: Record<BuildRequestStatus, BackendStatus> = {
  [BuildRequestStatus.DRAFT]: 'draft',
  [BuildRequestStatus.SUBMITTED]: 'submitted_review',
  [BuildRequestStatus.UNDER_REVIEW]: 'under_review',
  [BuildRequestStatus.APPROVED]: 'reviewed',
  [BuildRequestStatus.IN_PROGRESS]: 'in_progress',
  [BuildRequestStatus.COMPLETED]: 'completed',
  [BuildRequestStatus.REJECTED]: 'rejected',
};

interface BuildRequest {
  id: string;
  buildName: string;
  createdAt: number;
  status: BuildRequestStatus;
  components: {
    cpu: string;
    gpu: string;
    motherboard: string;
    ram: string;
    storage: string;
    powerSupply: string;
    chassis?: string;
  };
  compatibilityStatus: string;
  performanceScore: number;
  estimatedCostUSD: number | null;
  estimatedCostPKR: number | null;
  userNotes: string | null;
  technicianNotes: string | null;
  issues: string[];
}

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const STATUS_PILL: Record<BuildRequestStatus, string> = {
  [BuildRequestStatus.SUBMITTED]: 'bg-indigo-500/20 text-indigo-400',
  [BuildRequestStatus.UNDER_REVIEW]: 'bg-amber-500/20 text-amber-400',
  [BuildRequestStatus.APPROVED]: 'bg-emerald-500/20 text-emerald-400',
  [BuildRequestStatus.IN_PROGRESS]: 'bg-amber-500/20 text-amber-400',
  [BuildRequestStatus.COMPLETED]: 'bg-emerald-500/20 text-emerald-400',
  [BuildRequestStatus.REJECTED]: 'bg-rose-500/20 text-rose-400',
  [BuildRequestStatus.DRAFT]: 'bg-slate-500/20 text-slate-400',
};

export const IncomingBuildRequestsTech: React.FC = () => {
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesByReq, setNotesByReq] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRequests();
  }, []);

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await pcBuildApi.list();
      const allReqs: BuildRequest[] = res.data
        .filter((b: any) => b.status !== 'draft')
        .map((b: any) => ({
          id: b.id,
          buildName: b.buildName,
          createdAt: new Date(b.createdAt).getTime(),
          status: FRONTEND_STATUS_MAP[b.status] ?? BuildRequestStatus.SUBMITTED,
          components: {
            cpu: b.cpu,
            gpu: b.gpu,
            motherboard: b.motherboard,
            ram: b.ram,
            storage: b.storage,
            powerSupply: b.powerSupply,
            chassis: b.chassis ?? undefined,
          },
          compatibilityStatus: b.compatibilityStatus.toUpperCase(),
          performanceScore: b.performanceScore,
          estimatedCostUSD: b.estimatedCostUsd,
          estimatedCostPKR: b.estimatedCostPkr,
          userNotes: b.userNotes,
          technicianNotes: b.technicianNotes,
          issues: b.issues ?? [],
        }));
      setRequests(allReqs.sort((a, c) => c.createdAt - a.createdAt));
    } catch {
      setLoadError('Could not load build requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (req: BuildRequest, status: BuildRequestStatus) => {
    setBusyId(req.id);
    try {
      const notes = notesByReq[req.id]?.trim();
      await pcBuildApi.updateStatus(req.id, BACKEND_STATUS_MAP[status], notes);
      const actionLabel = status === BuildRequestStatus.APPROVED ? 'approved'
        : status === BuildRequestStatus.REJECTED ? 'rejected — customer notified'
        : status === BuildRequestStatus.IN_PROGRESS ? 'moved to In Progress'
        : 'marked as Completed';
      showToast('success', `Build "${req.buildName}" ${actionLabel}.`);
      setNotesByReq(prev => ({ ...prev, [req.id]: '' }));
      await loadRequests();
    } catch {
      showToast('error', 'Could not update the build status. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const actionButtons = (req: BuildRequest) => {
    switch (req.status) {
      case BuildRequestStatus.SUBMITTED:
      case BuildRequestStatus.UNDER_REVIEW:
        return (
          <div className="flex flex-col gap-2">
            <textarea
              value={notesByReq[req.id] ?? ''}
              onChange={(e) => setNotesByReq(prev => ({ ...prev, [req.id]: e.target.value }))}
              placeholder="Optional feedback for the customer (recommended when rejecting)..."
              rows={2}
              className="w-full bg-[#020617] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus(req, BuildRequestStatus.APPROVED)}
                disabled={busyId === req.id}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {busyId === req.id ? 'Updating...' : 'Approve Build'}
              </button>
              <button
                onClick={() => updateStatus(req, BuildRequestStatus.REJECTED)}
                disabled={busyId === req.id}
                className="flex-1 py-2.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 border border-rose-500/30 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                Reject & Request Changes
              </button>
            </div>
          </div>
        );
      case BuildRequestStatus.APPROVED:
        return (
          <button
            onClick={() => updateStatus(req, BuildRequestStatus.IN_PROGRESS)}
            disabled={busyId === req.id}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {busyId === req.id ? 'Updating...' : 'Mark "In Progress"'}
          </button>
        );
      case BuildRequestStatus.IN_PROGRESS:
        return (
          <button
            onClick={() => updateStatus(req, BuildRequestStatus.COMPLETED)}
            disabled={busyId === req.id}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {busyId === req.id ? 'Updating...' : 'Mark Completed'}
          </button>
        );
      default:
        return (
          <div className={`w-full py-2.5 rounded-lg text-center text-sm font-semibold ${
            req.status === BuildRequestStatus.REJECTED ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-white/5 text-slate-400'
          }`}>
            {req.status === BuildRequestStatus.REJECTED ? 'Awaiting customer edits' : 'Build finished — delivered to customer'}
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Incoming Build Requests</h2>
          <p className="text-slate-400">Review custom PC build lists submitted by users. Provide feedback, approve parts, or reject mismatched systems.</p>
        </div>
        {isLoading && (
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-2 shrink-0">
            <span className="w-3 h-3 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /> Syncing...
          </span>
        )}
      </div>

      {loadError && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <button onClick={loadRequests} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {!isLoading && !loadError && requests.length === 0 && (
          <div className="text-center p-12 text-slate-500 border border-dashed border-white/10 rounded-2xl">
            No incoming build requests. Submitted builds will appear here for review.
          </div>
        )}
        {requests.map(req => (
          <div key={req.id} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col md:flex-row gap-6">
             <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                   <div>
                      <h3 className="text-xl font-bold text-white mb-1">{req.buildName}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Submitted {new Date(req.createdAt).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${STATUS_PILL[req.status]}`}>
                          {req.status === BuildRequestStatus.SUBMITTED ? 'Under Review' : req.status}
                        </span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 bg-[#020617]/50 rounded-xl p-4 border border-white/5 text-sm">
                   <div><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Processor</span> <span className="text-slate-200">{req.components.cpu}</span></div>
                   <div><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Graphics</span> <span className="text-slate-200">{req.components.gpu}</span></div>
                   <div><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Motherboard</span> <span className="text-slate-200">{req.components.motherboard}</span></div>
                   <div><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Memory</span> <span className="text-slate-200">{req.components.ram}</span></div>
                   <div><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Storage</span> <span className="text-slate-200">{req.components.storage}</span></div>
                   <div><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Power Supply</span> <span className="text-slate-200">{req.components.powerSupply}</span></div>
                   {req.components.chassis && (
                     <div className="col-span-2 lg:col-span-3"><span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Chassis / Case</span> <span className="text-slate-200">{req.components.chassis}</span></div>
                   )}
                </div>

                {req.userNotes && (
                   <div className="text-sm p-4 border-l-2 border-indigo-500 bg-indigo-500/5 text-slate-300 italic">
                     "{req.userNotes}"
                   </div>
                )}

                {req.issues && req.issues.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-rose-400">Engine Verification Flags</span>
                    {req.issues.slice(0, 4).map((iss, i) => (
                      <span key={i} className="block leading-relaxed">• {iss}</span>
                    ))}
                  </div>
                )}
             </div>

             <div className="w-full md:w-72 shrink-0 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                   <div className="bg-[#020617]/80 p-4 rounded-xl border border-white/5 space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">System Compatibility</span>
                        <div className={`mt-1 text-sm font-bold ${req.compatibilityStatus === 'PASS' ? 'text-emerald-400' : req.compatibilityStatus === 'WARNING' ? 'text-amber-400' : 'text-rose-400'}`}>
                           {req.compatibilityStatus}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Performance Score</span>
                        <div className={`mt-1 text-xl font-bold ${req.performanceScore >= 80 ? 'text-emerald-400' : req.performanceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                           {req.performanceScore}/100
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Cost Estimate</span>
                        <div className="mt-1 text-xl font-bold text-slate-200">
                           {req.estimatedCostPKR ? `Rs. ${req.estimatedCostPKR.toLocaleString()}` : `$${req.estimatedCostUSD ?? 0}`}
                        </div>
                      </div>
                   </div>

                   {req.technicianNotes && (
                     <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-200 text-xs">
                       <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Your Feedback</span>
                       <span className="leading-relaxed">"{req.technicianNotes}"</span>
                     </div>
                   )}
                </div>

                <div className="flex flex-col gap-2">
                   {actionButtons(req)}
                </div>
             </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-400/30 text-white' : 'bg-rose-600/95 border-rose-400/30 text-white'}`}>
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? Icons.check : Icons.x}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
