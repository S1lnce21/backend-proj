import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getAllUsers: () => api.get('/auth/users'),
  updateUserRole: (userId, data) => api.put(`/auth/users/${userId}/role`, data),
  banUser: (userId, data) => api.put(`/auth/users/${userId}/ban`, data),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
};

export const postsAPI = {
  getAllPosts: () => api.get('/posts'),
  getMyPosts: () => api.get('/posts/my'),
  createPost: (data) => api.post('/posts', data),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
};

export const newsAPI = {
  getAllNews: () => api.get('/news'),
  getNewsById: (id) => api.get(`/news/${id}`),
  createNews: (data) => api.post('/news', data),
  updateNews: (id, data) => api.put(`/news/${id}`, data),
  deleteNews: (id) => api.delete(`/news/${id}`),
};

export const productsAPI = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const ticketsAPI = {
  getMyTickets: () => api.get('/tickets'),
  getAllTickets: () => api.get('/tickets/all'),
  createTicket: (data) => api.post('/tickets', data),
  sendMessage: (id, data) => api.post(`/tickets/${id}/message`, data),
  assignTicket: (id) => api.put(`/tickets/${id}/assign`),
  closeTicket: (id) => api.put(`/tickets/${id}/close`),
  reopenTicket: (id) => api.put(`/tickets/${id}/reopen`),
  archiveTicket: (id) => api.put(`/tickets/${id}/archive`),
  deleteTicket: (id) => api.delete(`/tickets/${id}`),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  deleteAll: () => api.delete('/notifications/clear-all'),
};

export default api;