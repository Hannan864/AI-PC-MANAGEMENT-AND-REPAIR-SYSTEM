import React, { useState, useEffect } from 'react';
import { RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { Icons } from '../../../constants';

interface CustomerPortfolio {
  userId: string;
  userName: string;
  activeRequests: RepairRequestData[];
  completedRequests: RepairRequestData[];
  totalTickets: number;
}

export const CustomerHistoryTech: React.FC = () => {
  const { session } = useAuth();
  const [portfolios, setPortfolios] = useState<CustomerPortfolio[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildPortfolios = (reqs: RepairRequestData[]): CustomerPortfolio[] => {
    const customerMap: Record<string, CustomerPortfolio> = {};

    reqs.forEach(req => {
      const uid = req.userId;
      if (!customerMap[uid]) {
        customerMap[uid] = {
          userId: uid,
          userName: req.userName || req.user?.name || 'Unknown Client',
          activeRequests: [],
          completedRequests: [],
          totalTickets: 0
        };
      }

      customerMap[uid].totalTickets += 1;
      if (req.status === RepairRequestStatus.COMPLETED) {
        customerMap[uid].completedRequests.push(req);
      } else {
        customerMap[uid].activeRequests.push(req);
      }
    });

    return Object.values(customerMap).sort((a, b) => b.totalTickets - a.totalTickets);
  };

  const loadPortfolios = async () => {
    if (session?.userId) {
      setLoading(true);
      setError(null);
      try {
        const history = await repairApi.getTechnicianHistory();
        const portfolioList = buildPortfolios(history.data);
        setPortfolios(portfolioList);

        if (portfolioList.length > 0 && !selectedUserId) {
          setSelectedUserId(portfolioList[0].userId);
        }
      } catch (err) {
        console.error('Error generating customer history portfolio:', err);
        setError('Failed to load customer history. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const retryLoad = () => loadPortfolios();

  useEffect(() => {
    loadPortfolios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const activePortfolio = portfolios.find(p => p.userId === selectedUserId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Customer CRM & History Ledger</h2>
        <p className="text-slate-400">Review distinct system profiles, historic tickets, and telemetry snapshots submitted by your clients.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl border border-white/5 p-4 h-[500px] animate-pulse">
            <div className="h-3 bg-white/10 rounded w-1/2 mb-4"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-lg mb-2"></div>
            ))}
          </div>
          <div className="md:col-span-2 glass rounded-2xl border border-white/5 p-6 h-[500px] animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-2/3 mb-8"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-12 text-center glass rounded-xl border border-rose-500/20">
          <p className="text-rose-400 mb-3">{error}</p>
          <button onClick={retryLoad} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
            Retry
          </button>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="p-12 text-center glass rounded-2xl border border-white/5 space-y-3">
           <div className="w-12 h-12 rounded-full bg-slate-800/40 text-slate-500 flex items-center justify-center mx-auto">
             {Icons.users || Icons.user}
           </div>
           <p className="text-sm text-slate-500 font-medium">No customers registered in your database history. Accepting or starting tickets creates profiles automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl border border-white/5 p-4 space-y-3 h-[500px] overflow-y-auto scrollbar-hide">
             <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2 pb-1">Client Rolodex ({portfolios.length})</h3>
             <div className="space-y-1">
                {portfolios.map(p => (
                   <div
                     key={p.userId}
                     onClick={() => setSelectedUserId(p.userId)}
                     className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                        selectedUserId === p.userId
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-transparent border-transparent hover:bg-white/5'
                     }`}
                   >
                      <div className="min-w-0 flex-1">
                         <h4 className="font-bold text-slate-100 text-sm truncate">{p.userName}</h4>
                         <span className="text-[10px] text-slate-500 font-mono">Active: {p.activeRequests.length} | Resolved: {p.completedRequests.length}</span>
                      </div>

                      <div className="text-right shrink-0">
                         <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            {p.totalTickets} Jobs
                         </span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="md:col-span-2 glass rounded-2xl border border-white/5 p-6 space-y-6 h-[500px] overflow-y-auto scrollbar-hide">
             {activePortfolio ? (
                <div className="space-y-6">
                   <div className="border-b border-white/5 pb-4 flex justify-between items-center flex-wrap gap-2">
                      <div>
                         <h3 className="text-xl font-bold text-white tracking-tight">{activePortfolio.userName}</h3>
                         <span className="text-xs text-amber-400 font-medium">Registered Client Workspace Portfolio</span>
                      </div>
                      <div className="flex gap-2">
                         <div className="text-center bg-[#020617]/50 border border-white/5 px-3 py-1.5 rounded-lg">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">Active Backlog</span>
                            <span className="text-sm font-bold text-amber-500">{activePortfolio.activeRequests.length}</span>
                         </div>
                         <div className="text-center bg-[#020617]/50 border border-white/5 px-3 py-1.5 rounded-lg">
                            <span className="text-[9px] uppercase font-bold text-slate-500 block">SLA Resolved</span>
                            <span className="text-sm font-bold text-emerald-400">{activePortfolio.completedRequests.length}</span>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                         Active Workflows
                      </h4>

                      {activePortfolio.activeRequests.length === 0 ? (
                         <p className="text-xs text-slate-500 py-2">No active support backlog for this client.</p>
                      ) : (
                         <div className="space-y-2">
                            {activePortfolio.activeRequests.map(ar => (
                               <div key={ar.id} className="bg-[#020617]/50 rounded-xl p-3 border border-white/5 text-xs space-y-2">
                                  <div className="flex justify-between items-center">
                                     <h5 className="font-bold text-slate-200">{ar.gigTitle || 'Expert Repair'}</h5>
                                     <span className="font-semibold text-amber-400 uppercase tracking-widest text-[9px] bg-amber-400/10 px-1.5 py-0.5 rounded">
                                        {ar.status.replace(/_/g, ' ')}
                                     </span>
                                  </div>
                                  <p className="text-slate-400 leading-normal">{ar.issueDescription}</p>
                                  {ar.severityLevel && (
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border
                                      ${ar.severityLevel === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                        ar.severityLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                                    `}>
                                      {ar.severityLevel}
                                    </span>
                                  )}
                               </div>
                            ))}
                         </div>
                      )}
                   </div>

                   <div className="space-y-3 border-t border-white/5 pt-5">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                         SLA Resolution Archive
                      </h4>

                      {activePortfolio.completedRequests.length === 0 ? (
                         <p className="text-xs text-slate-500 py-2">No resolved support records for this client.</p>
                      ) : (
                         <div className="space-y-2">
                            {activePortfolio.completedRequests.map(cr => (
                               <div key={cr.id} className="bg-[#020617]/50 rounded-xl p-3 border border-white/5 text-xs space-y-2">
                                  <div className="flex justify-between items-center">
                                     <h5 className="font-bold text-slate-300">{cr.gigTitle || 'System Optimization'}</h5>
                                     <span className="font-semibold text-emerald-400 uppercase tracking-widest text-[9px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        Resolved
                                     </span>
                                  </div>
                                  <p className="text-slate-400 leading-normal">{cr.issueDescription}</p>
                                  {cr.technicianNote && (
                                     <div className="mt-1 pt-1.5 border-t border-white/5 text-slate-500 italic">
                                        Note: "{cr.technicianNote}"
                                     </div>
                                  )}
                               </div>
                            ))}
                         </div>
                      )}
                   </div>
                </div>
             ) : (
                <div className="text-center text-slate-500 py-12">Select a client from the rolodex to show active folders.</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};
