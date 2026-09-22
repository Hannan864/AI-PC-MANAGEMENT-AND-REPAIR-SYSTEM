import React, { useState } from 'react';
import { authApi } from '../../../services/authApi';
import { Role } from '../../../types';

export const RegisterScreen = ({ onRegisterSuccess, onGoToLogin }: { onRegisterSuccess: (sessionId: string) => void, onGoToLogin: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.USER);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiRole = role === Role.TECHNICIAN ? 'technician' : 'user';
      await authApi.register({
        name,
        email,
        password,
        password_confirmation: password,
        role: apiRole as 'user' | 'technician',
      });
      const sessionId = `s_${Date.now()}`;
      onRegisterSuccess(sessionId);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'An error occurred during registration';
      setError(msg);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8 glass rounded-2xl shadow-xl shadow-indigo-500/10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Create Access Key</h2>
          <p className="text-sm text-slate-400">Register new identity on the platform.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              placeholder="John Doe"
            />
          </div>
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

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Clearance Level (Role)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole(Role.USER)}
                className={`py-2.5 rounded-lg border text-xs font-medium transition-all ${role === Role.USER ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                User
              </button>
              <button
                type="button"
                onClick={() => setRole(Role.TECHNICIAN)}
                className={`py-2.5 rounded-lg border text-xs font-medium transition-all ${role === Role.TECHNICIAN ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
              >
                Technician
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center mt-6 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Register Identity'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-slate-400">
            Already have an access key?{' '}
            <button onClick={onGoToLogin} className="text-indigo-400 hover:text-indigo-300 font-medium">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
