import React, { useState } from 'react';
import { authApi } from '../../../services/authApi';
import { DEMO_MODE } from '../../../demo-auth/demoConfig';
import { DemoLoginButtons } from '../../../demo-auth/DemoLoginButtons';

// Demo "Inspector" link - derived from the API base URL so it follows the
// backend even when the launcher had to fall back to a port other than 8000.
const INSPECTOR_URL = `${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')}/api/v1/auth/login`;

export const LoginScreen = ({ onLoginSuccess, onGoToRegister }: { onLoginSuccess: (sessionId: string) => void, onGoToRegister: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authApi.login({ email, password });
      const sessionId = `s_${user.id}_${Date.now()}`;
      onLoginSuccess(sessionId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl shadow-indigo-500/10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">System Access</h2>
          <p className="text-sm text-slate-400">Authenticate to enter the platform.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              placeholder="technician@sentinel.sys"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-slate-400">
            Don't have an access key?{' '}
            <button onClick={onGoToRegister} className="text-indigo-400 hover:text-indigo-300 font-medium">
              Register here
            </button>
          </p>
        </div>

        {DEMO_MODE && (
          <DemoLoginButtons
            onLoginSuccess={onLoginSuccess}
            onError={setError}
          />
        )}

        {DEMO_MODE && (
          <div className="mt-4 text-center">
            <a
              href={INSPECTOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Inspector
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
