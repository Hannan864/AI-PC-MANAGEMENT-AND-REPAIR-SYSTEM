import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Layout/AuthProvider';
import { RepairRequest, RepairRequestStatus } from '../../../types';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { Icons } from '../../../constants';

export const AssignedTechnician: React.FC = () => {
  const { user } = useAuth();
  const [activeRequest, setActiveRequest] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [allRequests, setAllRequests] = useState<RepairRequest[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadAssignedTechnician();
    }
  }, [user]);

  const loadAssignedTechnician = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL requests (both active and history) to find assigned technicians
      // repairApi.list() and repairApi.getServiceHistory() return PaginatedData directly
      const [activeRes, historyRes] = await Promise.all([
        repairApi.list({ per_page: 100 }).catch(() => ({ data: [], meta: { total: 0 } })),
        repairApi.getServiceHistory({ per_page: 100 }).catch(() => ({ data: [], meta: { total: 0 } })),
      ]);

      // Combine active requests and history, removing duplicates
      // .data is the array of RepairRequestData (PaginatedData.data)
      const activeRequests = (activeRes.data || []).map(mapRequest);
      const historyRequests = (historyRes.data || []).map(mapRequest);
      
      const allReqs = [...activeRequests];
      historyRequests.forEach((r: RepairRequest) => {
        if (!allReqs.find(ar => ar.id === r.id)) {
          allReqs.push(r);
        }
      });
      
      setAllRequests(allReqs);
      
      // Find the latest request with an assigned technician (prefer active ones)
      const withTech = allReqs
        .filter(r => r.technicianId)
        .sort((a, b) => b.createdAt - a.createdAt);
        
      if (withTech.length > 0) {
        setActiveRequest(withTech[0]);
      }
    } catch (err) {
      console.error('Error loading assigned technician:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapRequest = (r: any): RepairRequest => ({
    ...r,
    createdAt: new Date(r.createdAt).getTime(),
    updatedAt: new Date(r.updatedAt).getTime(),
  }) as RepairRequest;

  const getStatusLabelColor = (status: RepairRequestStatus) => {
    switch (status) {
      case RepairRequestStatus.SUBMITTED:
      case RepairRequestStatus.AI_TRIAGED:
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      case RepairRequestStatus.TECHNICIAN_ASSIGNED:
      case RepairRequestStatus.ACCEPTED:
        return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
      case RepairRequestStatus.IN_PROGRESS:
      case RepairRequestStatus.TESTING:
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case RepairRequestStatus.WAITING_PARTS:
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case RepairRequestStatus.COMPLETED:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case RepairRequestStatus.CANCELLED:
        return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-white/5';
    }
  };

  const getStatusLabel = (status: RepairRequestStatus) => {
    switch (status) {
      case RepairRequestStatus.SUBMITTED: return 'Pending';
      case RepairRequestStatus.AI_TRIAGED: return 'AI Triaged';
      case RepairRequestStatus.TECHNICIAN_ASSIGNED: return 'Assigned';
      case RepairRequestStatus.ACCEPTED: return 'Accepted';
      case RepairRequestStatus.IN_PROGRESS: return 'In Progress';
      case RepairRequestStatus.TESTING: return 'Testing';
      case RepairRequestStatus.WAITING_PARTS: return 'Waiting Parts';
      case RepairRequestStatus.COMPLETED: return 'Completed';
      case RepairRequestStatus.CANCELLED: return 'Cancelled';
      case RepairRequestStatus.INFO_REQUESTED: return 'Action Needed';
      case RepairRequestStatus.PROPOSED_ALTERNATIVE: return 'Alternative Proposed';
      default: return status.replace(/_/g, ' ');
    }
  };

  // Count requests by status
  const activeCount = allRequests.filter(r => {
    const s = r.status;
    return s !== RepairRequestStatus.COMPLETED && s !== RepairRequestStatus.CANCELLED;
  }).length;
  
  const completedCount = allRequests.filter(r => r.status === RepairRequestStatus.COMPLETED).length;
  const assignedCount = allRequests.filter(r => r.technicianId).length;

  if (loading) {
    return (
      <div className="p-12 text-center glass rounded-xl border border-white/5">
        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-medium">Loading technician assignments...</p>
        <p className="text-xs text-slate-600 mt-1">Checking active staff rosters</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <span className="text-indigo-400">{Icons.userCheck}</span>
          </span>
          Your Assigned Technician
        </h2>
        <p className="text-slate-400 mt-1">Review credential profiles, active repair workloads, and messaging from your assigned system engineers.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Requests</span>
          <p className="text-2xl font-bold text-white">{allRequests.length}</p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Active</span>
          <p className="text-2xl font-bold text-indigo-400">{activeCount}</p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">With Tech</span>
          <p className="text-2xl font-bold text-emerald-400">{assignedCount}</p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Completed</span>
          <p className="text-2xl font-bold text-slate-400">{completedCount}</p>
        </div>
      </div>

      {!activeRequest ? (
        <div className="glass p-8 md:p-12 rounded-2xl border border-white/5 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            {Icons.userCheck}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">No Active Tech Assigned</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              You do not have a technician actively assigned to your repair profile. Browse available technician services on the marketplace to get started.
            </p>
          </div>
          
          {/* Pending Requests Info */}
          {allRequests.length > 0 && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">⏳</span>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Pending Assignment</span>
              </div>
              <p className="text-sm text-slate-300">
                You have {allRequests.filter(r => !r.technicianId && r.status !== 'completed' && r.status !== 'cancelled').length} request(s) waiting for technician assignment. An admin will assign a technician shortly.
              </p>
            </div>
          )}
          
          <div className="pt-2">
            <a 
              href="#browse-gigs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {Icons.search}
              <span>Browse Gigs</span>
            </a>
            <p className="text-xs text-slate-500 font-medium mt-3">
              Select "Browse Gigs" from the sidebar to discover available services.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Technician Credential Card */}
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-6 relative overflow-hidden bg-indigo-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white font-sans shrink-0 border border-white/10 shadow-lg shadow-indigo-500/20">
                  {activeRequest.technician?.name?.substring(0, 2).toUpperCase() || 'TC'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">{activeRequest.technician?.name || 'Assigned Technician'}</h3>
                  <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">Lead Repair Engineer</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Gig Assigned:</span>
                  <span className="text-slate-200 font-bold truncate max-w-[150px]">{activeRequest.gigTitle || 'Expert System Triage'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Liaison Area:</span>
                  <span className="text-indigo-400 font-bold">Remote Telemetry</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Security Status:</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 uppercase font-bold tracking-wider">Certified</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Assigned:</span>
                  <span className="text-slate-300 font-medium text-xs">
                    {new Date(activeRequest.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-xs text-slate-500 leading-relaxed">
              This engineer is bound by our real-time SLA metrics to complete your system optimization on schedule.
            </div>
          </div>

          {/* Connected Request Breakdown Card */}
          <div className="md:col-span-2 glass p-6 rounded-2xl border border-white/5 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Assigned Task Ticket</span>
                  <h4 className="text-lg font-bold text-white">{activeRequest.gigTitle || 'Diagnostic Maintenance'}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusLabelColor(activeRequest.status)}`}>
                  {getStatusLabel(activeRequest.status)}
                </span>
              </div>

              <div className="bg-[#020617]/60 p-4 rounded-xl border border-white/5 space-y-3 text-sm">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Issue Reported</span>
                  <p className="text-slate-200 font-medium mt-0.5">{activeRequest.issueDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Estimated Start</span>
                    <span className="block text-slate-300 font-semibold mt-0.5">
                      {activeRequest.sla?.estimatedStartTime 
                        ? new Date(activeRequest.sla.estimatedStartTime).toLocaleString() 
                        : 'Immediate Triage'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Priority Group</span>
                    <span className={`block font-semibold mt-0.5 ${
                      activeRequest.severityLevel === 'HIGH' ? 'text-rose-400' :
                      activeRequest.severityLevel === 'MEDIUM' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {activeRequest.severityLevel || 'NORMAL'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Created</span>
                    <span className="block text-slate-300 font-semibold mt-0.5">
                      {new Date(activeRequest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Request ID</span>
                    <span className="block text-slate-400 font-mono text-xs mt-0.5">
                      ...{activeRequest.id.substring(activeRequest.id.length - 8)}
                    </span>
                  </div>
                </div>
              </div>

              {activeRequest.technicianNote && (
                <div className="p-3 bg-indigo-500/5 rounded-lg border-l-2 border-indigo-400 text-sm text-slate-300">
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-1">Notes from Tech:</span>
                  "{activeRequest.technicianNote}"
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 italic pt-2 border-t border-white/5">
              Need real-time status details? Navigate to the <span className="text-indigo-400 font-bold border-b border-indigo-400/20 pb-0.5">Active Requests</span> panel for live SLA timeline updates.
            </div>
          </div>
        </div>
      )}

      {/* Recent Requests List */}
      {allRequests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Your Repair Requests
          </h3>
          <div className="space-y-3">
            {allRequests.slice(0, 5).map(req => (
              <div key={req.id} className="glass rounded-xl p-4 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    req.status === 'completed' ? 'bg-emerald-400' :
                    req.status === 'cancelled' ? 'bg-rose-400' :
                    req.technicianId ? 'bg-indigo-400 animate-pulse' :
                    'bg-amber-400'
                  }`}></div>
                  <div>
                    <p className="text-sm font-semibold text-white">{req.gigTitle || req.issueCategory || 'Repair Request'}</p>
                    <p className="text-xs text-slate-500">
                      ID: ...{req.id.substring(req.id.length - 8)} • {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {req.technicianId && (
                    <span className="text-xs text-indigo-400 font-medium hidden md:block">
                      👨‍🔧 {req.technician?.name || 'Tech'}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusLabelColor(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
