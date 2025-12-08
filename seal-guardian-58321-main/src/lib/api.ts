import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('API Base URL:', API_URL); // Debug log

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
  console.log('API Request:', config.method?.toUpperCase(), config.url); // Debug log
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url); // Debug log
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data); // Debug log
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('auth_token');
      // Preserve the role parameter if it exists in the current URL
      const currentUrl = new URL(window.location.href);
      const role = currentUrl.searchParams.get('role');
      const loginUrl = role ? `/login?role=${role}` : '/login';
      window.location.href = loginUrl;
    }
    return Promise.reject(error);
  }
);

export default api;