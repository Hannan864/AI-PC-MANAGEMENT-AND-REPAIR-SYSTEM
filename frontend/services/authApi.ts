import api, { ApiResponse, setAccessToken } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'technician' | 'admin';
  status: string;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'user' | 'technician';
}

export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await api.post<ApiResponse<TokenResponse>>('/v1/auth/register', payload);
    setAccessToken(res.data.data.accessToken);
    localStorage.setItem('current_user', JSON.stringify(res.data.data.user));
    return res.data.data.user;
  },

  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await api.post<ApiResponse<TokenResponse>>('/v1/auth/login', payload);
    setAccessToken(res.data.data.accessToken);
    localStorage.setItem('current_user', JSON.stringify(res.data.data.user));
    return res.data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/v1/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('current_user');
    }
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<ApiResponse<AuthUser>>('/v1/auth/me');
    return res.data.data;
  },

  async getProfile(): Promise<AuthUser> {
    const res = await api.get<ApiResponse<AuthUser>>('/v1/user/profile');
    return res.data.data;
  },

  async updateProfile(payload: { name?: string; email?: string; password?: string }): Promise<AuthUser> {
    const res = await api.put<ApiResponse<AuthUser>>('/v1/user/profile', payload);
    localStorage.setItem('current_user', JSON.stringify(res.data.data));
    return res.data.data;
  },

  getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  },

  clearStoredUser(): void {
    localStorage.removeItem('current_user');
  },
};
