import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '../../types';
import { authApi, AuthUser } from '../../services/authApi';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (sessionId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isLoggingOut: false,
  login: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

const mapAuthUserToUser = (au: AuthUser): User => ({
  id: au.id,
  email: au.email,
  passwordHash: '',
  name: au.name,
  role: au.role.toUpperCase() as User['role'],
  createdAt: new Date(au.createdAt).getTime(),
  status: (au.status?.toUpperCase() || 'ACTIVE') as User['status'],
});

/** Keys that hold auth state — all cleared on logout */
const AUTH_STORAGE_KEYS = [
  'access_token',
  'current_user',
  'open_tabs',
  'active_tab',
  'user_open_tabs',
  'user_active_tab',
  'tech_open_tabs',
  'tech_active_tab',
  'admin_open_tabs',
  'admin_active_tab',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadSession = async () => {
    const timeout = setTimeout(() => {
      console.warn('Auth: Session loading stalled. Bypassing lock for recovery.');
      setIsLoading(false);
    }, 5000);

    try {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken) {
        const me = await authApi.me();
        const mapped = mapAuthUserToUser(me);
        setUser(mapped);
        setSession({
          id: `session_${me.id}`,
          userId: me.id,
          role: mapped.role,
          createdAt: new Date(me.createdAt).getTime(),
          expiresAt: Date.now() + 86400000,
        });
        console.log('Auth: Session active for', me.email);
        if ((window as any).__telemetryStart) {
          (window as any).__telemetryStart();
        }
        return;
      }
    } catch (e) {
      console.warn('Auth: Token invalid or expired, clearing.', e);
      authApi.clearStoredUser();
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (sessionId: string) => {
    setIsLoading(true);
    setIsLoggingOut(false); // allow signing out again after an in-place logout
    try {
      const me = await authApi.me();
      const mapped = mapAuthUserToUser(me);
      setUser(mapped);
      setSession({
        id: sessionId,
        userId: me.id,
        role: mapped.role,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
      });
      if ((window as any).__telemetryStart) {
        (window as any).__telemetryStart();
      }
    } catch (err) {
      console.error('Login session fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Prevent double-clicks — first click locks, subsequent clicks ignored
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // 1. Stop telemetry immediately
    if ((window as any).__telemetryStop) {
      (window as any).__telemetryStop();
    }

    // 2. Clear React state immediately (prevents stale UI)
    setUser(null);
    setSession(null);

    // 3. Clear ALL auth-related localStorage
    AUTH_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));

    // 4. Fire-and-forget API call — do NOT await or block on this
    //    The token may already be gone; we don't care.
    authApi.logout().catch(() => {});

    // 5. Point the URL at /login WITHOUT a full page reload. Clearing the
    //    session above makes RoleRouter swap to the login screen on the very
    //    next render, so signing out feels instant. (The previous hard
    //    redirect re-downloaded and re-booted the whole SPA, which made sign
    //    out feel stuck.) replaceState also keeps the Back button from
    //    returning to the portal.
    try {
      window.history.replaceState(null, '', '/login');
    } catch {
      // history manipulation can be blocked in some embedded contexts
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, isLoggingOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
