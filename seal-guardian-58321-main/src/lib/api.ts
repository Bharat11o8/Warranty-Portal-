import axios from 'axios';

// Ensure API URL always ends with /api
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
const isDev = import.meta.env.DEV;

if (isDev) console.log('API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (isDev) console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => {
    if (isDev) console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (isDev) console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);

    const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/verify-otp');

    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthRequest) {
      localStorage.removeItem('auth_token');
      // Preserve the role parameter if it exists in the current URL
      const currentUrl = new URL(window.location.href);
      const role = currentUrl.searchParams.get('role');
      const loginUrl = role ? `/login?role=${role}` : '/login';

      // Only redirect if valid existing token to prevent loops (though removing token above helps)
      window.location.href = loginUrl;
    }
    return Promise.reject(error);
  }
);

export default api;