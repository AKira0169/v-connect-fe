import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let refreshPromise: Promise<unknown> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const originalError = error; // Store the original error
    // Check if the error is a 401 Unauthorized and it's not a retry attempt
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // If a refresh request is already in progress, wait for it to complete
      if (isRefreshing && refreshPromise) {
        try {
          await refreshPromise;
          return apiClient(originalRequest);
        } catch {
          // If the shared refresh failed, return the original error
          return Promise.reject(originalError);
        }
      }
      isRefreshing = true;
      try {
        // Start the refresh process
        refreshPromise = apiClient.post('auth/refresh'); // Your refresh token endpoint
        await refreshPromise;
        // If refresh was successful, retry the original request
        return apiClient(originalRequest);
      } catch {
        return Promise.reject(originalError);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    // Always reject non-401 errors!
    return Promise.reject(error);
  },
);

export default apiClient;
