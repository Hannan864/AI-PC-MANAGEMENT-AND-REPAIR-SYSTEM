import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './AuthProvider';
import { Role } from '../../types';
import { LoginScreen } from '../Services/auth/LoginScreen';
import { RegisterScreen } from '../Services/auth/RegisterScreen';
import api from '../../services/api';

const UserAppLayout = lazy(() => import('./UserAppLayout'));
const TechnicianAppLayout = lazy(() => import('./TechnicianAppLayout'));
const AdminAppLayout = lazy(() => import('./AdminAppLayout'));

const LoadingFallback = () => (
  <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Secure Environment...</p>
  </div>
);

export const RoleRouter: React.FC = () => {
  const { session, isLoading, login } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.get('/v1/system/health');
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!session) {
    return (
      <div className="h-screen w-full bg-[#020617] text-slate-100 flex items-center justify-center">
        <div className="w-full h-full max-w-4xl mx-auto flex items-center justify-center p-6">
           {showRegister ? (
              <RegisterScreen onRegisterSuccess={login} onGoToLogin={() => setShowRegister(false)} />
           ) : (
              <LoginScreen onLoginSuccess={login} onGoToRegister={() => setShowRegister(true)} />
           )}
         </div>
      </div>
    );
  }

  const renderLayout = () => {
    if (!session || !session.role) {
       return <div className="p-10 text-center text-rose-400">Error: Invalid Session Role. Please login again.</div>;
    }

    return (
      <Suspense fallback={<LoadingFallback />}>
        {session.role === Role.ADMIN && <AdminAppLayout />}
        {session.role === Role.TECHNICIAN && <TechnicianAppLayout />}
        {session.role === Role.USER && <UserAppLayout />}
        {![Role.ADMIN, Role.TECHNICIAN, Role.USER].includes(session.role) && (
           <div className="p-10 text-center text-rose-400">Error: Unauthorized Role Access.</div>
        )}
      </Suspense>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#020617] overflow-hidden">
      <div className="bg-white/[0.02] border-b border-white/5 text-xs px-6 py-2 flex items-center justify-between gap-4 font-mono z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-emerald-400' : backendStatus === 'offline' ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`}></div>
            <span className="text-slate-400">Backend</span>
            <span className={backendStatus === 'online' ? 'text-emerald-400 font-bold' : backendStatus === 'offline' ? 'text-rose-400 font-bold' : 'text-amber-400'}>{backendStatus === 'online' ? 'Online' : backendStatus === 'offline' ? 'Offline' : 'Checking'}</span>
          </div>
          <span className="text-white/5">|</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            <span className="text-slate-400">Laravel Backend</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {renderLayout()}
      </div>
    </div>
  );
};

export default RoleRouter;
