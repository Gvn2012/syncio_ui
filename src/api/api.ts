import axios from 'axios';

const api = axios.create({
  baseURL: 'http://syncio.site/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    try {
      const persisted = localStorage.getItem('persist:root');
      if (persisted) {
        const root = JSON.parse(persisted);
        if (root.user) {
          const user = JSON.parse(root.user);
          if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract token from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
