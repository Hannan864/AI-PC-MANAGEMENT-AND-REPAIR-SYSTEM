import React, { useState, useEffect, useMemo } from 'react';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';
import { RequestDetailsModal } from './RequestDetailsModal';

export const ActiveRequestsUser = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RepairRequestData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    loadRequests();
  }, [session]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await repairApi.list({ per_page: 100 });
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to load your requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests by status tab — all of the user's own requests always show
  const filteredRequests = useMemo(() => {
    switch (filter) {
      case 'active':
        return requests.filter(req => {
          const status = req.status.toUpperCase();
          return status !== 'COMPLETED' && status !== 'CANCELLED';
        });
      case 'completed':
        return requests.filter(req => {
          const status = req.status.toUpperCase();
          return status === 'COMPLETED' || status === 'CANCELLED';
        });
      default:
        return requests;
    }
  }, [requests, filter]);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case RepairRequestStatus.SUBMITTED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-500/20 text-slate-300 border border-slate-500/30 transition-all duration-200">
          Pending
        </span>
      );
      case RepairRequestStatus.AI_TRIAGED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all duration-200">
          AI Triaged
        </span>
      );
      case RepairRequestStatus.GIG_SELECTED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all duration-200">
          Gig Selected
        </span>
      );
      case RepairRequestStatus.TECHNICIAN_ASSIGNED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all duration-200">
          Technician Assigned
        </span>
      );
      case RepairRequestStatus.ACCEPTED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-all duration-200">
          Accepted
        </span>
      );
      case RepairRequestStatus.IN_PROGRESS: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all duration-200">
          In Progress
        </span>
      );
      case RepairRequestStatus.WAITING_PARTS: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 transition-all duration-200">
          Waiting Parts
        </span>
      );
      case RepairRequestStatus.TESTING: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 transition-all duration-200">
          Testing
        </span>
      );
      case RepairRequestStatus.COMPLETED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all duration-200">
          Completed
        </span>
      );
      case RepairRequestStatus.CANCELLED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all duration-200">
          Cancelled
        </span>
      );
      case RepairRequestStatus.INFO_REQUESTED: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all duration-200">
          Action Needed
        </span>
      );
      case RepairRequestStatus.PROPOSED_ALTERNATIVE: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30 transition-all duration-200">
          Alternative Proposed
        </span>
      );
      default: return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-500/20 text-slate-300 border border-slate-500/30 transition-all duration-200">
          {status}
        </span>
      );
    }
  };

  const handleViewDetails = (req: RepairRequestData) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleCancelRequest = async (id: string): Promise<boolean> => {
    try {
      setCancellingId(id);
      await repairApi.updateStatus(id, 'cancelled');
      await loadRequests();
      handleCloseModal();
      return true;
    } catch (err: any) {
      console.error('Failed to cancel:', err);
      const message = err?.response?.data?.message || 'Failed to cancel request. Please try again.';
      alert(message);
      return false;
    } finally {
      setCancellingId(null);
    }
  };

  const handleRefresh = () => {
    loadRequests();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400">{Icons.activity}</span>
            </span>
            Active Requests
          </h2>
          <p className="text-slate-400 mt-1">Track and manage your ongoing repair orders.</p>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === 'active'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === 'all'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === 'completed'
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Requests</span>
          <p className="text-2xl font-bold text-white">{requests.length}</p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Active</span>
          <p className="text-2xl font-bold text-indigo-400">
            {requests.filter(r => {
              const s = r.status.toUpperCase();
              return s !== 'COMPLETED' && s !== 'CANCELLED';
            }).length}
          </p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Completed</span>
          <p className="text-2xl font-bold text-emerald-400">
            {requests.filter(r => r.status.toUpperCase() === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">In Progress</span>
          <p className="text-2xl font-bold text-sky-400">
            {requests.filter(r => {
              const s = r.status.toUpperCase();
              return s !== 'COMPLETED' && s !== 'CANCELLED' && s !== 'SUBMITTED';
            }).length}
          </p>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center glass rounded-xl border border-white/5">
            <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-medium">Loading your repair requests...</p>
            <p className="text-xs text-slate-600 mt-1">Fetching data from server</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-rose-400 mb-3 font-medium">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center glass rounded-xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
              {Icons.activity}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No {filter === 'active' ? 'Active' : filter === 'completed' ? 'Completed' : ''} Requests</h3>
            <p className="text-slate-500">
              {filter === 'active' 
                ? "You don't have any ongoing repair jobs."
                : filter === 'completed'
                ? "You don't have any completed repair jobs yet."
                : "No requests match the current filter."
              }
            </p>
            {filter === 'active' && (
              <button 
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-sm font-medium text-indigo-400 transition-all duration-200"
              >
                View All Requests
              </button>
            )}
          </div>
        ) : (
          filteredRequests.map(req => (
            <div 
              key={req.id} 
              className="glass rounded-xl p-5 border border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 group"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white tracking-tight group-hover:text-indigo-400 transition-colors duration-200">
                    {req.gigTitle || `Auto-Routed: ${req.issueCategory || 'General Issue'}`}
                  </h3>
                  {getStatusBadge(req.status)}
                </div>

                {req.severityLevel && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all duration-200 ${
                      req.severityLevel === 'HIGH' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                        : req.severityLevel === 'MEDIUM' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {req.severityLevel.toUpperCase()} PRIORITY {req.severityScore != null ? `(${req.severityScore}/100)` : ''}
                    </span>
                    {req.attachedDiagnostics && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 transition-all duration-200">
                        Diagnostic Attached
                      </span>
                    )}
                    {req.isAIOverridden && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20 transition-all duration-200">
                        AI Overridden
                      </span>
                    )}
                  </div>
                )}

                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{req.issueDescription}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="mono flex items-center gap-1">
                    <span className="text-slate-600">ID:</span> 
                    <span className="text-slate-400">...{req.id.substring(req.id.length - 8)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-600">Requested:</span> 
                    <span className="text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </span>
                  {req.technician && (
                    <span className="flex items-center gap-1 text-indigo-400">
                      <span>👨‍🔧</span>
                      <span>{req.technician.name}</span>
                    </span>
                  )}
                </div>

                {req.technicianNote && (
                  <div className="mt-4 p-3 bg-[#020617]/50 rounded-lg border border-blue-500/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-blue-400 mb-1">
                        Technician Update{req.technicianDecision ? `: ${req.technicianDecision.replace(/_/g, ' ')}` : ''}
                      </div>
                      <p className="text-sm text-slate-300">{req.technicianNote}</p>
                    </div>
                  </div>
                )}

                {req.lifecycleEvents && req.lifecycleEvents.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live Repair Progress
                      </h4>
                      {req.status !== 'completed' && req.status !== 'cancelled' && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          Est. Completion: {new Date(new Date(req.createdAt).getTime() + (req.severityLevel === 'HIGH' ? 4 * 3600000 : 8 * 3600000)).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {req.lifecycleEvents.slice(-3).reverse().map((event, i) => (
                        <div key={event.id || i} className="flex items-center gap-2 shrink-0">
                          <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {event.status.replace(/_/g, ' ')}
                          </span>
                          {i < 2 && <span className="text-slate-700">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-2 md:items-end min-w-[150px]">
                <button 
                  onClick={() => handleViewDetails(req)}
                  className="px-4 py-2.5 w-full bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-xl text-sm font-medium text-white hover:text-indigo-400 transition-all duration-200 hover:scale-105 active:scale-95 group-hover:border-white/20"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>View Details</span>
                    <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </span>
                </button>
                {req.status.toUpperCase() === RepairRequestStatus.SUBMITTED && (
                  <button 
                    onClick={() => handleCancelRequest(req.id)}
                    disabled={cancellingId === req.id}
                    className="px-4 py-2.5 w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-medium text-rose-400 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {cancellingId === req.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                        <span>Cancelling...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>Cancel Request</span>
                        <span className="text-xs">✕</span>
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Request Details Modal */}
      <RequestDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
        onCancel={handleCancelRequest}
        isCancelling={cancellingId !== null}
      />
    </div>
  );
};
