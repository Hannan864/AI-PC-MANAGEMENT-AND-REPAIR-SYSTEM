
import React, { useState } from 'react';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';

const SecurityStability: React.FC = () => {
  const { state, refreshNow } = useTelemetry();
  const data = state.security;
  const [scanning, setScanning] = useState(false);

  const loadData = async () => {
    setScanning(true);
    refreshNow();
    setTimeout(() => setScanning(false), 500);
  };

  const integrity = data.integrity;
  const events = data.events;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Security & Stability</h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">Monitor system integrity, event logs, and application crash heuristics.</p>
          <LastUpdated timestamp={state.lastUpdated} isRefreshing={state.isRefreshing} className="mt-1" />
        </div>
        <button 
          onClick={loadData}
          disabled={scanning}
          className="w-full md:w-auto px-6 py-2.5 glass border border-white/10 rounded-xl font-bold hover:bg-white/5 text-sm transition-all"
        >
          {scanning ? 'Scanning...' : 'Verify Secure Zones'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-3xl border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            System Integrity Check
            {data.score > 0 && (
              <span className={`ml-auto text-sm font-bold ${data.score >= 80 ? 'text-emerald-400' : data.score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {data.score}%
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {integrity.length === 0 && !state.isRefreshing && (
              <div className="text-center py-4 text-slate-600 text-xs">No security data available</div>
            )}
            {integrity.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white/2 rounded-xl border border-white/5">
                <span className="text-sm text-slate-300">{item.name}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  item.status === 'Active' || item.status === 'Enabled' || item.status === 'Running' || item.status === 'ON'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>{item.status}</span>
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={loadData}
            className="w-full mt-6 py-3 border border-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold uppercase hover:bg-indigo-500/5 transition-all"
          >
            Run Deep Integrity Scan
          </button>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-rose-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
             Critical Stability Events
          </h3>
          <div className="space-y-4">
            {events.length === 0 && !state.isRefreshing && (
              <div className="text-center py-4 text-slate-600 text-xs">No critical events detected</div>
            )}
            {events.map((evt) => (
              <div 
                key={evt.id} 
                className={`p-4 border rounded-2xl ${
                  evt.type === 'rose' 
                    ? 'bg-rose-500/5 border-rose-500/20' 
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <p className={`text-xs font-bold uppercase mb-1 ${evt.type === 'rose' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {evt.label}
                </p>
                <p className="text-sm text-slate-300">{evt.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityStability;
