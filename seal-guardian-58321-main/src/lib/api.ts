import axios from 'axios';

// ---------------------------------------------------------------------------
// API Base URL
// ---------------------------------------------------------------------------
const isProd = import.meta.env.PROD;
const isDev = import.meta.env.DEV;

const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || '';
const BACKEND_URL = 'https://server-bharat-maheshwaris-projects.vercel.app/api';

const resolveBase = () => {
  if (isProd) return BACKEND_URL;
  if (envUrl) return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  return 'http://localhost:3000/api';
};

export const API_URL = resolveBase();

if (isDev) console.log('API Base URL:', API_URL);

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Request — attach token from localStorage
// ---------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isDev) console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// ---------------------------------------------------------------------------
// Response — redirect on session expiry
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const status = error.response?.status;

    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/resend-otp') ||
      requestUrl.includes('/auth/me') ||
      requestUrl.includes('/auth/logout');

    if ((status === 401 || status === 403) && !isAuthRoute) {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.startsWith('/login')) {
        const role = new URL(window.location.href).searchParams.get('role');
        window.location.href = role ? `/login?role=${role}` : '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
