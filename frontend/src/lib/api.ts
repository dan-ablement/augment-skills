import axios from 'axios';

// Use relative URL - Next.js proxy will route to backend
const API_BASE_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to check if OAuth is configured
export const checkOAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await api.get('/auth/oauth-status');
    return response.data.configured;
  } catch {
    return false;
  }
};

export default api;
