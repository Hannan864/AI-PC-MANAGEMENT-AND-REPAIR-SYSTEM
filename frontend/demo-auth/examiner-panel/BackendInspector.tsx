import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { DEMO_MODE } from '../demoConfig';

interface SystemInfo {
  backendOnline: boolean;
  laravelVersion: string;
  environment: string;
  dbDriver: string;
  apiVersion: string;
  responseTime: number;
  currentTime: string;
  apiBaseUrl: string;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
  id: string;
  authenticated: boolean;
}

interface HealthInfo {
  status: string;
  statusCode: number;
  responseTime: number;
  lastCheck: string;
}

interface DatabaseStats {
  users: number;
  technicians: number;
  admins: number;
  repairRequests: number;
  activeRequests: number;
  completedRequests: number;
  pcBuilds: number;
  gigs: number;
}

interface ApiCall {
  method: string;
  url: string;
  status: number;
  time: number;
  timestamp: string;
}

const BackendInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    backendOnline: false,
    laravelVersion: '11.x',
    environment: 'local',
    dbDriver: 'sqlite',
    apiVersion: 'v1',
    responseTime: 0,
    currentTime: new Date().toISOString(),
    apiBaseUrl: 'http://localhost:8000/api',
  });
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: '',
    email: '',
    role: '',
    id: '',
    authenticated: false,
  });
  const [health, setHealth] = useState<HealthInfo>({
    status: 'Checking...',
    statusCode: 0,
    responseTime: 0,
    lastCheck: '',
  });
  const [dbStats, setDbStats] = useState<DatabaseStats>({
    users: 0,
    technicians: 0,
    admins: 0,
    repairRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    pcBuilds: 0,
    gigs: 0,
  });
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'api' | 'workflow' | 'explain'>('system');

  const addApiCall = useCallback((method: string, url: string, status: number, time: number) => {
    const call: ApiCall = {
      method,
      url,
      status,
      time,
      timestamp: new Date().toLocaleTimeString(),
    };
    setApiCalls((prev) => [call, ...prev].slice(0, 20));
  }, []);

  const fetchHealth = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await api.get('/health');
      const elapsed = Date.now() - start;
      setHealth({
        status: 'Online',
        statusCode: res.status,
        responseTime: elapsed,
        lastCheck: new Date().toLocaleTimeString(),
      });
      setSystemInfo((prev) => ({ ...prev, backendOnline: true, responseTime: elapsed }));
      addApiCall('GET', '/health', res.status, elapsed);
    } catch {
      setHealth({
        status: 'Offline',
        statusCode: 0,
        responseTime: 0,
        lastCheck: new Date().toLocaleTimeString(),
      });
      setSystemInfo((prev) => ({ ...prev, backendOnline: false }));
    }
  }, [addApiCall]);

  const fetchUserInfo = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await api.get('/v1/auth/me');
      const elapsed = Date.now() - start;
      const u = res.data.data;
      setUserInfo({
        name: u.name,
        email: u.email,
        role: u.role,
        id: u.id?.slice(0, 8) || '',
        authenticated: true,
      });
      addApiCall('GET', '/v1/auth/me', res.status, elapsed);
    } catch {
      setUserInfo((prev) => ({ ...prev, authenticated: false }));
    }
  }, [addApiCall]);

  const fetchStats = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await api.get('/v1/admin/dashboard');
      const elapsed = Date.now() - start;
      const d = res.data.data;
      setDbStats({
        users: d.totalUsers || d.users || 0,
        technicians: d.technicianCount || d.technicians || 0,
        admins: d.adminCount || d.admins || 0,
        repairRequests: d.totalRepairs || d.repairRequests || 0,
        activeRequests: d.activeRepairs || d.activeRequests || 0,
        completedRequests: d.completedRepairs || d.completedRequests || 0,
        pcBuilds: d.totalBuilds || d.pcBuilds || 0,
        gigs: d.totalGigs || d.gigs || 0,
      });
      addApiCall('GET', '/v1/admin/dashboard', res.status, elapsed);
    } catch {
      // Stats unavailable for non-admin users
    }
  }, [addApiCall]);

  useEffect(() => {
    if (!isOpen) return;
    fetchHealth();
    fetchUserInfo();
    fetchStats();
    const interval = setInterval(() => {
      fetchHealth();
      fetchUserInfo();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen, fetchHealth, fetchUserInfo, fetchStats]);

  if (!DEMO_MODE || !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9998] bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg shadow-indigo-500/30 transition-all backdrop-blur-sm border border-indigo-400/30"
        title="Open Examiner Panel"
      >
        Inspector
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-[#0b0f19] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-indigo-600/20 to-purple-600/20">
          <div>
            <h2 className="text-lg font-bold text-white">Backend Inspector</h2>
            <p className="text-xs text-slate-400">FYP Examiner Dashboard — Read Only</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs font-bold ${systemInfo.backendOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {systemInfo.backendOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-xl leading-none">&times;</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['system', 'api', 'workflow', 'explain'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'system' ? 'System Status' : tab === 'api' ? 'API Monitor' : tab === 'workflow' ? 'Workflow' : 'Architecture'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* System Status Cards */}
              <InfoCard title="Backend" items={[
                { label: 'Status', value: systemInfo.backendOnline ? 'Online' : 'Offline', color: systemInfo.backendOnline ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'Laravel', value: systemInfo.laravelVersion },
                { label: 'Environment', value: systemInfo.environment },
                { label: 'API Version', value: systemInfo.apiVersion },
                { label: 'Response Time', value: `${systemInfo.responseTime}ms` },
                { label: 'Base URL', value: systemInfo.apiBaseUrl, small: true },
              ]} />
              <InfoCard title="Authentication" items={[
                { label: 'User', value: userInfo.name || 'Not logged in' },
                { label: 'Email', value: userInfo.email || '-', small: true },
                { label: 'Role', value: userInfo.role || '-' },
                { label: 'User ID', value: userInfo.id ? `${userInfo.id}...` : '-' },
                { label: 'Status', value: userInfo.authenticated ? 'Authenticated' : 'Unauthenticated', color: userInfo.authenticated ? 'text-emerald-400' : 'text-rose-400' },
              ]} />
              <InfoCard title="API Health" items={[
                { label: 'Status', value: health.status, color: health.status === 'Online' ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'HTTP Code', value: String(health.statusCode) },
                { label: 'Response Time', value: `${health.responseTime}ms` },
                { label: 'Last Check', value: health.lastCheck },
                { label: 'Database', value: systemInfo.dbDriver.toUpperCase() },
              ]} />
              <InfoCard title="Database Statistics" items={[
                { label: 'Total Users', value: String(dbStats.users) },
                { label: 'Technicians', value: String(dbStats.technicians) },
                { label: 'Admins', value: String(dbStats.admins) },
                { label: 'Repair Requests', value: String(dbStats.repairRequests) },
                { label: 'Active Requests', value: String(dbStats.activeRequests) },
                { label: 'Completed', value: String(dbStats.completedRequests) },
                { label: 'PC Builds', value: String(dbStats.pcBuilds) },
                { label: 'Gigs', value: String(dbStats.gigs) },
              ]} />
              <InfoCard title="Current Session" items={[
                { label: 'Login Time', value: new Date().toLocaleTimeString() },
                { label: 'Token', value: localStorage.getItem('access_token') ? 'Active' : 'None', color: localStorage.getItem('access_token') ? 'text-emerald-400' : 'text-rose-400' },
                { label: 'Storage', value: 'localStorage + Bearer' },
                { label: 'Auth Driver', value: 'Sanctum Token' },
              ]} />
              <InfoCard title="Request Monitor" items={apiCalls.slice(0, 5).map((c) => ({
                label: `${c.method} ${c.url}`,
                value: `${c.status} (${c.time}ms)`,
                color: c.status < 400 ? 'text-emerald-400' : 'text-rose-400',
                small: true,
              }))} empty="No requests yet" />
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Recent API Calls</h3>
              {apiCalls.length === 0 ? (
                <p className="text-slate-500 text-sm">No API calls recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {apiCalls.map((call, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2 text-xs">
                      <span className={`font-bold w-12 ${call.method === 'GET' ? 'text-emerald-400' : call.method === 'POST' ? 'text-blue-400' : 'text-amber-400'}`}>{call.method}</span>
                      <span className="text-slate-300 flex-1 font-mono">{call.url}</span>
                      <span className={`font-bold ${call.status < 400 ? 'text-emerald-400' : 'text-rose-400'}`}>{call.status}</span>
                      <span className="text-slate-500 w-16 text-right">{call.time}ms</span>
                      <span className="text-slate-600 w-20 text-right">{call.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4">Current Request Flow</h3>
                <div className="space-y-2 font-mono text-xs">
                  <FlowStep icon="1" label="React Component" detail="User clicks button" />
                  <FlowStep icon="2" label="API Client (Axios)" detail="POST /api/v1/auth/login" />
                  <FlowStep icon="3" label="Laravel Router" detail="routes/api.php" />
                  <FlowStep icon="4" label="Middleware" detail="Sanctum + RBAC check" />
                  <FlowStep icon="5" label="Controller" detail="AuthController@login" />
                  <FlowStep icon="6" label="Service Layer" detail="AuthService::login()" />
                  <FlowStep icon="7" label="Model / Eloquent" detail="User::where()" />
                  <FlowStep icon="8" label="SQLite Database" detail="Query execution" />
                  <FlowStep icon="9" label="JSON Response" detail="200 OK + Token" />
                  <FlowStep icon="10" label="React State" detail="AuthProvider updates" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explain' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExplainCard title="Technology Stack" items={[
                'Frontend: React 19 + TypeScript + Vite',
                'Backend: Laravel 11 + PHP 8.3',
                'Database: SQLite (portable, swappable)',
                'Auth: Laravel Sanctum (token-based)',
                'Styling: Tailwind CSS v4',
                'Build: Vite + Code Splitting',
              ]} />
              <ExplainCard title="Why Laravel?" items={[
                'Mature ecosystem with built-in auth',
                'Eloquent ORM for database abstraction',
                'Built-in API routing and middleware',
                'Service layer pattern for business logic',
                'Policy-based authorization (RBAC)',
                'Sanctum for SPA token authentication',
              ]} />
              <ExplainCard title="Authentication Flow" items={[
                '1. User submits credentials',
                '2. CSRF cookie initialized (Sanctum)',
                '3. Backend validates + hashes password',
                '4. Bearer token generated and returned',
                '5. Token stored in localStorage',
                '6. Sent in Authorization header on each request',
              ]} />
              <ExplainCard title="Role-Based Access Control" items={[
                'Three roles: Admin, Technician, Customer',
                'RoleMiddleware checks role on protected routes',
                'Policies define per-resource permissions',
                'Admin: full access to all resources',
                'Technician: assigned jobs + service history',
                'Customer: own requests + gig browsing',
              ]} />
              <ExplainCard title="REST API Design" items={[
                'Standard HTTP methods (GET/POST/PUT/DELETE)',
                'Consistent JSON response envelope',
                'Resource-based URL structure',
                'Stateless authentication (no sessions)',
                'CORS configured for frontend origin',
                'Sanctum for SPA-friendly token auth',
              ]} />
              <ExplainCard title="Data Storage" items={[
                'SQLite for development (file-based)',
                'MySQL/PostgreSQL for production',
                'Laravel Migrations for schema management',
                'Eloquent ORM for type-safe queries',
                'UUID primary keys for security',
                'Cascade relationships for data integrity',
              ]} />
              <ExplainCard title="AI Integration" items={[
                'Modular AI driver architecture',
                'Supports: Gemini API / Local rules',
                'AI triage for repair classification',
                'Severity scoring + priority routing',
                'Fallback: rule-based local analysis',
                'Configurable via .env (AI_ENABLED)',
              ]} />
              <ExplainCard title="System Scalability" items={[
                'Service layer separates business logic',
                'Repository pattern for data access',
                'API-first architecture (mobile-ready)',
                'Stateless design (horizontal scaling)',
                'Token auth (no server-side sessions)',
                'Modular frontend (code splitting)',
              ]} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoCard: React.FC<{ title: string; items: Array<{ label: string; value: string; color?: string; small?: boolean }>; empty?: string }> = ({ title, items, empty }) => (
  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h4>
    {items.length === 0 && empty ? (
      <p className="text-slate-600 text-xs">{empty}</p>
    ) : (
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-slate-500 text-xs">{item.label}</span>
            <span className={`text-xs font-medium ${item.color || 'text-white'} ${item.small ? 'font-mono text-[10px]' : ''}`}>{item.value}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const FlowStep: React.FC<{ icon: string; label: string; detail: string }> = ({ icon, label, detail }) => (
  <div className="flex items-center gap-3">
    <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-bold">{icon}</span>
    <span className="text-white font-semibold w-40">{label}</span>
    <span className="text-slate-400">{detail}</span>
  </div>
);

const ExplainCard: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">{title}</h4>
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
          <span className="text-indigo-500 mt-0.5">&#8226;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default BackendInspector;
