import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const failedUrl = error.config?.url || '';

      if (failedUrl.includes('/auth/login') || failedUrl.includes('/auth/me')) {
        localStorage.removeItem('@BatBI:user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } else {
        console.warn(`[Session Guard] Ignored 401 automatic logout for background endpoint: ${failedUrl}`);
      }
    }
    return Promise.reject(error);
  }
);