import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { ServiceType, Tab, Technician } from '../../types';
import { SERVICES, Icons } from '../../constants';

import { useAuth } from './AuthProvider';

// Lazy Components — each service chunk is loaded through a named loader so it
// can ALSO be preloaded in the background (see SERVICE_LOADERS below). This
// makes opening any sidebar service feel instant instead of hanging on the
// Suspense spinner while the module is fetched/compiled for the first time.
const loadTechnicianDashboard = () => import('../Services/dashboard/TechnicianDashboard').then(m => ({ default: m.TechnicianDashboard }));
const loadProfileScreen = () => import('../Services/auth/ProfileScreen').then(m => ({ default: m.ProfileScreen }));
const loadGigManagement = () => import('../Services/technician/GigManagement').then(m => ({ default: m.GigManagement }));
const loadIncomingRequestsTech = () => import('../Services/technician/IncomingRequestsTech').then(m => ({ default: m.IncomingRequestsTech }));
const loadIncomingBuildRequestsTech = () => import('../Services/technician/IncomingBuildRequestsTech').then(m => ({ default: m.IncomingBuildRequestsTech }));
const loadAssignedJobsTech = () => import('../Services/technician/AssignedJobsTech').then(m => ({ default: m.AssignedJobsTech }));
const loadActiveRepairsTech = () => import('../Services/technician/ActiveRepairsTech').then(m => ({ default: m.ActiveRepairsTech }));
const loadCompletedJobsTech = () => import('../Services/technician/CompletedJobsTech').then(m => ({ default: m.CompletedJobsTech }));
const loadServiceReportsTech = () => import('../Services/technician/ServiceReportsTech').then(m => ({ default: m.ServiceReportsTech }));
const loadCustomerHistoryTech = () => import('../Services/technician/CustomerHistoryTech').then(m => ({ default: m.CustomerHistoryTech }));
const loadPatientDossiers = () => import('../Services/technician/PatientDossiers').then(m => ({ default: m.PatientDossiers }));

const TechnicianDashboard = lazy(loadTechnicianDashboard);
const ProfileScreen = lazy(loadProfileScreen);
const GigManagement = lazy(loadGigManagement);
const IncomingRequestsTech = lazy(loadIncomingRequestsTech);
const IncomingBuildRequestsTech = lazy(loadIncomingBuildRequestsTech);
const AssignedJobsTech = lazy(loadAssignedJobsTech);
const ActiveRepairsTech = lazy(loadActiveRepairsTech);
const CompletedJobsTech = lazy(loadCompletedJobsTech);
const ServiceReportsTech = lazy(loadServiceReportsTech);
const CustomerHistoryTech = lazy(loadCustomerHistoryTech);
const PatientDossiers = lazy(loadPatientDossiers);

/** Every service chunk loader for this portal — warmed up in the background
 * after mount so sidebar navigation is instant. */
const SERVICE_LOADERS = [
  loadTechnicianDashboard, loadProfileScreen, loadGigManagement,
  loadIncomingRequestsTech, loadIncomingBuildRequestsTech, loadAssignedJobsTech,
  loadActiveRepairsTech, loadCompletedJobsTech, loadServiceReportsTech,
  loadCustomerHistoryTech, loadPatientDossiers,
];

/** Per-service chunk loaders keyed by ServiceType — lets a sidebar item
 * preload its module on hover so the click opens instantly. */
const SERVICE_PRELOADERS: Partial<Record<ServiceType, () => Promise<unknown>>> = {
  [ServiceType.DASHBOARD_TECH]: loadTechnicianDashboard,
  [ServiceType.ACCOUNT_PROFILE]: loadProfileScreen,
  [ServiceType.GIG_MANAGEMENT]: loadGigManagement,
  [ServiceType.INCOMING_REQUESTS]: loadIncomingRequestsTech,
  [ServiceType.INCOMING_BUILD_REQUESTS]: loadIncomingBuildRequestsTech,
  [ServiceType.ASSIGNED_JOBS]: loadAssignedJobsTech,
  [ServiceType.ACTIVE_REPAIRS]: loadActiveRepairsTech,
  [ServiceType.COMPLETED_JOBS]: loadCompletedJobsTech,
  [ServiceType.SERVICE_REPORTS]: loadServiceReportsTech,
  [ServiceType.CUSTOMER_HISTORY]: loadCustomerHistoryTech,
  [ServiceType.PATIENT_DOSSIERS]: loadPatientDossiers,
};

