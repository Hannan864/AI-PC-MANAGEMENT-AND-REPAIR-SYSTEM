import React from 'react';
import { PCBuild, BuildRequestStatus } from '../../../types';
import { Icons } from '../../../constants';

interface BuildCardProps {
  build: PCBuild;
  onDelete: (id: string) => void;
  onSendForReview: (build: PCBuild) => void;
  onEdit: (build: PCBuild) => void;
}

const STATUS_META: Record<BuildRequestStatus, { label: string; classes: string; dot: string }> = {
  [BuildRequestStatus.DRAFT]: { label: 'Draft', classes: 'bg-slate-500/15 text-slate-400 border-slate-500/30', dot: 'bg-slate-400' },
  [BuildRequestStatus.SUBMITTED]: { label: 'Under Review', classes: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', dot: 'bg-indigo-400' },
  [BuildRequestStatus.UNDER_REVIEW]: { label: 'Under Review', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  [BuildRequestStatus.APPROVED]: { label: 'Tech Approved', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  [BuildRequestStatus.IN_PROGRESS]: { label: 'Building Now', classes: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  [BuildRequestStatus.COMPLETED]: { label: 'Completed', classes: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  [BuildRequestStatus.REJECTED]: { label: 'Changes Requested', classes: 'bg-rose-500/15 text-rose-400 border-rose-500/30', dot: 'bg-rose-400' },
};

export const BuildCard: React.FC<BuildCardProps> = ({ build: b, onDelete, onSendForReview, onEdit }) => {
  const status = b.status ?? BuildRequestStatus.DRAFT;
  const statusMeta = STATUS_META[status] ?? STATUS_META[BuildRequestStatus.DRAFT];
  const isDraft = status === BuildRequestStatus.DRAFT;

  return (
    <div key={b.buildId} className="glass p-5 rounded-2xl border border-white/5 flex flex-col group relative overflow-hidden">
       <div className="absolute top-4 right-4 flex md:opacity-0 md:group-hover:opacity-100 transition-opacity gap-2 z-10">
          {isDraft && (
            <button onClick={() => onEdit(b)} className="w-8 h-8 flex items-center justify-center bg-white/5 text-slate-300 hover:bg-white/15 rounded-lg backdrop-blur-md transition-colors" aria-label="Edit build" title="Edit build">
              {Icons.settings}
            </button>
          )}
          {isDraft && (
            <button onClick={() => onDelete(b.buildId)} className="w-8 h-8 flex items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 rounded-lg backdrop-blur-md transition-colors" aria-label="Delete build" title="Delete build">
              {Icons.trash}
            </button>
          )}
       </div>

       <div className="mb-4 pr-10">
          <h4 className="text-lg font-bold text-white mb-1 truncate">{b.buildName}</h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[10px] text-slate-500 tracking-wider uppercase">{new Date(b.createdAt).toLocaleDateString()}</span>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-widest uppercase ${statusMeta.classes}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
            <div className="flex gap-1.5 items-center">
              <span className={`w-2 h-2 rounded-full ${b.compatibilityStatus === 'PASS' ? 'bg-emerald-500' : b.compatibilityStatus === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{b.compatibilityStatus}</span>
            </div>
            {b.performanceScore !== undefined && (
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-500/20">
                Score: {b.performanceScore}/100
              </span>
            )}
          </div>
       </div>

       <div className="grid grid-cols-2 gap-3 text-xs bg-[#020617]/50 rounded-xl p-4 border border-white/5 shrink-0 flex-1">
          <div><span className="block text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Processor</span> <span className="text-slate-200 line-clamp-1" title={b.cpu}>{b.cpu}</span></div>
          <div><span className="block text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Graphics</span> <span className="text-slate-200 line-clamp-1" title={b.gpu}>{b.gpu}</span></div>
          <div><span className="block text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Motherboard</span> <span className="text-slate-200 line-clamp-1" title={b.motherboard}>{b.motherboard}</span></div>
          <div><span className="block text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Memory</span> <span className="text-slate-200 line-clamp-1" title={b.ram}>{b.ram}</span></div>
          {b.case && <div className="col-span-2 border-t border-white/5 pt-2 mt-1"><span className="block text-[10px] text-slate-500 mb-0.5 font-bold uppercase tracking-wider">Chassis / Case</span> <span className="text-slate-200 line-clamp-1" title={b.case}>{b.case}</span></div>}
       </div>

       {b.issues && b.issues.length > 0 && status === BuildRequestStatus.REJECTED && (
         <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs space-y-1.5">
           <span className="block text-[10px] font-bold uppercase tracking-widest text-rose-400">Verification Notes</span>
           {b.issues.slice(0, 3).map((iss, i) => (
             <span key={i} className="block leading-relaxed">• {iss}</span>
           ))}
         </div>
       )}

       {b.technicianNotes && (
         <div className="mt-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-200 text-xs">
           <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Technician Feedback</span>
           <span className="leading-relaxed">"{b.technicianNotes}"</span>
         </div>
       )}

       <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Estimated Cost</span>
            <span className="text-base font-bold text-emerald-400">Rs. {(b.estimatedCostPKR || 0).toLocaleString()}</span>
            {b.estimatedCostUSD ? (
              <span className="text-[10px] text-slate-500 font-mono">≈ ${b.estimatedCostUSD.toLocaleString()}</span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {status === BuildRequestStatus.DRAFT && (
              <button onClick={() => onSendForReview(b)} className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 rounded-lg text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-colors">
                Send to Tech
              </button>
            )}
            {status === BuildRequestStatus.REJECTED && (
              <button onClick={() => onEdit(b)} className="px-4 py-2 bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 border border-rose-500/30 rounded-lg text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-colors">
                Edit & Resubmit
              </button>
            )}
            {![BuildRequestStatus.DRAFT, BuildRequestStatus.REJECTED].includes(status) && (
              <button disabled className="px-4 py-2 bg-white/5 text-slate-400 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-default">
                {status === BuildRequestStatus.IN_PROGRESS ? 'Building Now' : status === BuildRequestStatus.COMPLETED ? 'Build Delivered' : status === BuildRequestStatus.APPROVED ? 'Tech Approved' : 'Pending Tech'}
              </button>
            )}
          </div>
       </div>
    </div>
  );
};
