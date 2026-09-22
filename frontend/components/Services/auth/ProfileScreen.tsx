import React, { useEffect, useState } from 'react';
import { User, Session, Role } from '../../../types';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';

export const ProfileScreen = ({ session }: { session: Session | null }) => {
  const [user, setUser] = useState<User | null>(null);
  const { logout, isLoggingOut } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await authApi.getProfile();
        setUser({
          ...profile,
          role: profile.role.toUpperCase() as Role,
          createdAt: new Date(profile.createdAt).getTime(),
          updatedAt: profile.updatedAt ? new Date(profile.updatedAt).getTime() : undefined,
        } as User);
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    load();
  }, [session]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
         <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-8 px-4">
      <div className="glass rounded-xl border border-white/5 p-6 md:p-8 relative overflow-hidden">
        {/* Background Accent */}
        <div className={`absolute top-0 right-0 w-64 h-64 opacity-20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 ${user.role === Role.ADMIN ? 'bg-rose-500' : user.role === Role.TECHNICIAN ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-3xl md:text-4xl font-bold text-indigo-400 shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">{user.name}</h2>
              <p className="text-sm text-slate-400 break-all">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[10px] md:text-xs font-semibold uppercase tracking-wider ${user.role === Role.ADMIN ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : user.role === Role.TECHNICIAN ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {user.role}
                </span>
                <span className="text-[10px] md:text-xs text-slate-500 mono">ID: {user.id.includes('_') ? user.id.split('_')[1] : user.id.slice(0, 8)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin"></div>
                Signing Out...
              </>
            ) : (
              <>
                {Icons.power}
                Sign Out
              </>
            )}
          </button>
        </div>

        <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10">
          <div className="bg-[#020617]/50 rounded-lg p-5 border border-white/5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Account Created</div>
            <div className="text-slate-300 text-sm font-medium">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-[#020617]/50 rounded-lg p-5 border border-white/5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Security Level</div>
            <div className="text-slate-300 text-sm font-medium">Standard Encryption</div>
          </div>
        </div>
      </div>
    </div>
  );
};
