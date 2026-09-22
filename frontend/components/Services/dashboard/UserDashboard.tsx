import React, { useState, useEffect } from 'react';
import { Icons } from '../../../constants';
import { User, RepairRequestStatus } from '../../../types';
import { repairApi, RepairRequestData } from '../../../services/repairApi';

export const UserDashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState({
    activeCount: 0,
    historyCount: 0,
    assignedTech: null as string | null,
    recentActivity: [] as { id: string; title: string; status: string; date: string }[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await repairApi.list({ per_page: 50 });
        const requests = res.data;
        
        const activeCount = requests.filter(r => 
          r.status !== RepairRequestStatus.COMPLETED && 
          r.status !== RepairRequestStatus.CANCELLED
        ).length;
        
        const historyCount = requests.filter(r => 
          r.status === RepairRequestStatus.COMPLETED || 
          r.status === RepairRequestStatus.CANCELLED
        ).length;

        const assignedRequest = requests.find(r => r.technicianId && r.status !== RepairRequestStatus.COMPLETED);
        
        const recentActivity = requests
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(r => ({
            id: r.id,
            title: r.gigTitle || r.issueCategory || 'Repair Request',
            status: r.status.replace(/_/g, ' '),
            date: new Date(r.updatedAt).toLocaleDateString(),
          }));

        setStats({
          activeCount,
          historyCount,
          assignedTech: assignedRequest ? (assignedRequest.technician?.name || 'Not yet assigned') : null,
          recentActivity,
        });
      } catch (err) {
        console.error("Dashboard data load failure:", err);
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
          <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome, {user.name}</h2>
          <p className="text-slate-400">Manage your repair requests and status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass rounded-xl p-5 md:p-6 border border-white/5 flex flex-col">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">{Icons.activity}</div>
             <h3 className="font-semibold text-white">Active Requests</h3>
           </div>
           <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.activeCount}</div>
           <p className="text-xs md:text-sm text-slate-500">Currently being serviced</p>
        </div>
        <div className="glass rounded-xl p-5 md:p-6 border border-white/5 flex flex-col">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">{Icons.clipboard}</div>
             <h3 className="font-semibold text-white">Service History</h3>
           </div>
           <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stats.historyCount}</div>
           <p className="text-xs md:text-sm text-slate-500">Past repairs and diagnostics</p>
        </div>
        <div className="glass rounded-xl p-5 md:p-6 border border-white/5 flex flex-col sm:col-span-2 lg:col-span-1">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">{Icons.userCheck}</div>
             <h3 className="font-semibold text-white">Assigned Technician</h3>
           </div>
           {stats.assignedTech ? (
             <div className="flex flex-col">
               <span className="text-white font-medium">{stats.assignedTech}</span>
               <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest mt-1">Active Assignment</span>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center text-sm text-slate-500 italic">
               No active technician
             </div>
           )}
        </div>
      </div>
      
      <div className="glass rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h3 className="font-semibold text-white">Recent Activity</h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : stats.recentActivity.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No recent repair activity found.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {stats.recentActivity.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{item.date}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
