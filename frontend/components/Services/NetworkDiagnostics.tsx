
import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';
import { RequestTechnicianHelp } from './RequestTechnicianHelp';

const NetworkDiagnostics: React.FC = () => {
  const { state, refreshNow } = useTelemetry();
  const netData = state.network;
  const [chartHistory, setChartHistory] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const prevBytesRef = useRef<{ in: number; out: number; time: number } | null>(null);
  const [throughput, setThroughput] = useState({ down: 0, up: 0 });

  useEffect(() => {
    if (!netData) return;
    const now = Date.now();
    const currentBytes = netData.netStats;
    if (prevBytesRef.current) {
      const elapsed = (now - prevBytesRef.current.time) / 1000;
      if (elapsed > 0) {
        const bytesInDelta = currentBytes.bytesReceived - prevBytesRef.current.in;
        const bytesOutDelta = currentBytes.bytesSent - prevBytesRef.current.out;
        const downMbps = Math.max(0, (bytesInDelta * 8) / (elapsed * 1000000));
        const upMbps = Math.max(0, (bytesOutDelta * 8) / (elapsed * 1000000));
        setThroughput({ down: parseFloat(downMbps.toFixed(2)), up: parseFloat(upMbps.toFixed(2)) });
      }
    }
    prevBytesRef.current = { in: currentBytes.bytesReceived, out: currentBytes.bytesSent, time: now };
    setChartHistory(prev => {
      const entry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        val: parseFloat(((currentBytes.bytesReceived) / 1048576).toFixed(2)),
      };
      return [...prev, entry].slice(-20);
    });
  }, [netData]);

  const runLatencyTest = async () => {
    setIsTesting(true);
    refreshNow();
    setTimeout(() => setIsTesting(false), 500);
  };

  const getSnapshot = () => ({
    latency: netData.latency,
    activeAdapter: netData.activeAdapter?.name ?? 'N/A',
    quality: netData.connectionQuality,
    adapters: netData.adapters.length,
  });

  const active = netData.activeAdapter;
  const latency = netData.latency;
  const quality = netData.connectionQuality;
  const gateway = netData.gateway;
  const dns = netData.dns;

  const protocolHealth = [
    { label: 'DNS Resolve', val: dns || 'Unavailable', ok: !!dns },
    { label: 'Internet Reachable', val: netData.internetReachable ? 'Yes' : 'No', ok: netData.internetReachable },
    { label: 'Gateway Reachable', val: gateway || 'Unavailable', ok: !!gateway },
    { label: 'Adapter Status', val: active?.status ?? 'N/A', ok: active?.status === 'Connected' },
    { label: 'DHCP', val: active?.dhcp ? 'Enabled' : 'Static', ok: true },
    { label: 'IPv4', val: active?.ipv4 ?? 'N/A', ok: !!active?.ipv4 },
    { label: 'IPv6', val: active?.ipv6 ?? 'N/A', ok: !!active?.ipv6 },
    { label: 'Connection Quality', val: quality, ok: quality === 'Excellent' || quality === 'Good' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Network Forensics</h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">Real-time bandwidth auditing and packet latency diagnostics.</p>
          <LastUpdated timestamp={state.lastUpdated} isRefreshing={state.isRefreshing} className="mt-1" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <RequestTechnicianHelp moduleName="Network Diagnostics" getSnapshot={getSnapshot} />
          <button 
            onClick={runLatencyTest}
            disabled={isTesting}
            className="px-6 py-2 glass border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
          >
            {isTesting && <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>}
            {isTesting ? 'Analyzing...' : 'Recalibrate Latency'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-5 md:p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none hidden md:block">
            <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 leading-none">Throughput Timeline (Mbps)</h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
                   <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">IN: {throughput.down.toFixed(2)}</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase">OUT: {throughput.up.toFixed(2)}</span>
               </div>
            </div>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="val" stroke="#22d3ee" strokeWidth={4} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Active Latency</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-4xl font-black mono text-slate-100">{latency}<span className="text-sm font-normal text-slate-500">ms</span></p>
              <span className={`text-[10px] font-bold uppercase mb-1.5 ${latency < 40 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {latency < 0 ? 'Timeout' : latency < 40 ? 'Optimum' : latency < 80 ? 'Good' : 'Elevated'}
              </span>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">DNS Latency</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-4xl font-black mono text-slate-100">{netData.dnsLatency}<span className="text-sm font-normal text-slate-500">ms</span></p>
              <span className={`text-[10px] font-bold uppercase mb-1.5 ${netData.dnsLatency < 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {netData.dnsLatency < 0 ? 'Timeout' : netData.dnsLatency < 50 ? 'Fast' : 'Slow'}
              </span>
            </div>
          </div>
          
          <div className="glass p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Protocol Health</p>
            <div className="mt-4 space-y-3">
              {protocolHealth.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="mono font-bold text-slate-200 max-w-[120px] truncate">{item.val}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-slate-900/30 flex justify-between items-center">
          <h3 className="font-bold">Bandwidth Forensics</h3>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Active network adapters</span>
        </div>
        <div className="p-3">
          {netData?.adapters?.filter(a => a.status === 'Connected').map((adapter, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all">
               <div className="flex items-center gap-4">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${adapter.name.includes('Wi-Fi') ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                 </div>
                 <div>
                   <span className="font-bold text-slate-200 text-sm">{adapter.name}</span>
                   <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">{adapter.ipv4}</p>
                 </div>
               </div>
               <div className="flex gap-8">
                  <div className="text-right">
                     <p className="text-sm font-black text-cyan-400 mono">{netData.netStats.bytesReceived > 0 ? `${(netData.netStats.bytesReceived / 1048576).toFixed(0)} MB` : '0 MB'}</p>
                     <p className="text-[9px] uppercase font-bold text-slate-500">Received</p>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-purple-400 mono">{netData.netStats.bytesSent > 0 ? `${(netData.netStats.bytesSent / 1048576).toFixed(0)} MB` : '0 MB'}</p>
                     <p className="text-[9px] uppercase font-bold text-slate-500">Sent</p>
                  </div>
               </div>
            </div>
          ))}
          {(!netData.adapters || netData.adapters.filter(a => a.status === 'Connected').length === 0) && (
            <div className="text-center py-8 text-slate-600 text-sm">No active adapters</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnostics;