const ServiceSuspense: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
       <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
       <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Initializing Module...</p>
    </div>
  }>
    {children}
  </Suspense>
);

const TECH_SIDEBAR_GROUPS = [
  {
    title: 'Dashboard',
    services: [ServiceType.DASHBOARD_TECH]
  },
  {
    title: 'My Services',
    services: [
      ServiceType.GIG_MANAGEMENT
    ]
  },
  {
    title: 'Repair Center',
    services: [
      ServiceType.INCOMING_REQUESTS,
      ServiceType.INCOMING_BUILD_REQUESTS,
      ServiceType.ASSIGNED_JOBS,
      ServiceType.ACTIVE_REPAIRS,
      ServiceType.COMPLETED_JOBS
    ]
  },
  {
    title: 'Received Reports',
    services: [ServiceType.PATIENT_DOSSIERS]
  },
  {
    title: 'History & Reports',
    services: [
      ServiceType.SERVICE_REPORTS,
      ServiceType.CUSTOMER_HISTORY
    ]
  },
  {
    title: 'Account',
    services: [ServiceType.ACCOUNT_PROFILE]
  }
];

interface SidebarContentProps {
  userName?: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onOpenService: (serviceId: ServiceType) => void;
  onToggleCollapse: () => void;
}

// Defined at module level (not inside the layout) so its identity is stable
// across renders — a nested component would be remounted on every state
// change, which resets the sidebar's scroll position.
const SidebarContent: React.FC<SidebarContentProps> = ({ userName, isCollapsed, isMobileOpen, onOpenService, onToggleCollapse }) => (
  <>
    <div className="p-4 flex items-center gap-3 border-b border-white/5 bg-amber-500/5">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0">
        <span className="font-bold text-xs text-black">T</span>
      </div>
      {(!isCollapsed || isMobileOpen) && (
        <div className="flex flex-col min-w-0">
           <span className="font-semibold tracking-tight text-white leading-tight">Tech Portal</span>
           <span className="text-[10px] text-amber-400 font-medium tracking-widest uppercase truncate">{userName}</span>
        </div>
      )}
    </div>
    
    <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide px-3 space-y-6">
      {TECH_SIDEBAR_GROUPS.map((group, i) => (
         <div key={i} className="space-y-1">
           {(!isCollapsed || isMobileOpen) && (
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 pb-1">{group.title}</h4>
           )}
           {group.services.map(serviceId => {
             const service = SERVICES.find(s => s.id === serviceId);
             if (!service) return null;
             return (
               <button
                 key={service.id}
                 onClick={() => onOpenService(service.id)}
                 onMouseEnter={() => { const preload = SERVICE_PRELOADERS[service.id]; if (preload) preload().catch(() => {}); }}
                 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
               >
                 <span className={`${service.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                   {Icons[service.icon]}
                 </span>
                 {(!isCollapsed || isMobileOpen) && (
                   <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">{service.name}</span>
                 )}
               </button>
             );
           })}
         </div>
      ))}
    </nav>

    <div className="p-4 border-t border-white/5 hidden md:block">
      <button 
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400"
      >
        <div className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </div>
        {!isCollapsed && <span className="text-xs uppercase tracking-widest font-bold">Collapse</span>}
      </button>
    </div>
  </>
);

const TechnicianAppLayout: React.FC = () => {
  const { user, session, logout } = useAuth();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedTabs = JSON.parse(localStorage.getItem('tech_open_tabs') || 'null');
      const lastActive = localStorage.getItem('tech_active_tab');

      if (savedTabs && savedTabs.length > 0) {
        setTabs(savedTabs);
        setActiveTabId(lastActive || savedTabs[0].id);
      } else {
        const initial = { id: 'dashboard-tech-main', serviceId: ServiceType.DASHBOARD_TECH, title: 'Tech Dashboard', isLocked: true };
        setTabs([initial]);
        setActiveTabId('dashboard-tech-main');
      }
      setIsReady(true);
    };
    init();
  }, []);

  const openServiceRef = useRef<(serviceId: ServiceType) => void>(() => {});

  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      const serviceType = e.detail?.serviceType;
      if (serviceType) openServiceRef.current(serviceType as ServiceType);
    };
    window.addEventListener('smartpc:navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('smartpc:navigate', handleNavigate as EventListener);
  }, []);

  useEffect(() => {
    if (isReady) {
      localStorage.setItem('tech_open_tabs', JSON.stringify(tabs));
      localStorage.setItem('tech_active_tab', activeTabId);
    }
  }, [tabs, activeTabId, isReady]);

  // Warm up every service chunk in the background so opening any sidebar item
  // is instant instead of showing the "Initializing Module..." spinner while
  // the module is fetched/compiled for the first time. Preloading starts
  // immediately, and each sidebar item also preloads its own chunk on hover.
  useEffect(() => {
    SERVICE_LOADERS.forEach(load => load().catch(() => {}));
  }, []);

  const openService = (serviceId: ServiceType) => {
    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    const existingTab = tabs.find(t => t.serviceId === serviceId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      setIsMobileMenuOpen(false);
      return;
    }

    const newId = `${serviceId}-${Date.now()}`;
    const newTab: Tab = { id: newId, serviceId, title: service.name };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    setIsMobileMenuOpen(false);
  };

  openServiceRef.current = openService;

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const tabToClose = tabs.find(t => t.id === id);
    if (tabToClose?.isLocked) return;

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  if (!isReady) return null;

  const renderActiveService = () => {
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab) return <div className="p-8 text-slate-500">Select a service to begin.</div>;

    return (
      <ServiceSuspense>
        {(() => {
          switch (activeTab.serviceId) {
            case ServiceType.DASHBOARD_TECH: return user ? <TechnicianDashboard user={user as Technician} /> : null;
            case ServiceType.ACCOUNT_PROFILE: return <ProfileScreen session={session} />;
            case ServiceType.GIG_MANAGEMENT: return <GigManagement />;
            case ServiceType.INCOMING_REQUESTS: return <IncomingRequestsTech />;
            case ServiceType.INCOMING_BUILD_REQUESTS: return <IncomingBuildRequestsTech />;
            case ServiceType.ASSIGNED_JOBS: return <AssignedJobsTech />;
            case ServiceType.ACTIVE_REPAIRS: return <ActiveRepairsTech />;
            case ServiceType.COMPLETED_JOBS: return <CompletedJobsTech />;
            case ServiceType.SERVICE_REPORTS: return <ServiceReportsTech />;
            case ServiceType.CUSTOMER_HISTORY: return <CustomerHistoryTech />;
            case ServiceType.PATIENT_DOSSIERS: return <PatientDossiers />;
            default: return <div>Service under development</div>;
          }
        })()}
      </ServiceSuspense>
    );
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden selection:bg-indigo-500/30">
      <aside className={`hidden md:flex flex-col glass border-r border-white/5 transition-all duration-300 z-30 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <SidebarContent
          userName={user?.name}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onOpenService={openService}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </aside>
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#020617] border-r border-white/5 z-50 transform transition-transform duration-300 md:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent
          userName={user?.name}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onOpenService={openService}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
        <header className="flex md:hidden items-center justify-between px-4 h-14 border-b border-white/5 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center">
              <span className="font-bold text-[10px] text-black">T</span>
            </div>
            <span className="font-bold text-sm tracking-tight">System Sentinel</span>
          </div>
          <div className="w-8" />
        </header>

        <div className="flex items-center gap-0.5 px-2 pt-2 bg-slate-900/40 border-b border-white/5 overflow-x-auto scrollbar-hide shrink-0">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-all cursor-pointer min-w-[100px] md:min-w-[120px] max-w-[160px] md:max-w-[200px] border-x border-t border-transparent shrink-0 ${activeTabId === tab.id ? 'bg-[#020617] text-white border-white/5 shadow-[0_-4px_10px_-4px_rgba(245,158,11,0.2)] z-10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <span className="truncate flex-1">{tab.title}</span>
              {!tab.isLocked && (
                <button onClick={(e) => closeTab(e, tab.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all ml-1 shrink-0">
                  {Icons.close}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide relative text-slate-100">
          {renderActiveService()}
        </div>
      </main>
    </div>
  );
};

export default TechnicianAppLayout;
