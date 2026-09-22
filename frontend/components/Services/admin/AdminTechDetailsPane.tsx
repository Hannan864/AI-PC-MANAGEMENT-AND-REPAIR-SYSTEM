import React from 'react';
import { User } from '../../../types';
import { Icons } from '../../../constants';

interface TechStats {
  technician: User;
  activeCount: number;
  completedCount: number;
  avgHours: number;
  gigsCount: number;
}

interface AdminTechDetailsPaneProps {
  selectedTech: TechStats;
  onClear: () => void;
  onToggleStatus: (tech: User) => void;
}

export const AdminTechDetailsPane: React.FC<AdminTechDetailsPaneProps> = ({
  selectedTech,
  onClear,
  onToggleStatus
}) => {
  return (
    <div className="glass rounded-xl border border-white/15 p-5 sticky top-6 space-y-5">
      <div className="border-b border-white/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">{selectedTech.technician.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedTech.technician.email}</p>
          </div>
          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {Icons.close}
          </button>
        </div>
        
        <span className={`inline-block mt-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
          (selectedTech.technician.status || 'ACTIVE') === 'SUSPENDED'
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
        }`}>
          {selectedTech.technician.status || 'ACTIVE'}
        </span>
      </div>

      {/* Stats segments */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Performance Telemetry Audit</h4>
        
        <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-3.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Dispatch Completion Rate</span>
            <span className="font-bold text-white">
              {selectedTech.activeCount + selectedTech.completedCount > 0 
                ? `${Math.round((selectedTech.completedCount / (selectedTech.activeCount + selectedTech.completedCount)) * 100)}%` 
                : '0%'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium font-sans">Turnaround SLA Benchmark</span>
            <span className="font-bold text-sky-400">
              {selectedTech.completedCount > 0 ? `${selectedTech.avgHours} hours / request` : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Service Listings Posted</span>
            <span className="font-bold text-slate-200">{selectedTech.gigsCount} listed Gigs</span>
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <span className="text-slate-500 text-[10px] uppercase font-bold block">Internal Registry Keys</span>
          <div className="bg-[#020617]/50 rounded p-2.5 font-mono text-[10.5px] text-slate-400 break-all border border-white/5 space-y-1">
            <p>UUID: {selectedTech.technician.id}</p>
            <p>Type: Role.TECHNICIAN</p>
            <p>Since: {new Date(selectedTech.technician.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <button
          onClick={() => onToggleStatus(selectedTech.technician)}
          className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase transition-all border ${
            (selectedTech.technician.status || 'ACTIVE') === 'SUSPENDED'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
              : 'bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border-rose-500/20'
          }`}
        >
          {(selectedTech.technician.status || 'ACTIVE') === 'SUSPENDED' ? 'RE-APPROVE TECHNICIAN' : 'SUSPEND TECHNICIAN'}
        </button>
      </div>
    </div>
  );
};
