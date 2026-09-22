import React, { useState, useEffect } from 'react';
import { RepairRequest, RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { repairApi } from '../../../services/repairApi';
import { Icons } from '../../../constants';

const mapRequest = (r: any): RepairRequest => ({
  ...r,
  createdAt: new Date(r.createdAt).getTime(),
  updatedAt: new Date(r.updatedAt).getTime(),
} as RepairRequest);

export const AssignedJobsTech: React.FC = () => {
  const { session } = useAuth();
  const [jobs, setJobs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = async () => {
    if (session?.userId) {
      setLoading(true);
      setError(null);
      try {
        const history = await repairApi.getTechnicianHistory();
        const reqs = history.data.map(mapRequest);
        const filtered = reqs.filter(r => 
          r.status === RepairRequestStatus.ACCEPTED || 
          r.status === RepairRequestStatus.TECHNICIAN_ASSIGNED
        );
        setJobs(filtered.sort((a, b) => b.createdAt - a.createdAt));
      } catch (err) {
        console.error('Error loading assigned jobs:', err);
        setError('Failed to load assigned jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadJobs();
  }, [session]);

  const handleAction = async (req: RepairRequest, status: RepairRequestStatus, decision: string) => {
    let note = '';
    if (decision === 'PROPOSED_ALTERNATIVE' || decision === 'REQUESTED_MORE_INFO') {
      const msg = prompt('Please enter a note for the user:');
      if (msg === null) return;
      note = msg;
    } else if (decision === 'NOTE' || ['WAITING_PARTS', 'TESTING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      const msg = prompt(`Add an optional note for this state update (${status}):`);
      if (msg !== null) {
        note = msg;
      }
    }

    try {
      await repairApi.updateStatus(req.id, status.toLowerCase(), note || undefined);
      loadJobs();
    } catch (err) {
      console.error('Failed to update job status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Assigned Jobs</h2>
        <p className="text-slate-400 font-medium">Review and start work on repair tickets where you have been chosen or pre-assigned.</p>
      </div>

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
            <button onClick={loadJobs} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
              Retry
            </button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center glass rounded-2xl border border-white/5 space-y-3">
             <div className="w-12 h-12 rounded-full bg-slate-800/50 text-slate-500 flex items-center justify-center mx-auto">
               {Icons.briefcase}
             </div>
             <p className="text-sm text-slate-500 font-medium">No assigned or accepted jobs found.</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="glass rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:border-white/10 transition-colors">
              <div className="flex-1 space-y-4">
                 <div>
                    <div className="flex items-center gap-3">
                       <span className="text-xs text-indigo-400 font-mono font-bold tracking-widest uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">ID: {job.id.split('_')[1] || job.id.substring(0, 8)}</span>
                       <span className="text-xs text-slate-500">Received {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mt-1">{job.gigTitle || 'Expert Hardware Triage'}</h3>
                    <p className="text-sm text-slate-400 mt-1">{job.issueDescription}</p>
                 </div>

                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-medium border-t border-white/5 pt-4">
                    <div>
                       <span className="text-slate-500 block">CLIENT</span>
                       <span className="text-slate-300 font-bold">{job.userName}</span>
                    </div>
                    <div>
                       <span className="text-slate-500 block">CLASSIFICATION</span>
                       <span className="text-indigo-400 font-semibold">{job.issueCategory || 'General Diagnostics'}</span>
                    </div>
                    <div>
                       <span className="text-slate-500 block">SEVERITY PRIORITY</span>
                       <span className={`font-bold ${job.severityLevel === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {job.severityLevel ?? 'MEDIUM'}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="w-full md:w-52 flex flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                 {job.status === RepairRequestStatus.TECHNICIAN_ASSIGNED && (
                    <button 
                      onClick={() => handleAction(job, RepairRequestStatus.ACCEPTED, 'ACCEPTED')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-colors"
                    >
                      Accept Assignment
                    </button>
                 )}
                 {job.status === RepairRequestStatus.ACCEPTED && (
                    <button 
                      onClick={() => handleAction(job, RepairRequestStatus.IN_PROGRESS, 'NOTE')}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition-colors"
                    >
                      Initialize Repair Work
                    </button>
                 )}
                 <button 
                   onClick={() => handleAction(job, RepairRequestStatus.CANCELLED, 'REJECTED')}
                   className="w-full py-2.5 bg-white/5 hover:bg-rose-600/20 hover:text-rose-400 hover:border-rose-500/20 border border-white/10 text-slate-300 font-semibold rounded-lg text-xs transition-all"
                 >
                    Decline Job
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
