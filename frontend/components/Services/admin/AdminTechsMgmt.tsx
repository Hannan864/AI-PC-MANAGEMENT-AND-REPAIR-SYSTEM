import React, { useState, useEffect } from 'react';
import { Role, User, RepairRequest, RepairRequestStatus } from '../../../types';
import { Icons } from '../../../constants';
import { AdminTechDetailsPane } from './AdminTechDetailsPane';
import { adminApi } from '../../../services/adminApi';
import { repairApi } from '../../../services/repairApi';
import { gigApi } from '../../../services/gigApi';

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

interface TechStats {
  technician: User;
  activeCount: number;
  completedCount: number;
  avgHours: number;
  gigsCount: number;
}

export const AdminTechsMgmt: React.FC = () => {
  const [techStatsList, setTechStatsList] = useState<TechStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<TechStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTechStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, reqRes, gigRes] = await Promise.all([
        adminApi.listUsers(),
        repairApi.list(),
        gigApi.list(),
      ]);
      const allUsers: User[] = userRes.data.map(mapUser);
      const allRequests: RepairRequest[] = reqRes.data.map(mapRequest);
      const allGigs = gigRes;

      const techs = allUsers.filter(u => u.role === Role.TECHNICIAN);

      const computedStats: TechStats[] = techs.map(tech => {
        const assignedRequests = allRequests.filter(r => r.technicianId === tech.id);
        const activeRequests = assignedRequests.filter(
          r => r.status !== RepairRequestStatus.COMPLETED && r.status !== RepairRequestStatus.CANCELLED
        );
        const completedRequests = assignedRequests.filter(r => r.status === RepairRequestStatus.COMPLETED);
        
        // Calculate average turnaround time
        let totalDuration = 0;
        completedRequests.forEach(req => {
          // If actualCompletionTime and createdAt are in SLA, use them, otherwise updatedAt - createdAt
          const completionTime = req.sla?.actualCompletionTime || req.updatedAt;
          const duration = completionTime - req.createdAt;
          if (duration > 0) {
            totalDuration += duration;
          }
        });
        const avgHours = completedRequests.length > 0 ? (totalDuration / completedRequests.length) / 3600000 : 0;
        
        // Count Gigs posted by tech
        const techGigsCount = allGigs.filter((g: any) => g.technicianId === tech.id).length;

        return {
          technician: tech,
          activeCount: activeRequests.length,
          completedCount: completedRequests.length,
          avgHours: parseFloat(avgHours.toFixed(1)),
          gigsCount: techGigsCount
        };
      });

      setTechStatsList(computedStats);

      // Refresh selection details if any were open
      if (selectedTech) {
        const refreshed = computedStats.find(t => t.technician.id === selectedTech.technician.id);
        if (refreshed) {
          setSelectedTech(refreshed);
        }
      }
    } catch (err) {
      console.error('Error generating technician management stats:', err);
      setError('Failed to load technician data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechStats();
  }, []);

  const handleToggleStatus = async (tech: User) => {
    const currentStatus = tech.status || 'ACTIVE';
    const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    
    const updatedTech: User = {
      ...tech,
      status: newStatus
    };

    try {
      await adminApi.updateUserStatus(tech.id, newStatus === 'SUSPENDED' ? 'suspended' : 'active');

      await loadTechStats();
    } catch (err) {
      console.error('Error updating technician status:', err);
      alert('Failed to update technician status. Please try again.');
    }
  };

  const filteredTechs = techStatsList.filter(t => 
    t.technician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.technician.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Overview Head */}
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Technicians Performance & Clearances</h2>
        <p className="text-slate-400 font-medium">
          Monitor dispatch load backlogs, turnaround metrics, active diagnostic stats, and verify certification clearances.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left List Pane */}
        <div className="xl:col-span-2 space-y-4">
          {/* Controls */}
          <div className="glass p-4 rounded-xl border border-white/5 flex gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                {Icons.search}
              </span>
              <input
                type="text"
                placeholder="Search tech names or emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-white/5 rounded-lg text-xs font-semibold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50 transition-colors"
              />
            </div>
            
            <button
              onClick={loadTechStats}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-bold rounded-lg border border-white/5"
            >
              Refresh Load
            </button>
          </div>

          {/* List display */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">Scanning workshop rosters...</div>
          ) : error ? (
            <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
              <p className="text-rose-400 text-sm font-medium mb-3">{error}</p>
              <button onClick={loadTechStats} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
                Retry
              </button>
            </div>
          ) : filteredTechs.length === 0 ? (
            <div className="p-12 text-center glass rounded-xl border border-white/5">
              <p className="text-sm text-slate-500 font-medium">No technicians registered on this deployment node.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTechs.map(item => {
                const tStatus = item.technician.status || 'ACTIVE';
                const isSelected = selectedTech?.technician.id === item.technician.id;

                return (
                  <div
                    key={item.technician.id}
                    onClick={() => setSelectedTech(item)}
                    className={`glass p-5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row gap-5 justify-between items-start md:items-center ${
                      isSelected 
                        ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)]' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-100 text-sm">{item.technician.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest border ${
                          tStatus === 'SUSPENDED' 
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/20' 
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {tStatus}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400 font-semibold truncate mt-1">{item.technician.email}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mt-4 max-w-sm text-xs font-medium border-t border-white/5 pt-3">
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Active Jobs</span>
                          <span className="text-slate-200 font-bold">{item.activeCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">SLA Resolved</span>
                          <span className="text-emerald-400 font-bold">{item.completedCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase font-bold block">Avg SLA Time</span>
                          <span className="text-sky-400 font-bold">{item.completedCount > 0 ? `${item.avgHours}h` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center md:flex-col gap-2.5 w-full md:w-auto mt-3 md:mt-0 border-t md:border-0 border-white/5 pt-3 md:pt-0 justify-between">
                      <span className="text-xs font-bold text-slate-500 font-mono bg-[#020617] px-2.5 py-1.5 rounded-lg border border-white/5">
                        {item.gigsCount} Active Gigs
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(item.technician);
                        }}
                        className={`px-3 py-1.5 rounded-md text-[9px] font-extrabold tracking-widest uppercase transition-all border ${
                          tStatus === 'SUSPENDED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600 hover:text-white'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white'
                        }`}
                      >
                        {tStatus === 'SUSPENDED' ? 'Approve Tech' : 'Suspend Tech'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div>
          {selectedTech ? (
            <AdminTechDetailsPane
              selectedTech={selectedTech}
              onClear={() => setSelectedTech(null)}
              onToggleStatus={handleToggleStatus}
            />
          ) : (
            <div className="glass rounded-xl border border-white/5 p-8 text-center text-slate-500 space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                {Icons.briefcase}
              </div>
              <p className="text-xs font-medium max-w-[200px] mx-auto">Select a technician from the roster list to audit their historic SLAs and active performance snapshots.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
