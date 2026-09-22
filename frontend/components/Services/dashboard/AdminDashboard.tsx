import React, { useState, useEffect } from 'react';
import { adminApi, AdminUserData } from '../../../services/adminApi';
import { repairApi, RepairRequestData } from '../../../services/repairApi';
import { RepairRequestStatus, User } from '../../../types';
import { Icons } from '../../../constants';
import { useSystemHealthMonitor } from '../../../services/systemHealthMonitor';
import { useTelemetryMode } from '../../../services/diagnosticProvider';

export const AdminDashboard = ({ user }: { user: User }) => {
  const { metrics, score, breakdown, averageLatency, uptime, resetMetrics } = useSystemHealthMonitor();
  const { telemetryMode, isFallbackActive, setMode } = useTelemetryMode();
  const [apiVersion, setApiVersion] = useState('v1');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTechnicians: 0,
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
  });
  const [recentUsers, setRecentUsers] = useState<AdminUserData[]>([]);
  const [recentRequests, setRecentRequests] = useState<RepairRequestData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminStats = async () => {
    setLoading(true);
    try {
      const [usersRes, requestsRes] = await Promise.all([
        adminApi.listUsers({ per_page: 100 }),
        repairApi.list({ per_page: 100 }),
      ]);

      const allUsers = usersRes.data;
      const allRequests = requestsRes.data;

      const totalUsers = allUsers.filter(u => u.role === 'user').length;
      const totalTechnicians = allUsers.filter(u => u.role === 'technician').length;
      const totalRequests = allRequests.length;
      const completedRequests = allRequests.filter(r => r.status === RepairRequestStatus.COMPLETED).length;
      const activeRequests = allRequests.filter(
        r => r.status !== RepairRequestStatus.COMPLETED && r.status !== RepairRequestStatus.CANCELLED
      ).length;

      setStats({ totalUsers, totalTechnicians, totalRequests, activeRequests, completedRequests });

      // Show up to 5 of the newest users (matches backup: sort by createdAt desc)
      setRecentUsers(
        [...allUsers].sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())).slice(0, 5)
      );

      // Show up to 5 of the newest requests (matches backup: sort by createdAt desc)
      setRecentRequests(
        [...allRequests].sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime())).slice(0, 5)
      );
    } catch (err) {
      console.error('Error fetching admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminStats();
    const saved = localStorage.getItem('settings.apiVersion') || 'v1';
    setApiVersion(saved);
  }, []);

  const handleApiVersionChange = async (ver: string) => {
    setApiVersion(ver);
    localStorage.setItem('settings.apiVersion', ver);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Analyzing platform telemetry logs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">Sentinel Admin Workspace</h2>
          <p className="text-slate-400 font-medium text-sm md:text-base">Platform-wide overview, database volume indexes, and service statistics.</p>
        </div>
        <button
          onClick={loadAdminStats}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Reload Telemetry
        </button>
      </div>

      {/* SYSTEM SENTINEL HEALTH SCORE & TELEMETRY CONTROL */}
      <div className="glass p-5 rounded-xl border border-white/5 bg-gradient-to-r from-slate-950 to-indigo-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">System Sentinel Telemetry Engine</span>
            </div>
            <h3 className="text-lg font-bold text-white">Platform Health Diagnostics</h3>
            <p className="text-xs text-slate-400 max-w-2xl">
              Monitor active telemetry health metrics. Switch sources, manage Python API versions, and view real-time failsafe statistics.
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Mode Switcher */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Telemetry Source</span>
              <div className="flex bg-slate-900 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setMode('MOCK')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${telemetryMode === 'MOCK' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Mock
                </button>
                <button
                  type="button"
                  onClick={() => setMode('PYTHON')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${telemetryMode === 'PYTHON' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Python API
                </button>
              </div>
            </div>

            {/* Version Switcher */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">API Version</span>
              <div className="flex bg-slate-900 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleApiVersionChange('v1')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${apiVersion === 'v1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  v1
                </button>
                <button
                  type="button"
                  onClick={() => handleApiVersionChange('v2')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${apiVersion === 'v2' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  v2
                </button>
              </div>
            </div>

            {/* Reset metrics */}
            <button
              onClick={resetMetrics}
              className="mt-4 lg:mt-0 px-3 py-1.5 hover:bg-white/5 border border-white/5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold transition-all self-end"
            >
              Reset Stats
            </button>
          </div>
        </div>

        {/* Diagnostic Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-5 border-t border-white/5">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">Telemetry Health Score</span>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="px-1.5 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded text-[9px] text-indigo-300 border border-indigo-500/20 font-mono transition-all"
                title="Explain the score formula calculation"
              >
                {showBreakdown ? "[Hide]" : "[Explain]"}
              </button>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-black ${score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {score}/100
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center border-l border-white/5 pl-4">
            <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">Backend Uptime</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{uptime}%</span>
            </div>
          </div>

          <div className="flex flex-col justify-center border-l border-white/5 pl-4">
            <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">Average Latency</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-100">{averageLatency} ms</span>
            </div>
          </div>

          <div className="flex flex-col justify-center border-l border-white/5 pl-4">
            <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">Schema Faults</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold ${metrics.validationFailureCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {metrics.validationFailureCount}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center border-l border-white/5 pl-4">
            <span className="text-[10px] text-slate-400 font-semibold font-mono tracking-wider">Fallback Cycles</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-bold ${metrics.fallbackCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                {metrics.fallbackCount}
              </span>
            </div>
          </div>
        </div>

        {/* Explainable Score Formula Breakdown */}
        {showBreakdown && (
          <div className="mt-5 p-4 rounded-lg bg-slate-950/50 border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-indigo-300 font-mono tracking-wider uppercase">System Sentinel Health Score Formula breakdown</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
              {/* Latency Portion */}
              <div className="space-y-1 p-2 bg-white/[0.02] rounded border border-white/5">
                <div className="flex justify-between items-center font-semibold font-mono">
                  <span className="text-slate-350">API Latency</span>
                  <span className="text-emerald-400">{breakdown.latencyScore}/30 pts</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(breakdown.latencyScore / 30) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{breakdown.latencyDescription}</p>
              </div>

              {/* Uptime Portion */}
              <div className="space-y-1 p-2 bg-white/[0.02] rounded border border-white/5">
                <div className="flex justify-between items-center font-semibold font-mono">
                  <span className="text-slate-350">Uptime Stability</span>
                  <span className="text-emerald-400">{breakdown.uptimeScore}/25 pts</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(breakdown.uptimeScore / 25) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{breakdown.uptimeDescription}</p>
              </div>

              {/* Failure inverse portion */}
              <div className="space-y-1 p-2 bg-white/[0.02] rounded border border-white/5">
                <div className="flex justify-between items-center font-semibold font-mono">
                  <span className="text-slate-350">Transmission Rate</span>
                  <span className="text-emerald-400">{breakdown.failureRateScore}/20 pts</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(breakdown.failureRateScore / 20) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{breakdown.failureDescription}</p>
              </div>

              {/* Schema verification */}
              <div className="space-y-1 p-2 bg-white/[0.02] rounded border border-white/5">
                <div className="flex justify-between items-center font-semibold font-mono">
                  <span className="text-slate-350">Schema Safety</span>
                  <span className="text-emerald-400">{breakdown.schemaValidationScore}/15 pts</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(breakdown.schemaValidationScore / 15) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{breakdown.schemaDescription}</p>
              </div>

              {/* WebSocket connection portion */}
              <div className="space-y-1 p-2 bg-white/[0.02] rounded border border-white/5">
                <div className="flex justify-between items-center font-semibold font-mono">
                  <span className="text-slate-350">Realtime Stream</span>
                  <span className="text-emerald-400">{breakdown.websocketScore}/10 pts</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-indigo-500 h-full transition-all" style={{ width: `${(breakdown.websocketScore / 10) * 100}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{breakdown.websocketDescription}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="glass rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Users</span>
            <div className="p-1 px-1.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers}</div>
            <p className="text-[10px] text-slate-500 font-medium">Registered platform clients</p>
          </div>
        </div>

        {/* Total Technicians */}
        <div className="glass rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Technicians</span>
            <div className="p-1 px-1.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalTechnicians}</div>
            <p className="text-[10px] text-slate-500 font-medium">Certified diagnostic engineers</p>
          </div>
        </div>

        {/* Total Repair Requests */}
        <div className="glass rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Total Requests</span>
            <div className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalRequests}</div>
            <p className="text-[10px] text-slate-500 font-medium">All-time logged hardware service entries</p>
          </div>
        </div>

        {/* Active Requests */}
        <div className="glass rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active Requests</span>
            <div className="p-1 px-1.5 bg-sky-500/10 text-sky-400 rounded border border-sky-500/10">
              <span className="relative flex h-2 w-2 mr-0.5 inline-block">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-sky-400 mb-1">{stats.activeRequests}</div>
            <p className="text-[10px] text-slate-500 font-medium font-semibold">Under active workspace triage</p>
          </div>
        </div>

        {/* Completed Requests */}
        <div className="glass rounded-xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Completed SLA</span>
            <div className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.completedRequests}</div>
            <p className="text-[10px] text-slate-500 font-medium">Closed and certified resolves</p>
          </div>
        </div>
      </div>

      {/* Lists of users and logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Registered Accounts */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Recently Registered Accounts</h3>
            <span className="text-xs text-slate-400">{recentUsers.length} total entries</span>
          </div>
          <div className="p-4 divide-y divide-white/5">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No users registered on the platform.</div>
            ) : (
              recentUsers.map(u => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-100">{u.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${
                      u.role === 'admin'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : u.role === 'technician'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Platform Repair Requests */}
        <div className="glass rounded-xl border border-white/5 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Recent Service Tickets</h3>
            <span className="text-xs text-slate-400">{stats.totalRequests} overall</span>
          </div>
          <div className="p-4 divide-y divide-white/5">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No logged repair tickets discovered.</div>
            ) : (
              recentRequests.map(r => (
                <div key={r.id} className="py-2.5 flex justify-between items-center text-xs gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-slate-100 truncate">{r.gigTitle || 'Diagnostic Maintenance'}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.issueDescription}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                      r.status === RepairRequestStatus.COMPLETED 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : r.status === RepairRequestStatus.CANCELLED
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}>
                      {r.status.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    <span className="block text-[9px] text-slate-500 font-semibold mt-1 font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
