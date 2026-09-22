
import React, { useState } from 'react';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';

const HardwareDrivers: React.FC = () => {
  const { state, refreshNow } = useTelemetry();
  const hw = state.hardware;
  const [scanning, setScanning] = useState(false);

  const loadHardware = async () => {
    setScanning(true);
    refreshNow();
    setScanning(false);
  };

  const gpus = hw.allGpus?.length > 0 ? hw.allGpus : [hw.gpu];
  const storageDevices = hw.allStorage?.length > 0 ? hw.allStorage : [hw.storage];

  const cards = [
    ...gpus.map((g, i) => ({
      category: gpus.length > 1 ? `GPU ${i + 1}` : 'GPU',
      name: g.name,
      version: g.driverVersion,
      status: g.status === 'OK' ? 'Healthy' : g.status || 'Healthy',
      detail: `${g.vramMB || 0} MB VRAM`,
    })),
    { category: 'CPU', name: hw.cpu.name, version: `${hw.cpu.cores} Cores / ${hw.cpu.threads} Threads`, status: 'Healthy', detail: `${hw.cpu.currentClockMHz || 0} MHz` },
    ...storageDevices.map((s, i) => ({
      category: storageDevices.length > 1 ? `Storage ${i + 1}` : 'Storage',
      name: s.model,
      version: `${s.capacityGB || 0} GB`,
      status: s.status === 'OK' ? 'Healthy' : s.status || 'Healthy',
      detail: s.interface,
    })),
    { category: 'Network', name: hw.network.name, version: `Driver ${hw.network.driverVersion}`, status: 'Connected', detail: hw.network.manufacturer },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hardware & Drivers</h1>
          <p className="text-slate-400 mt-1">Comprehensive inventory and health diagnostics for your physical components.</p>
          <LastUpdated timestamp={state.lastUpdated} isRefreshing={state.isRefreshing} className="mt-1" />
        </div>
        <button 
          onClick={loadHardware}
          disabled={scanning}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Scan for Updates'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item, i) => (
          <div key={i} className="glass p-5 rounded-2xl border-t-2 border-indigo-500/50">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.category}</p>
            <h4 className="font-bold text-slate-100 mt-1 truncate">{item.name}</h4>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[10px] text-slate-500 mono">{item.detail}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                item.status.includes('Update') ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Hardware Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-slate-900/30">
            <h3 className="font-bold">System Information</h3>
          </div>
          <div className="p-6 space-y-3 text-xs">
            {[
              { label: 'System', value: `${hw.system.manufacturer} ${hw.system.model}` },
              { label: 'Motherboard', value: `${hw.motherboard.manufacturer} ${hw.motherboard.model}` },
              { label: 'BIOS', value: `${hw.bios.manufacturer} ${hw.bios.version} (${hw.bios.date})` },
              { label: 'Windows', value: `${hw.os.name} Build ${hw.os.build}` },
              { label: 'Architecture', value: hw.os.architecture },
              { label: 'Installed RAM', value: `${hw.ram.totalGB} GB` },
              { label: 'RAM Sticks', value: hw.ram.sticks.map(s => `${s.slot}: ${s.capacityGB}GB ${s.type} ${s.speedMHz}MHz`).join(', ') },
              { label: 'Serial', value: hw.motherboard.serial },
            ].map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-slate-500">{item.label}</span>
                <span className="text-slate-200 text-right max-w-[60%] truncate">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hardware Scan History */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-slate-900/30">
            <h3 className="font-bold">Hardware Scan History</h3>
          </div>
          <div className="p-6 text-center text-slate-600 italic">
            {`Last scan: ${new Date(state.lastUpdated).toLocaleTimeString()} — ${hw.scanDurationMs}ms`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HardwareDrivers;
