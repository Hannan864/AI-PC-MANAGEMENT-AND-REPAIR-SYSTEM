import React from 'react';
import { RepairRequest, RepairRequestStatus, User } from '../../../types';

interface AdminRequestRowProps {
  req: RepairRequest;
  isSelected: boolean;
  assignedTech?: User;
  onSelect: () => void;
}

export const AdminRequestRow: React.FC<AdminRequestRowProps> = ({
  req,
  isSelected,
  assignedTech,
  onSelect
}) => {
  const rPriority = req.severityLevel || 'MEDIUM';

  return (
    <div
      onClick={onSelect}
      className={`glass p-5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row gap-5 justify-between items-start md:items-center ${
        isSelected 
          ? 'bg-rose-500/5 border-rose-500/30' 
          : 'border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          <span className="font-mono text-indigo-400 font-bold tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
            ID: {req.id.split('_')[1] || req.id.substring(0, 8)}
          </span>
          
          <span className={`px-2 py-0.5 rounded font-extrabold uppercase tracking-widest ${
            rPriority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
            rPriority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {rPriority}
          </span>

          <span className="text-slate-500 font-medium">Logged {new Date(req.createdAt).toLocaleDateString()}</span>
        </div>

        <div>
          <h3 className="font-bold text-slate-100 text-sm">{req.gigTitle || 'Diagnostics Service Request'}</h3>
          <p className="text-xs text-slate-400 leading-normal truncate mt-0.5">{req.issueDescription}</p>
        </div>

        {/* Display Client & Tech info */}
        <div className="flex items-center gap-4 text-[10.5px] font-semibold text-slate-400">
          <span>Client: <strong className="text-slate-300">{req.userName}</strong></span>
          <span>•</span>
          <span>Routing: <strong className="text-indigo-400">{req.issueCategory || 'General Diagnostics'}</strong></span>
          <span>•</span>
          <span>Assignee: <strong className="text-amber-400">{assignedTech?.name || 'Unassigned Auto-routing Queue'}</strong></span>
        </div>
      </div>

      <div className="shrink-0 flex items-center md:flex-col gap-2.5 w-full md:w-auto mt-3 md:mt-0 border-t md:border-0 border-white/5 pt-3 md:pt-0 justify-between">
        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold tracking-widest uppercase ${
          req.status === RepairRequestStatus.COMPLETED ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
          req.status === RepairRequestStatus.CANCELLED ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25' :
          'bg-sky-500/15 text-sky-400 border border-sky-500/20'
        }`}>
          {req.status.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
};
