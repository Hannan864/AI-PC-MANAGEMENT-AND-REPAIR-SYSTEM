import React, { useState, useEffect } from 'react';
import { RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { Icons } from '../../../constants';

export const ServiceReportsTech: React.FC = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState({
    totalAssigned: 0,
    completedCount: 0,
    activeCount: 0,
    avgTimeHours: 0,
    hardwareCount: 0,
    softwareCount: 0,
    networkCount: 0
  });

  const metricsFromReqs = (reqs: RepairRequestData[]) => {
    const completed = reqs.filter(r => r.status === RepairRequestStatus.COMPLETED);
    const active = reqs.filter(r =>
      r.status === RepairRequestStatus.IN_PROGRESS ||
      r.status === RepairRequestStatus.WAITING_PARTS ||
      r.status === RepairRequestStatus.TESTING
    );

    let totalDuration = 0;
    let validCompletedCount = 0;
    completed.forEach(c => {
      const duration = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
      if (duration > 0 && !isNaN(duration)) {
        totalDuration += duration;
        validCompletedCount++;
      }
    });
    const avgHours = validCompletedCount > 0 ? (totalDuration / validCompletedCount) / 3600000 : 0;

    // Categories come from the API already normalized to UPPERCASE (e.g.
    // 'HARDWARE', 'NETWORK ISSUE', 'HARDWARE_ISSUE') — match case-insensitively.
    const inCategory = (r: RepairRequestData, term: string) =>
      (r.issueCategory || '').toUpperCase().includes(term);

    const hw = reqs.filter(r => inCategory(r, 'HARDWARE')).length;
    const sw = reqs.filter(r => inCategory(r, 'SOFTWARE')).length;
    const net = reqs.filter(r => inCategory(r, 'NETWORK')).length;

    return {
      totalAssigned: reqs.length,
      completedCount: completed.length,
      activeCount: active.length,
      avgTimeHours: parseFloat(avgHours.toFixed(1)),
      hardwareCount: hw,
      softwareCount: sw,
      networkCount: net
    };
  };

  useEffect(() => {
    const calculateReports = async () => {
      if (session?.userId) {
        setLoading(true);
        setError(null);
        try {
          const history = await repairApi.getTechnicianHistory();
          const reqs: RepairRequestData[] = history.data;
          setRequests(reqs);
          setMetrics(metricsFromReqs(reqs));
        } catch (err) {
          console.error('Error generating service reports:', err);
          setError('Failed to load reports. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };
    calculateReports();
  }, [session]);

  const retryLoad = async () => {
    if (!session?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const history = await repairApi.getTechnicianHistory();
      const reqs: RepairRequestData[] = history.data;
      setRequests(reqs);
      setMetrics(metricsFromReqs(reqs));
    } catch (err) {
      console.error('Error generating service reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Service Performance Reports</h2>
          <p className="text-slate-400">Review dynamic telemetry metrics, workload completed audits, and average ticket SLAs.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass p-5 rounded-2xl border border-white/5 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-white/10 rounded w-1/3 mb-2"></div>
              <div className="h-2 bg-white/10 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Service Performance Reports</h2>
          <p className="text-slate-400">Review dynamic telemetry metrics, workload completed audits, and average ticket SLAs.</p>
        </div>
        <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
          <p className="text-rose-400 mb-3">{error}</p>
          <button onClick={retryLoad} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Service Performance Reports</h2>
        <p className="text-slate-400">Review dynamic telemetry metrics, workload completed audits, and average ticket SLAs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Total Workload Assigned</span>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white mb-1">{metrics.totalAssigned}</span>
              <span className="text-xs text-indigo-400 font-semibold font-mono">Tickets</span>
           </div>
           <p className="text-xs text-slate-500">Includes active submissions, active repairs, and historic closures.</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">SLA Completed Gigs</span>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-400 mb-1">{metrics.completedCount}</span>
              <span className="text-xs text-emerald-400/80 font-bold">Closed</span>
           </div>
           <p className="text-xs text-slate-500">Successful, certified handoffs registered in the database.</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Active Backlogs</span>
           <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-400 mb-1">{metrics.activeCount}</span>
              <span className="text-xs text-amber-400 font-bold">Active</span>
           </div>
           <p className="text-xs text-slate-500">Repairs currently undergoing assembly or diagnostics.</p>
        </div>

        <div className="glass p-5 rounded-2xl border border-white/5 space-y-2">
           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Avg Turnaround Time</span>
           <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-sky-400 mb-1">{metrics.avgTimeHours}</span>
              <span className="text-xs text-slate-400 font-bold">Hours</span>
           </div>
           <p className="text-xs text-slate-500">SLA timestamp discrepancy calculation (Open to Close).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Telemetry Categories Serviced</h3>

           <div className="space-y-4 pt-2">
              <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-300">
                    <span>Hardware Integration & Assemblies</span>
                    <span className="font-bold">{metrics.hardwareCount}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${metrics.totalAssigned > 0 ? (metrics.hardwareCount / metrics.totalAssigned) * 100 : 0}%` }}></div>
                 </div>
              </div>

              <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-300">
                    <span>Software Calibrations & Kernel Audits</span>
                    <span className="font-bold">{metrics.softwareCount}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${metrics.totalAssigned > 0 ? (metrics.softwareCount / metrics.totalAssigned) * 100 : 0}%` }}></div>
                 </div>
              </div>

              <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-300">
                    <span>Network diagnostics & Socket routing</span>
                    <span className="font-bold">{metrics.networkCount}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${metrics.totalAssigned > 0 ? (metrics.networkCount / metrics.totalAssigned) * 100 : 0}%` }}></div>
                 </div>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 space-y-4">
           <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live SLA Ledger Trails</h3>

           <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-hide pr-1">
              {requests.length === 0 ? (
                 <p className="text-center text-xs text-slate-500 py-6">No ledger actions registered.</p>
              ) : (
                requests.slice(0, 10).map(req => (
                  <div key={req.id} className="flex justify-between items-center bg-[#020617]/50 rounded-xl p-3 border border-white/5 text-xs">
                     <div className="space-y-1 min-w-0 flex-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 font-bold block w-max mb-1">
                           ID: {req.id.split('_')[1] || req.id.substring(0, 8)}
                        </span>
                        <h4 className="font-bold text-slate-200 truncate">{req.gigTitle || 'Expert Repair Triage'}</h4>
                        <span className="text-slate-500 block">Client: {req.userName || req.user?.name || 'Unknown'}</span>
                     </div>

                     <span className="text-slate-400 font-sans font-medium shrink-0 ml-4">
                        State: <span className="font-bold text-indigo-400">{req.status.replace(/_/g, ' ')}</span>
                     </span>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
