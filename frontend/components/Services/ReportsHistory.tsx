
import React, { useState } from 'react';
import { useTelemetry } from '../../services/telemetryStore';
import LastUpdated from '../Common/LastUpdated';

type FilterTab = 'all' | 'today' | '7days' | '30days';
type CategoryFilter = 'all' | 'security' | 'performance' | 'repair' | 'user' | 'hardware';

const ReportsHistory: React.FC = () => {
  const { state } = useTelemetry();
  const data = state.analytics;
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [exporting, setExporting] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getSourceIcon = (source: string) => {
    const map: Record<string, string> = {
      repair: '🔧', security: '🛡️', performance: '⚡', user: '👤',
      hardware: '🖥️', system: '⚙️', network: '🌐', storage: '💾',
      health: '💓', repair_request: '📋',
    };
    return map[source] || '📌';
  };

  const getSourceColor = (source: string) => {
    const map: Record<string, string> = {
      repair: 'text-blue-400', security: 'text-rose-400', performance: 'text-amber-400',
      user: 'text-purple-400', hardware: 'text-cyan-400', system: 'text-emerald-400',
      network: 'text-indigo-400', storage: 'text-teal-400', health: 'text-pink-400',
    };
    return map[source] || 'text-slate-400';
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      completed: 'text-emerald-400', active: 'text-blue-400', pending: 'text-amber-400',
      submitted: 'text-slate-400', assigned: 'text-purple-400', 'in_progress': 'text-cyan-400',
      cancelled: 'text-rose-400',
    };
    return map[status] || 'text-slate-400';
  };

  const filterTimeline = (items: typeof data.timeline) => {
    const now = new Date();
    let filtered = items;
    if (filterTab === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = items.filter(i => new Date(i.timestamp) >= todayStart);
    } else if (filterTab === '7days') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      filtered = items.filter(i => new Date(i.timestamp) >= weekAgo);
    } else if (filterTab === '30days') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      filtered = items.filter(i => new Date(i.timestamp) >= monthAgo);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.source === categoryFilter);
    }
    return filtered;
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartpcub-report-${format}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const timeline = filterTimeline(data.timeline);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & History</h1>
          <p className="text-slate-400 mt-1">Executive Intelligence Dashboard — consolidated analytics from all modules.</p>
          <LastUpdated timestamp={state.lastUpdated} isRefreshing={state.isRefreshing} className="mt-1" />
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${state.isRefreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
        </div>
      </header>

      {/* SECTION 1: System Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: 'System Health', value: data.summary.performanceScore + '%', color: getScoreColor(data.summary.performanceScore) },
          { label: 'Security Score', value: data.summary.securityScore + '%', color: getScoreColor(data.summary.securityScore) },
          { label: 'CPU Average', value: data.summary.cpu.toFixed(1) + '%', color: data.summary.cpu > 75 ? 'text-rose-400' : 'text-emerald-400' },
          { label: 'RAM Usage', value: data.summary.ramPercent + '%', color: data.summary.ramPercent > 85 ? 'text-rose-400' : 'text-emerald-400' },
          { label: 'Storage Usage', value: data.summary.diskPercent + '%', color: data.summary.diskPercent > 90 ? 'text-rose-400' : 'text-emerald-400' },
        ].map((card, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{card.label}</p>
            <p className={`text-xl font-bold mono ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: 'Uptime', value: data.summary.uptime },
          { label: 'Backend Status', value: data.summary.apiStatus },
          { label: 'Database Status', value: data.summary.dbStatus },
          { label: 'Total Repairs', value: String(data.summary.totalRepairs) },
          { label: 'Active Users', value: String(data.summary.totalUsers) },
        ].map((card, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{card.label}</p>
            <p className="text-lg font-bold text-slate-200">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: 'Laravel API', value: data.api.laravelVersion },
          { label: 'PHP Version', value: data.api.phpVersion },
          { label: 'Windows Status', value: data.api.status || 'Online' },
          { label: 'Last Scan', value: data.summary.lastScan ? new Date(data.summary.lastScan).toLocaleTimeString() : 'N/A' },
          { label: 'Report Generated', value: data.summary.serverTime ? new Date(data.summary.serverTime).toLocaleTimeString() : 'N/A' },
        ].map((card, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">{card.label}</p>
            <p className="text-sm font-bold text-slate-200">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['all', 'today', '7days', '30days'] as FilterTab[]).map(tab => (
            <button key={tab} onClick={() => setFilterTab(tab)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${filterTab === tab ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {tab === 'all' ? 'All Time' : tab === 'today' ? 'Today' : tab === '7days' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['all', 'security', 'performance', 'repair', 'user', 'hardware'] as CategoryFilter[]).map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${categoryFilter === cat ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: System Timeline */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
          <h3 className="font-bold">System Timeline</h3>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{timeline.length} events</span>
        </div>
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {timeline.length === 0 ? (
            <p className="text-center py-12 text-slate-600 italic">No events recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {timeline.map((log, i) => (
                <div key={i} className="relative pl-8 border-l border-white/10 pb-4 last:pb-0">
                  <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-[#020617] ${
                    log.type === 'success' ? 'bg-emerald-500' : log.type === 'warn' ? 'bg-amber-500' : log.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getSourceIcon(log.source)}</span>
                        <span className={`text-[10px] font-bold uppercase ${getSourceColor(log.source)}`}>{log.source}</span>
                        <span className="text-[10px] text-slate-700 font-bold">•</span>
                        <h4 className="font-bold text-slate-200 text-sm">{log.message}</h4>
                      </div>
                      {log.details && <p className="text-xs text-slate-500 mt-1 ml-7">{log.details}</p>}
                      {log.actor && <p className="text-[10px] text-slate-600 mt-1 ml-7">by {log.actor}</p>}
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Security History */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
          <h3 className="font-bold">Security History</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold mono ${getScoreColor(data.security.score)}`}>{data.security.score}%</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">Windows Defender</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${data.security.defenderEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <span className="text-sm font-bold text-slate-200">{data.security.defenderEnabled ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">Firewall Profiles</p>
              <div className="space-y-1">
                {data.security.firewallProfiles.map((fw, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{fw.profile}</span>
                    <span className={`text-xs font-bold ${fw.state === 'ON' ? 'text-emerald-400' : 'text-rose-400'}`}>{fw.state}</span>
                  </div>
                ))}
              </div>
            </div>
            {data.security.services.map((svc, i) => (
              <div key={i} className="glass p-4 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">{svc.name}</p>
                <span className={`text-sm font-bold ${svc.status === 'Running' || svc.status === 'Enabled' ? 'text-emerald-400' : 'text-rose-400'}`}>{svc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Performance History */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
          <h3 className="font-bold">Performance History</h3>
          <span className={`text-2xl font-bold mono ${getScoreColor(data.performance.score)}`}>{data.performance.score}%</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">CPU</p>
              <p className={`text-xl font-bold mono ${data.performance.cpu > 75 ? 'text-rose-400' : 'text-emerald-400'}`}>{data.performance.cpu}%</p>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2"><div className={`h-full rounded-full ${getScoreBg(data.performance.score)}`} style={{width: `${data.performance.cpu}%`}}></div></div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">RAM</p>
              <p className={`text-xl font-bold mono ${data.performance.ramPercent > 85 ? 'text-rose-400' : 'text-emerald-400'}`}>{data.performance.ramPercent}%</p>
              <p className="text-[10px] text-slate-600">{data.performance.ramFreeMB}MB free / {data.performance.ramTotalMB}MB total</p>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2"><div className={`h-full rounded-full ${data.performance.ramPercent > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${data.performance.ramPercent}%`}}></div></div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Disk</p>
              <p className={`text-xl font-bold mono ${data.performance.diskPercent > 90 ? 'text-rose-400' : 'text-emerald-400'}`}>{data.performance.diskPercent}%</p>
              <p className="text-[10px] text-slate-600">{data.performance.diskFreeGB}GB free / {data.performance.diskTotalGB}GB total</p>
              <div className="w-full h-1 bg-slate-800 rounded-full mt-2"><div className={`h-full rounded-full ${data.performance.diskPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${data.performance.diskPercent}%`}}></div></div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Uptime</p>
              <p className="text-xl font-bold mono text-slate-200">{data.performance.uptime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: Hardware History */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">Hardware & System Info</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Repairs', value: data.repairs.total },
              { label: 'Completed', value: data.repairs.completed },
              { label: 'Active', value: data.repairs.active },
              { label: 'Technicians', value: data.summary.totalTechnicians },
              { label: 'Admins', value: data.summary.totalAdmins },
              { label: 'Gigs Listed', value: data.summary.totalGigs },
              { label: 'PC Builds', value: data.summary.totalBuilds },
              { label: 'Lifecycle Events', value: data.summary.totalLifecycleEvents },
            ].map((item, i) => (
              <div key={i} className="glass p-3 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{item.label}</p>
                <p className="text-lg font-bold text-slate-200">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: Service History */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">Service History — Recent Repair Requests</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-white/5">
                <th className="text-left pb-3">Customer</th>
                <th className="text-left pb-3">Technician</th>
                <th className="text-left pb-3">Category</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-left pb-3">Severity</th>
                <th className="text-left pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.repairs.recentRepairs.map((repair, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-slate-200 font-medium">{repair.customer}</td>
                  <td className="py-3 text-slate-400">{repair.technician}</td>
                  <td className="py-3 text-slate-400">{repair.issueCategory || '—'}</td>
                  <td className="py-3"><span className={`font-bold ${getStatusColor(repair.status)}`}>{repair.status}</span></td>
                  <td className="py-3">
                    <span className={`text-xs font-bold ${repair.severity === 'high' ? 'text-rose-400' : repair.severity === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {repair.severity || '—'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs">{new Date(repair.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.repairs.recentRepairs.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-600 italic">No repair requests yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 7: Database Health */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">Database Health</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Connection</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${data.database.connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <span className="text-sm font-bold text-slate-200">{data.database.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Driver</p>
              <p className="text-sm font-bold text-slate-200">{data.database.driver}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Total Records</p>
              <p className="text-sm font-bold text-slate-200">{data.database.totalRecords}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">DB Size</p>
              <p className="text-sm font-bold text-slate-200">{data.database.dbSizeKB} KB</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(data.database.tableCounts).map(([table, count]) => (
              <div key={table} className="glass p-3 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-400">{table}</span>
                <span className="text-xs font-bold text-slate-200">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 8: API Analytics */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">API Analytics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-bold text-emerald-400">{data.api.status}</span>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Total Users</p>
              <p className="text-sm font-bold text-slate-200">{data.api.totalUsers}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Total Tokens</p>
              <p className="text-sm font-bold text-slate-200">{data.api.totalTokens}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Active Tokens (24h)</p>
              <p className="text-sm font-bold text-slate-200">{data.api.activeTokens}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 9: Audit Logs */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">Audit Logs</h3>
        </div>
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {data.auditLogs.length === 0 ? (
            <p className="text-center py-8 text-slate-600 italic">No audit logs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {data.auditLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.type === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                    log.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-indigo-500/10 text-indigo-400'
                  }`}>{log.source}</span>
                  <span className="text-sm text-slate-200 flex-1">{log.message}</span>
                  <span className="text-[10px] text-slate-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 10: Export Report */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">Export Report</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-3">
            {['JSON', 'Full Diagnostic'].map((format) => (
              <button key={format} onClick={() => handleExport(format.toLowerCase().replace(' ', '-'))}
                disabled={exporting}
                className="px-6 py-2.5 glass border border-white/10 rounded-xl font-bold hover:bg-white/5 text-sm transition-all disabled:opacity-50">
                Export {format}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3">Reports include: System Health, Security, Performance, Storage, Network, Hardware, Database, Repair Statistics, Audit Logs, Time Generated, System Information.</p>
        </div>
      </div>

      {/* SECTION 13: Persistence */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <h3 className="font-bold">Persistence</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Storage Backend</p>
              <p className="text-sm font-bold text-emerald-400">Laravel Database</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Database Driver</p>
              <p className="text-sm font-bold text-slate-200">{data.database.driver}</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Log Count</p>
              <p className="text-sm font-bold text-slate-200">{data.auditLogs.length} entries</p>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Last Sync</p>
              <p className="text-sm font-bold text-slate-200">{new Date(state.lastUpdated).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 14: Examiner Mode — System Information Summary */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/2">
          <h3 className="font-bold">System Information Summary (Examiner View)</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">Platform</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Laravel</span><span className="text-slate-200 font-bold">{data.api.laravelVersion}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">PHP</span><span className="text-slate-200 font-bold">{data.api.phpVersion}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Database</span><span className="text-slate-200 font-bold">{data.database.driver}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Response Time</span><span className="text-slate-200 font-bold">{data.collectionDurationMs}ms</span></div>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">Operations Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Users</span><span className="text-slate-200 font-bold">{data.summary.totalUsers}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Technicians</span><span className="text-slate-200 font-bold">{data.summary.totalTechnicians}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Repairs</span><span className="text-slate-200 font-bold">{data.summary.totalRepairs}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Completed</span><span className="text-slate-200 font-bold">{data.summary.completedRepairs}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Gigs</span><span className="text-slate-200 font-bold">{data.summary.totalGigs}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">PC Builds</span><span className="text-slate-200 font-bold">{data.summary.totalBuilds}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsHistory;
