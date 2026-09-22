import React from 'react';
import { RepairRequest, RepairRequestStatus, User } from '../../../types';
import { Icons } from '../../../constants';

interface AdminRequestDetailsPaneProps {
  selectedRequest: RepairRequest;
  onClear: () => void;
  onPriorityChange: (req: RepairRequest, newPriority: 'LOW' | 'MEDIUM' | 'HIGH') => void;
  onReassignTechnician: (req: RepairRequest, newTechId: string) => void;
  onViewSummary: (req: RepairRequest) => void;
  technicians: User[];
  requests: RepairRequest[];
}

export const AdminRequestDetailsPane: React.FC<AdminRequestDetailsPaneProps> = ({
  selectedRequest,
  onClear,
  onPriorityChange,
  onReassignTechnician,
  onViewSummary,
  technicians,
  requests
}) => {
  return (
    <div className="glass rounded-xl border border-white/15 p-5 sticky top-6 space-y-6 max-h-[750px] overflow-y-auto scrollbar-hide">
      <div className="border-b border-white/5 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-bold text-white max-w-[200px] leading-snug">{selectedRequest.gigTitle || 'Expert Diagnostics'}</h3>
            <span className="text-[10px] text-slate-500 block font-mono mt-1">UUID: {selectedRequest.id}</span>
          </div>
          <button
            onClick={onClear}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {Icons.close}
          </button>
        </div>
      </div>

      {/* Modify Fields */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">AI Routing Dispatch Overrides</h4>
        
        {/* Priority Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400">Manual Priority Level Override</label>
          <div className="grid grid-cols-3 gap-2">
            {['LOW', 'MEDIUM', 'HIGH'].map(p => {
              const active = selectedRequest.severityLevel === p || (!selectedRequest.severityLevel && p === 'MEDIUM');
              return (
                <button
                  key={p}
                  onClick={() => onPriorityChange(selectedRequest, p as any)}
                  className={`py-1.5 rounded text-[10px] font-bold border transition-all ${
                    active 
                      ? 'bg-rose-600/25 border-rose-500 text-rose-300' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Technician Override Selector */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-semibold text-slate-400 block">Override Technician Assignment</label>
          <select
            value={selectedRequest.technicianId || ''}
            onChange={(e) => onReassignTechnician(selectedRequest, e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none focus:border-rose-500/50"
          >
            <option value="" disabled>-- Choose certified mechanic --</option>
            {technicians.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.name} (Active: {requests.filter(r => r.technicianId === tech.id && r.status !== RepairRequestStatus.COMPLETED).length})
              </option>
            ))}
          </select>
          {selectedRequest.isAIOverridden && (
            <span className="text-[9.5px] font-bold text-amber-500 uppercase tracking-wider block mt-1">⚠️ Override actively engaged</span>
          )}
        </div>
      </div>

      {/* Completed Report Link */}
      {selectedRequest.status === RepairRequestStatus.COMPLETED && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#10b981] block">SLA Completed Report & Invoice</span>
          <button
            type="button"
            onClick={() => onViewSummary(selectedRequest)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            📊 Open Visual Dispatch Summary
          </button>
        </div>
      )}

      {/* Diagnostic Snapshot Preview */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Telemetry Diagnostic Snapshot</span>
        {selectedRequest.attachedDiagnostics ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>MODULE: {selectedRequest.attachedDiagnostics.sourceModule}</span>
              <span>{new Date(selectedRequest.attachedDiagnostics.createdAt).toLocaleDateString()}</span>
            </div>
            <pre className="text-[10px] leading-normal font-mono bg-slate-950 p-3 rounded-lg overflow-x-auto text-sky-400 scrollbar-hide border border-white/5 max-h-48">
              {JSON.stringify(selectedRequest.attachedDiagnostics.data || selectedRequest.attachedDiagnostics, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="p-3 bg-slate-950/40 border border-white/5 rounded-lg text-slate-500 text-[10.5px] font-medium leading-normal italic text-center">
            No hardware system telemetry package was attached to this ticket workspace.
          </div>
        )}
      </div>
    </div>
  );
};
