import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Layout/AuthProvider';
import { RepairRequestStatus } from '../../../types';
import { Icons } from '../../../constants';
import { repairApi, RepairRequestData } from '../../../services/repairApi';

export const ServiceHistory: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'active'>('all');

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await repairApi.getServiceHistory({ per_page: 100 });
      setRequests(res.data);
    } catch (err) {
      console.error('Error loading service history:', err);
      setError('Failed to load service history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case RepairRequestStatus.COMPLETED:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>;
      case RepairRequestStatus.CANCELLED:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">Cancelled</span>;
      case RepairRequestStatus.SUBMITTED:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/20">Pending</span>;
      case RepairRequestStatus.ACCEPTED:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Accepted</span>;
      case RepairRequestStatus.IN_PROGRESS:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">In Progress</span>;
      case RepairRequestStatus.WAITING_PARTS:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20">Waiting Parts</span>;
      case RepairRequestStatus.TESTING:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">Testing</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'completed') return req.status === RepairRequestStatus.COMPLETED;
    if (filter === 'cancelled') return req.status === RepairRequestStatus.CANCELLED;
    if (filter === 'active') return req.status !== RepairRequestStatus.COMPLETED && req.status !== RepairRequestStatus.CANCELLED;
    return true;
  });

  const stats = {
    total: requests.length,
    completed: requests.filter(r => r.status === RepairRequestStatus.COMPLETED).length,
    cancelled: requests.filter(r => r.status === RepairRequestStatus.CANCELLED).length,
    active: requests.filter(r => r.status !== RepairRequestStatus.COMPLETED && r.status !== RepairRequestStatus.CANCELLED).length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Service History</h2>
        <p className="text-slate-400">View all your repair requests and their status.</p>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total</span>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Active</span>
            <span className="text-2xl font-bold text-amber-400">{stats.active}</span>
          </div>
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Completed</span>
            <span className="text-2xl font-bold text-emerald-400">{stats.completed}</span>
          </div>
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Cancelled</span>
            <span className="text-2xl font-bold text-rose-400">{stats.cancelled}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        {(['all', 'active', 'completed', 'cancelled'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-colors whitespace-nowrap ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
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
            <button onClick={loadRequests} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center glass rounded-xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
              {Icons.clipboard}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {filter === 'all' ? 'No Requests Yet' : `No ${filter} requests`}
            </h3>
            <p className="text-slate-500">
              {filter === 'all' 
                ? 'Create your first repair request to get started.'
                : `You don't have any ${filter} requests.`}
            </p>
          </div>
        ) : (
          filteredRequests.map(req => (
            <div key={req.id} className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-white tracking-tight truncate">
                      {req.gigTitle || req.issueCategory || 'Repair Request'}
                    </h3>
                    {getStatusBadge(req.status)}
                  </div>

                  {req.severityLevel && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${
                        req.severityLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        req.severityLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {req.severityLevel.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{req.issueDescription}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="font-mono">ID: {req.id.substring(0, 8)}</span>
                    <span>•</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  {req.technicianNote && (
                    <div className="mt-3 p-3 bg-indigo-500/5 rounded-lg border-l-2 border-indigo-400">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Technician Note</span>
                      <p className="text-sm text-slate-300">{req.technicianNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
