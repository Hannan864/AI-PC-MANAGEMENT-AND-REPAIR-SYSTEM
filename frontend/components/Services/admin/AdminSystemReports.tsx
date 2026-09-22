import React, { useState, useEffect } from 'react';
import { Role, User, RepairRequest, RepairRequestStatus } from '../../../types';
import { Icons } from '../../../constants';
import { repairApi } from '../../../services/repairApi';
import { adminApi } from '../../../services/adminApi';

const mapUser = (u: any): User => ({
  ...u,
  role: u.role.toUpperCase() as Role,
  status: (u.status || 'active').toUpperCase() as 'ACTIVE' | 'SUSPENDED',
  createdAt: new Date(u.createdAt).getTime(),
} as User);

const mapRequest = (r: any): RepairRequest => ({
  ...r,
  createdAt: new Date(r.createdAt).getTime(),
  updatedAt: new Date(r.updatedAt).getTime(),
} as RepairRequest);

interface ReportData {
  totalRepairs: number;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
  ratio: number;
  categories: { name: string; count: number }[];
  topTechnicians: { name: string; email: string; completed: number; active: number }[];
  avgHours: number;
}

export const AdminSystemReports: React.FC = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compileReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, userRes] = await Promise.all([
        repairApi.list(),
        adminApi.listUsers(),
      ]);
      const allRequests: RepairRequest[] = reqRes.data.map(mapRequest);
      const allUsers: User[] = userRes.data.map(mapUser);
      
      const totalRepairs = allRequests.length;
      const completedCount = allRequests.filter(r => r.status === RepairRequestStatus.COMPLETED).length;
      const cancelledCount = allRequests.filter(r => r.status === RepairRequestStatus.CANCELLED).length;
      const activeCount = totalRepairs - completedCount - cancelledCount;

      const ratio = totalRepairs > 0 ? (completedCount / totalRepairs) * 100 : 0;

      // Group by categories
      const categoryMap: Record<string, number> = {};
      allRequests.forEach(r => {
        const cat = r.issueCategory || 'General Diagnostics';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
      });
      const categoriesList = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a,b) => b.count - a.count);

      // Average turnaround time overall
      let totalDuration = 0;
      let durationCount = 0;
      allRequests.filter(r => r.status === RepairRequestStatus.COMPLETED).forEach(req => {
        const completionTime = req.sla?.actualCompletionTime || req.updatedAt;
        const duration = completionTime - req.createdAt;
        if (duration > 0) {
          totalDuration += duration;
          durationCount++;
        }
      });
      const avgHours = durationCount > 0 ? (totalDuration / durationCount) / 3600000 : 0;

      // Top Technicians
      const techniciansInDb = allUsers.filter(u => u.role === Role.TECHNICIAN);
      const topTechsData = techniciansInDb.map(tech => {
        const techJobs = allRequests.filter(r => r.technicianId === tech.id);
        const completed = techJobs.filter(r => r.status === RepairRequestStatus.COMPLETED).length;
        const active = techJobs.filter(r => r.status !== RepairRequestStatus.COMPLETED && r.status !== RepairRequestStatus.CANCELLED).length;
        
        return {
          name: tech.name,
          email: tech.email,
          completed,
          active
        };
      })
      .sort((a,b) => b.completed - a.completed)
      .slice(0, 5); // top 5

      setReport({
        totalRepairs,
        activeCount,
        completedCount,
        cancelledCount,
        ratio: parseFloat(ratio.toFixed(1)),
        categories: categoriesList,
        topTechnicians: topTechsData,
        avgHours: parseFloat(avgHours.toFixed(1))
      });

    } catch (err) {
      console.error('Error compiling aggregate data reports:', err);
      setError('Failed to compile reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    compileReportData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">System SLA Analytics & Reports</h2>
          <p className="text-slate-400 font-medium font-sans">Aggregate diagnostics performance, category breakdowns, and system-wide technician queue audits.</p>
        </div>
        <div className="p-12 text-center glass rounded-xl border border-white/5">
          <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 italic">Running background telemetry rollup queries...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">System SLA Analytics & Reports</h2>
          <p className="text-slate-400 font-medium font-sans">Aggregate diagnostics performance, category breakdowns, and system-wide technician queue audits.</p>
        </div>
        <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
          <p className="text-rose-400 mb-3">{error || 'Failed to load report data.'}</p>
          <button onClick={compileReportData} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">System SLA Analytics & Reports</h2>
          <p className="text-slate-400 font-medium font-sans">
            Aggregate diagnostics performance, category breakdowns, and system-wide technician queue audits.
          </p>
        </div>
        <button
          onClick={compileReportData}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Re-compile Reports
        </button>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Volumes */}
        <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Service Tickets Volumetric Index</span>
          <div className="my-4">
            <span className="text-4xl font-black text-white">{report.totalRepairs}</span>
            <span className="text-slate-500 text-xs font-bold block mt-1">Total repair payloads logged</span>
          </div>
          <div className="flex gap-4 text-xs font-semibold border-t border-white/5 pt-3 text-slate-400">
            <div>
              <span>Active: </span>
              <strong className="text-white">{report.activeCount}</strong>
            </div>
            <div>
              <span>Completed: </span>
              <strong className="text-emerald-400">{report.completedCount}</strong>
            </div>
          </div>
        </div>

        {/* Completed vs Active Ratio Progress */}
        <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">SLA Closed Resolve Ratio</span>
          <div className="my-4 space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-extrabold text-emerald-400">{report.ratio}%</span>
              <span className="text-xs text-slate-400 font-semibold">{report.completedCount} of {report.totalRepairs} Resolved</span>
            </div>
            {/* Custom progress bar */}
            <div className="w-full bg-[#020617] rounded-full h-2.5 overflow-hidden border border-white/5">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${report.ratio}%` }}
              ></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Percentage of successfully delivered resolving handovers.</p>
        </div>

        {/* Turnaround Time Statistics */}
        <div className="glass p-5 rounded-xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Average Turnaround Time (TAT)</span>
          <div className="my-4">
            <span className="text-4xl font-black text-sky-400">
              {report.completedCount > 0 ? `${report.avgHours}h` : 'N/A'}
            </span>
            <span className="text-slate-400 text-xs font-bold block mt-1">Average resolution timeline</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Calculated from submission timestamp to final technician checkout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Frequency Map */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-4 bg-white/5 border-b border-white/5">
            <h3 className="font-bold text-sm text-slate-100">Category Frequency Distribution</h3>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
            {report.categories.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10 font-semibold">No issues classified yet.</p>
            ) : (
              report.categories.map((cat, index) => {
                const total = report.totalRepairs;
                const percent = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">{cat.name}</span>
                      <span className="text-slate-400 font-bold">{cat.count} tickets ({percent}%)</span>
                    </div>
                    <div className="w-full bg-[#020617] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-indigo-500' :
                          index === 1 ? 'bg-indigo-400' :
                          index === 2 ? 'bg-sky-400' :
                          'bg-teal-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Technicians leaderboard */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-4 bg-white/5 border-b border-white/5">
            <h3 className="font-bold text-sm text-slate-100">SLA Leadership Board (Certified Technicians)</h3>
          </div>
          <div className="p-4 divide-y divide-white/5">
            {report.topTechnicians.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10 font-semibold">No active technicians in telemetry cache.</p>
            ) : (
              report.topTechnicians.map((tech, idx) => (
                <div key={tech.email} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded bg-white/5 text-[10px] font-bold text-indigo-400 flex items-center justify-center border border-white/5">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">{tech.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono font-medium">{tech.email}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">{tech.completed} resolved</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">{tech.active} current workload</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
