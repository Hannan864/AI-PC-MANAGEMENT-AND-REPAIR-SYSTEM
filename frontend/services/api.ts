import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Axios client configured for Laravel Sanctum authentication.
 * - Automatic Bearer token attachment from localStorage
 * - Automatic 401 handling (token expired/invalid)
 * - Request/response interceptors for consistent error handling
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // 60s: the dev server is single-threaded, so bursts of parallel polling
  // (telemetry, alerts, system reports) can briefly queue requests behind
  // one another. A short timeout turned those waits into false failures.
  timeout: 60000,
});

// --- Token Management ---
let accessToken: string | null = localStorage.getItem('access_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const getAccessToken = () => accessToken;

// --- Request Interceptor: Attach Bearer Token ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Response Interceptor: Handle 401 ---
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session
      setAccessToken(null);
      localStorage.removeItem('current_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  },
);

// --- Typed API Helpers ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedData<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    lastPage: number;
  };
}

export default api;
