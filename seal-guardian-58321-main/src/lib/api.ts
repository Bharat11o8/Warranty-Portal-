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
  withCredentials: true, // SBP-006: Send HttpOnly cookies with every request
});

const resolveLoginUrl = () => {
  const currentUrl = new URL(window.location.href);
  const role = currentUrl.searchParams.get('role');
  return role ? `/login?role=${role}` : '/login';
};

const isSessionValid = async () => {
  try {
    await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
    return true;
  } catch {
    return false;
  }
};

// Request logging (no longer needs to attach token - cookie is sent automatically)
api.interceptors.request.use((config) => {
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

    const requestUrl = error.config?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/resend-otp') ||
      requestUrl.includes('/auth/me');

    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthRequest) {
      // Confirm session before redirecting, so endpoint-specific 403/401 does not force logout.
      isSessionValid().then((valid) => {
        if (!valid && !window.location.pathname.startsWith('/login')) {
          window.location.href = resolveLoginUrl();
        }
      });
    }

    return Promise.reject(error);
  }
);

export default api;
