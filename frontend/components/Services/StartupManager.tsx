
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface StartupItem {
  name: string;
  impact: string;
  status: string;
  time: string;
  boot_time_s: number;
}

interface StartupAnalytics {
  totalBootPenalty: string;
  potentialSaving: string;
  uptime: string;
}

const StartupManager: React.FC = () => {
  const [bootTime, setBootTime] = useState<number>(0);
  const [domReady, setDomReady] = useState<number>(0);
  const [startups, setStartups] = useState<StartupItem[]>([]);
  const [analytics, setAnalytics] = useState<StartupAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.performance && window.performance.timing) {
      const t = window.performance.timing;
      const startup = t.loadEventEnd - t.navigationStart;
      const dom = t.domContentLoadedEventEnd - t.navigationStart;
      if (startup > 0) setBootTime(startup / 1000);
      if (dom > 0) setDomReady(dom / 1000);
    }
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/v1/startup/services');
        const d = res.data?.data ?? res.data;
        if (d.services) setStartups(d.services);
        if (d.analytics) setAnalytics(d.analytics);
      } catch (err) {
        console.error('[StartupManager] Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const toggleStartup = async (name: string) => {
    try {
      await api.post(`/v1/startup/services/${encodeURIComponent(name)}/toggle`);
      setStartups(prev => prev.map(s =>
        s.name === name ? { ...s, status: s.status === 'Enabled' ? 'Disabled' : 'Enabled' } : s
      ));
    } catch (err) {
      console.error('[StartupManager] Toggle failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Startup Manager</h1>
          <p className="text-slate-400 mt-1">Real-world analysis of application boot latency and service orchestration.</p>
        </div>
        <div className="glass px-6 py-4 rounded-3xl border border-white/5 flex items-center gap-8 shadow-2xl">
          <div className="text-center">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">App Initialized</p>
             <p className="text-2xl font-black mono text-indigo-400">{bootTime > 0 ? bootTime.toFixed(2) : '--'}s</p>
          </div>
          <div className="h-10 w-px bg-white/10"></div>
          <div className="text-center">
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">DOM Interactive</p>
             <p className="text-2xl font-black mono text-emerald-400">{domReady > 0 ? domReady.toFixed(2) : '--'}s</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/30">
              <h3 className="font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                Service Boot Order
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {startups.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">Loading services...</div>
              ) : (
                startups.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-500 border border-white/5">
                          {item.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-100">{item.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${item.impact === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                              {item.impact}
                            </span>
                            <span className="text-[10px] text-slate-500 mono bg-white/5 px-2 py-0.5 rounded">Penalty: {item.time}</span>
                          </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                       <div className="flex items-center gap-3">
                         <span className={`text-[10px] uppercase font-bold tracking-widest ${item.status === 'Enabled' ? 'text-indigo-400' : 'text-slate-600'}`}>{item.status}</span>
                         <button 
                           onClick={() => toggleStartup(item.name)}
                           className={`w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${item.status === 'Enabled' ? 'bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'bg-slate-700'}`}
                         >
                           <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${item.status === 'Enabled' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                         </button>
                       </div>
                     </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/5">
          <h3 className="font-bold mb-4 uppercase text-[10px] tracking-widest text-slate-500">Boot Analytics</h3>
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="space-y-2">
                  <div className="w-24 h-3 bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-slate-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Active Boot Penalty</span>
                  <span className="text-indigo-400">{analytics?.totalBootPenalty ?? 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Potential Saving</span>
                  <span className="text-emerald-400">{analytics?.potentialSaving ?? 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5">
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "Disabling high-impact items could save an additional {analytics?.potentialSaving ?? 'N/A'}."
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartupManager;
