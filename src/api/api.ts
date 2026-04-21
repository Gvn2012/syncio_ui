import axios from 'axios';
import { store } from '../store';
import { setUser, logout } from '../store/slices/userSlice';

const REFRESH_ENDPOINT:string = 'auth/refresh';

const api = axios.create({
  baseURL: '/api/v1/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    try {
      const persisted = localStorage.getItem('persist:root');
      if (persisted) {
        const root = JSON.parse(persisted);
        if (root.user) {
          const user = JSON.parse(root.user);
          if (user.id) {
            config.headers['X-User-Id'] = user.id;
          }
        }
      }
    } catch (e) {
      console.warn('Could not extract user details from storage', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('auth/refresh') || originalRequest.url?.includes('auth/generate-tokens')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        try {
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
     
        const refreshRes = await api.post(REFRESH_ENDPOINT, {}, { _retry: true } as any);
        
        if (refreshRes.data && refreshRes.data.success && refreshRes.data.data) {
           const { userRole } = refreshRes.data.data;

           const currentUser = store.getState().user;
           store.dispatch(setUser({
             id: currentUser.id!,
             username: currentUser.username!,
             role: userRole || currentUser.role,
             orgId: currentUser.orgId!
           }));

           processQueue(null, null);
           return api(originalRequest);
        } else {
            throw new Error("Refresh failed");
        }
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logout());
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
