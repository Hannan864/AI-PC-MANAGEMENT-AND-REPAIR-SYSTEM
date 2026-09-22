import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';
import { userHistoryApi, UserHistoryData } from '../../../services/userHistoryApi';

export const UserHistoryLog: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<UserHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await userHistoryApi.list({ per_page: 50 });
      setHistory(res.data);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'PC_BUILD': return <div className="p-1.5 rounded bg-lime-500/20 text-lime-400">{Icons.monitor}</div>;
      case 'REPAIR_REQUEST': return <div className="p-1.5 rounded bg-indigo-500/20 text-indigo-400">{Icons.briefcase}</div>;
      case 'DIAGNOSTIC': return <div className="p-1.5 rounded bg-amber-500/20 text-amber-400">{Icons.activity}</div>;
      default: return <div className="p-1.5 rounded bg-slate-500/20 text-slate-400">{Icons.clock}</div>;
    }
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Activity History</h2>
        <p className="text-slate-400">Timeline of your builds, repairs, and diagnostics.</p>
      </div>

      <div className="space-y-1">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 border border-white/5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-1/4"></div>
                    <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center glass rounded-xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
              {Icons.clock}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No History Yet</h3>
            <p className="text-slate-500">Your activity will appear here as you use the system.</p>
          </div>
        ) : (
          <div className="glass rounded-xl border border-white/5 divide-y divide-white/5">
            {history.map((item) => (
              <div key={item.historyId} className="flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors">
                <div className="shrink-0">
                  {getIconForType(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-600">•</span>
                    <span className="text-[10px] text-slate-500">{formatDate(item.timestamp)}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
