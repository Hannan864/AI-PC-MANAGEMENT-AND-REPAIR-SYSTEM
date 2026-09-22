import React, { useState } from 'react';
import { authApi } from '../services/authApi';
import { DEMO_USERS, DemoUser } from './demoUsers';

interface Props {
  onLoginSuccess: (sessionId: string) => void;
  onError: (msg: string) => void;
}

const colorMap: Record<string, { bg: string; hover: string; ring: string; text: string }> = {
  rose: {
    bg: 'bg-rose-500/10',
    hover: 'hover:bg-rose-500/20',
    ring: 'hover:ring-rose-500/30',
    text: 'text-rose-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    hover: 'hover:bg-blue-500/20',
    ring: 'hover:ring-blue-500/30',
    text: 'text-blue-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    hover: 'hover:bg-emerald-500/20',
    ring: 'hover:ring-emerald-500/30',
    text: 'text-emerald-400',
  },
};

export const DemoLoginButtons: React.FC<Props> = ({ onLoginSuccess, onError }) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDemoLogin = async (user: DemoUser) => {
    setLoading(user.label);
    onError('');

    try {
      const authUser = await authApi.login({
        email: user.email,
        password: user.password,
      });
      const sessionId = `s_${authUser.id}_${Date.now()}`;
      onLoginSuccess(sessionId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Failed to login as ${user.label}`;
      onError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-6">
      {/* Separator */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0b0f19] px-3 text-slate-500 tracking-widest font-semibold">
            Demo Login
          </span>
        </div>
      </div>

      {/* Buttons — ordered: Customer, Technician, Admin */}
      <div className="grid grid-cols-3 gap-3">
        {DEMO_USERS.map((user) => {
          const c = colorMap[user.color];
          const isLoading = loading === user.label;

          return (
            <button
              key={user.label}
              type="button"
              disabled={loading !== null}
              onClick={() => handleDemoLogin(user)}
              className={`
                group relative flex flex-col items-center gap-2 py-4 px-2
                rounded-xl border border-white/5
                ${c.bg} ${c.hover} ${c.ring}
                hover:ring-1 transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              <span className="text-2xl leading-none">{user.icon}</span>
              <span className={`text-xs font-semibold ${c.text}`}>
                {isLoading ? '...' : user.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
