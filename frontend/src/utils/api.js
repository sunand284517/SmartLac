import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration/401s
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Force redirect to login if token is invalid, but handled in AuthContext instead to avoid full reload if possible
    }
    return Promise.reject(error);
  }
);

export default api;
