import React from 'react';
import { RepairRequestData } from '../../../services/repairApi';
import { Icons } from '../../../constants';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RepairRequestData | null;
  onCancel?: (id: string) => Promise<boolean> | void;
  isCancelling?: boolean;
}

const getStatusColor = (status: string) => {
  const s = status.toUpperCase();
  switch (s) {
    case 'SUBMITTED': return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', label: 'Pending' };
    case 'AI_TRIAGED': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'AI Triaged' };
    case 'GIG_SELECTED': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Gig Selected' };
    case 'TECHNICIAN_ASSIGNED': return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30', label: 'Technician Assigned' };
    case 'ACCEPTED': return { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30', label: 'Accepted' };
    case 'IN_PROGRESS': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'In Progress' };
    case 'WAITING_PARTS': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', label: 'Waiting Parts' };
    case 'TESTING': return { bg: 'bg-fuchsia-500/20', text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', label: 'Testing' };
    case 'COMPLETED': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Completed' };
    case 'CANCELLED': return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Cancelled' };
    case 'INFO_REQUESTED': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Action Needed' };
    case 'PROPOSED_ALTERNATIVE': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30', label: 'Alternative Proposed' };
    default: return { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30', label: status };
  }
};

const getSeverityInfo = (level?: string) => {
  switch (level?.toLowerCase()) {
    case 'high': return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: '🔴' };
    case 'medium': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: '🟡' };
    case 'low': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '🟢' };
    default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: '⚪' };
  }
};

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  onCancel,
  isCancelling = false,
}) => {
  if (!isOpen || !request) return null;

  const statusInfo = getStatusColor(request.status);
  const severityInfo = getSeverityInfo(request.severityLevel);
  const canCancel = request.status.toUpperCase() === 'SUBMITTED';
  const canRequestInfo = request.status.toUpperCase() === 'TECHNICIAN_ASSIGNED' || 
                         request.status.toUpperCase() === 'ACCEPTED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/5 bg-slate-900/40 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400">{Icons.clipboard}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Repair Request Details</span>
              <h3 className="text-lg font-bold text-white leading-none mt-1">
                {request.gigTitle || `Auto-Routed: ${request.issueCategory || 'General Issue'}`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          
          {/* Status & Priority Row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
            {request.severityLevel && (
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${severityInfo.bg} ${severityInfo.color} ${severityInfo.border}`}>
                {severityInfo.icon} {request.severityLevel.toUpperCase()} PRIORITY
                {request.severityScore != null && <span className="ml-1 opacity-70">({request.severityScore}/100)</span>}
              </span>
            )}
            {request.attachedDiagnostics && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                📊 Diagnostic Attached
              </span>
            )}
            {request.isAIOverridden && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                🤖 AI Overridden
              </span>
            )}
          </div>

          {/* Request ID & Dates */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Request ID</span>
              <p className="text-sm font-mono text-white font-bold">...{request.id.substring(request.id.length - 8)}</p>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Submitted</span>
              <p className="text-sm text-white font-medium">
                {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Last Updated</span>
              <p className="text-sm text-white font-medium">
                {new Date(request.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {new Date(request.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Category</span>
              <p className="text-sm text-white font-medium">{request.issueCategory || 'General'}</p>
            </div>
          </div>

          {/* Issue Description */}
          <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5">
            <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Issue Description
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">{request.issueDescription}</p>
          </div>

          {/* Technician Notes (if any) */}
          {request.technicianNote && (
            <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-blue-400 mb-2 flex items-center gap-2">
                <span className="text-sm">👨‍🔧</span>
                Technician Update
                {request.technicianDecision && (
                  <span className="text-[10px] text-blue-500/70">({request.technicianDecision.replace(/_/g, ' ')})</span>
                )}
              </h4>
              <p className="text-sm text-slate-300">{request.technicianNote}</p>
            </div>
          )}

          {/* System Specifications (if any) */}
          {request.systemSpecifications && Object.keys(request.systemSpecifications).length > 0 && (
            <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="text-sm">💻</span>
                System Specifications
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(request.systemSpecifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 px-2 bg-slate-950/50 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Images (if any) */}
          {request.userImages && request.userImages.length > 0 && (
            <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <span className="text-sm">📷</span>
                Attached Images ({request.userImages.length})
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {request.userImages.map((img, idx) => (
                  <div key={idx} className="w-20 h-20 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 text-xs shrink-0">
                    Image {idx + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifecycle Timeline */}
          {request.lifecycleEvents && request.lifecycleEvents.length > 0 && (
            <div className="border-t border-white/5 pt-5">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Repair Progress Timeline
              </h4>
              
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {request.lifecycleEvents.slice().reverse().map((event, i) => (
                  <div key={event.id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-900 bg-indigo-500 text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      {i === 0 && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] glass p-3 rounded-lg border border-white/5 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                          {event.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {event.note && <p className="text-sm text-slate-300 mt-1">{event.note}</p>}
                      {event.actor?.name && (
                        <p className="text-[10px] text-slate-500 mt-1">Updated by: {event.actor.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Report (if any) */}
          {request.completionReport && (
            <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                <span className="text-sm">✅</span>
                Completion Report
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Issue Summary</span>
                  <p className="text-slate-300">{request.completionReport.issueSummary}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Root Cause</span>
                  <p className="text-slate-300">{request.completionReport.rootCause}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Labor Cost</span>
                  <p className="text-white font-bold">${request.completionReport.laborCost}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Total Cost</span>
                  <p className="text-emerald-400 font-bold">${request.completionReport.totalCost}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/5 bg-slate-900/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {request.technician && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-lg">👨‍🔧</span>
                <span>Assigned to: <strong className="text-white">{request.technician.name}</strong></span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {canRequestInfo && (
              <button className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-sm font-medium text-amber-400 transition-colors">
                📩 Request Info
              </button>
            )}
            {canCancel && onCancel && (
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to cancel this request?')) return;
                  const ok = await onCancel(request.id);
                  // Only close the modal if the cancellation actually succeeded
                  if (ok !== false) onClose();
                }}
                disabled={isCancelling}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-sm font-medium text-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-500/10"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
