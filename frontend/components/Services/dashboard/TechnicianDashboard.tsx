import React, { useState, useEffect } from 'react';
import { Icons } from '../../../constants';
import { Technician, RepairRequestStatus } from '../../../types';
import { repairApi, RepairRequestData } from '../../../services/repairApi';

export const TechnicianDashboard = ({ user }: { user: Technician }) => {
  const [stats, setStats] = useState({
    incomingCount: 0,
    activeCount: 0,
    completedCount: 0
  });
  const [activeJobs, setActiveJobs] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [myRes, unassignedRes] = await Promise.all([
          repairApi.list({ per_page: 50 }),
          repairApi.getUnassigned({ per_page: 50 }),
        ]);
        
        const incomingCount = unassignedRes.data.length;
        const techRequests = myRes.data;
        
        const activeCount = techRequests.filter(r => 
          r.status !== RepairRequestStatus.COMPLETED && 
          r.status !== RepairRequestStatus.CANCELLED
        ).length;
        
        const completedCount = techRequests.filter(r => 
          r.status === RepairRequestStatus.COMPLETED
        ).length;

        setStats({ incomingCount, activeCount, completedCount });
        setActiveJobs(techRequests.filter(r => r.status !== RepairRequestStatus.COMPLETED).slice(0, 5));
      } catch (err) {
        console.error("Tech dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [user.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Technician Portal</h2>
          <p className="text-slate-400">Welcome back, {user.name}. Overview of service queues.</p>
        </div>
        <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-500 text-xs font-semibold tracking-widest uppercase">
          {user.specialty || 'General Hardware'}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass rounded-xl p-5 md:p-6 border border-white/5 flex flex-col">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">{Icons.bell}</div>
             <h3 className="font-semibold text-white">Incoming Requests</h3>
           </div>
           <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.incomingCount}</div>
           <p className="text-xs md:text-sm text-slate-500">Unassigned jobs in queue</p>
        </div>
        <div className="glass rounded-xl p-5 md:p-6 border border-white/5 flex flex-col">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">{Icons.zap}</div>
             <h3 className="font-semibold text-white">Active Jobs</h3>
           </div>
           <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.activeCount}</div>
           <p className="text-xs md:text-sm text-slate-500">Currently assigned to you</p>
        </div>
        <div className="glass rounded-xl p-5 md:p-6 border border-white/5 flex flex-col sm:col-span-2 lg:col-span-1">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">{Icons.shield}</div>
             <h3 className="font-semibold text-white">Completed Jobs</h3>
           </div>
           <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.completedCount}</div>
           <p className="text-xs md:text-sm text-slate-500">Total lifetime repairs</p>
        </div>
      </div>
      
      <div className="glass rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white">Your Active Queue</h3>
        </div>
        {activeJobs.length > 0 ? (
          <div className="divide-y divide-white/5">
            {activeJobs.map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div>
                   <h4 className="text-sm font-medium text-white">{job.gigTitle || 'Repair Job'}</h4>
                   <p className="text-xs text-slate-500">ID: {job.id.substr(0, 8)} • User: {job.userName || job.user?.name || 'Unknown'}</p>
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {job.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 italic text-sm">
            No active jobs in your queue. All tasks certified and closed.
          </div>
        )}
      </div>
    </div>
  );
};
