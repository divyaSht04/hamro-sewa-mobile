// (recommended for real devices)
export const API_BASE_URL = 'http://192.168.1.71:8084'; // CHANGE THIS to your computer's IP
export const SOCKET_URL = `${API_BASE_URL}/ws`; // WebSocket endpoint

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER_CUSTOMER: '/auth/initiate-customer-registration',
  VERIFY_CUSTOMER: '/auth/verify-customer-registration',
  REGISTER_PROVIDER: '/auth/initiate-provider-registration',
  VERIFY_PROVIDER: '/auth/verify-provider-registration',
  LOGOUT: '/auth/logout',
};

// Notification endpoints
export const NOTIFICATION_ENDPOINTS = {
  GET_ALL: '/api/notifications',
  GET_UNREAD_COUNT: '/api/notifications/unread/count',
  MARK_AS_READ: (id) => `/api/notifications/${id}/read`,
  MARK_ALL_READ: '/api/notifications/read-all',
  DELETE: (id) => `/api/notifications/${id}`,
  DELETE_ALL: '/api/notifications'
};
