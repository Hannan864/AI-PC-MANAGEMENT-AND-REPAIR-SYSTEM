
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';
import { RequestTechnicianHelp } from './RequestTechnicianHelp';

const StorageIntelligence: React.FC = () => {
  const { state, refreshNow } = useTelemetry();
  const combined = state.storage;
  const [scanning, setScanning] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const drives = combined.drives;
  const fileStats = combined.fileStats;

  useEffect(() => {
    if (drives.length === 0) return;
    if (!selectedDeviceId || !drives.find(d => d.deviceId === selectedDeviceId)) {
      const sysDrive = drives.find(d => d.isSystem) || drives[0];
      if (sysDrive) setSelectedDeviceId(sysDrive.deviceId);
    }
  }, [drives, selectedDeviceId]);

  const selectedDrive = drives.find(d => d.deviceId === selectedDeviceId) ?? null;

  const startDeepScan = async () => {
    setScanning(true);
    refreshNow();
    setTimeout(() => setScanning(false), 1000);
  };

  const getSnapshot = () => ({
    drives: drives.map(d => ({ id: d.deviceId, used: d.usedGB, total: d.totalGB })),
    fileStats,
    timestamp: Date.now(),
  });

  const chartData = selectedDrive
    ? [
        { name: 'Used Space', value: selectedDrive.usedGB, color: '#6366f1' },
        { name: 'Free Space', value: selectedDrive.freeGB, color: '#1e293b' },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Storage Intelligence</h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">Direct hardware volume analysis via File System Access.</p>
          <LastUpdated timestamp={state.lastUpdated} isRefreshing={state.isRefreshing} className="mt-1" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <RequestTechnicianHelp moduleName="Storage Intelligence" getSnapshot={getSnapshot} />
          <button 
            onClick={startDeepScan}
            disabled={scanning}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all disabled:bg-slate-800 disabled:text-slate-500 text-sm"
          >
            {scanning ? 'Analyzing...' : 'Start New Volume Scan'}
          </button>
        </div>
      </header>

      {/* Drive Selector */}
      {drives.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {drives.map(d => (
            <button
              key={d.deviceId}
              onClick={() => setSelectedDeviceId(d.deviceId)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedDrive?.deviceId === d.deviceId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {d.deviceId} — {d.volumeName}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 md:p-8 rounded-3xl flex flex-col items-center">
          <h3 className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Space Utilization</h3>
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={window.innerWidth < 768 ? 60 : 80} outerRadius={window.innerWidth < 768 ? 90 : 120} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-3xl md:text-4xl font-black mono text-slate-100">
              {selectedDrive ? `${selectedDrive.usedGB} GB / ${selectedDrive.totalGB} GB` : '-- GB'}
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
              {selectedDrive ? `${selectedDrive.usedPercent}% utilized — ${selectedDrive.volumeName}` : 'No drives detected'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Drive Details */}
          <div className="glass p-6 rounded-3xl">
            <h3 className="font-bold mb-4">Storage Details</h3>
            {selectedDrive ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Drive Name</span>
                  <span className="text-slate-200 font-bold">{selectedDrive.volumeName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">File System</span>
                  <span className="text-slate-200">{selectedDrive.fileSystem}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Total Size</span>
                  <span className="text-slate-200">{selectedDrive.totalGB} GB</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Used Size</span>
                  <span className="text-slate-200">{selectedDrive.usedGB} GB</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Free Size</span>
                  <span className="text-slate-200">{selectedDrive.freeGB} GB</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Health Status</span>
                  <span className={`font-bold ${
                    selectedDrive.health === 'Excellent' ? 'text-emerald-400' :
                    selectedDrive.health === 'Good' ? 'text-blue-400' :
                    selectedDrive.health === 'Warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}>{selectedDrive.health}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Read/Write</span>
                  <span className={selectedDrive.readWrite ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedDrive.readWrite ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Mount Status</span>
                  <span className={selectedDrive.mounted ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedDrive.mounted ? 'Mounted' : 'Not Mounted'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-600 py-8">No drive selected</div>
            )}
          </div>

          {/* File Analysis */}
          <div className="glass p-6 rounded-3xl">
            <h3 className="font-bold mb-4">File Analysis</h3>
            {fileStats ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Total Files (Desktop)</span>
                  <span className="text-slate-200 font-bold">{fileStats.totalFiles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Profile Folders</span>
                  <span className="text-slate-200 font-bold">{fileStats.totalFolders.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Scanned Size</span>
                  <span className="text-slate-200">{fileStats.totalSizeGB} GB</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">Avg File Size</span>
                  <span className="text-slate-200">{fileStats.averageFileSizeMB} MB</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Scan Duration</span>
                  <span className="text-indigo-400">{fileStats.scanDurationMs}ms</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-600 py-8">No scan data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageIntelligence;
