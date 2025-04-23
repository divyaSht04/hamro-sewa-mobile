import axios from 'axios';
import { API_BASE_URL, NOTIFICATION_ENDPOINTS } from './config';
import * as StorageService from './storageService';

// Create axios instance for notification API
const notificationAxios = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to add auth token to all requests
notificationAxios.interceptors.request.use(
  async (config) => {
    const token = await StorageService.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Get all notifications for the current user
 * @param {string} userType - User type (customer, provider, admin)
 * @param {number} userId - ID of the user
 * @returns {Promise<Array>} List of notifications
 */
export const getNotifications = async (userType, userId) => {
  try {
    // Ensure both parameters are provided
    if (!userType || !userId) {
      console.warn('Missing required parameters for getNotifications', { userType, userId });
      return [];
    }

    const response = await notificationAxios.get(
      `${NOTIFICATION_ENDPOINTS.GET_ALL}?userType=${userType}&userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting notifications:', error);
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
  }
};

/**
 * Get unread notifications count
 * @param {string} userType - User type (customer, provider, admin)
 * @param {number} userId - ID of the user
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadNotificationsCount = async (userType, userId) => {
  try {
    // Ensure both parameters are provided
    if (!userType || !userId) {
      console.warn('Missing required parameters for getUnreadNotificationsCount', { userType, userId });
      return 0;
    }

    const response = await notificationAxios.get(
      `${NOTIFICATION_ENDPOINTS.GET_UNREAD_COUNT}?userType=${userType}&userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark a notification as read
 * @param {number} notificationId - ID of the notification
 * @returns {Promise<boolean>} Success status
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await notificationAxios.put(NOTIFICATION_ENDPOINTS.MARK_AS_READ(notificationId), null);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read
 * @param {string} userType - User type (customer, provider, admin)
 * @param {number} userId - ID of the user
 * @returns {Promise<boolean>} Success status
 */
export const markAllAsRead = async (userType, userId) => {
  try {
    // Ensure both parameters are provided
    if (!userType || !userId) {
      console.warn('Missing required parameters for markAllAsRead', { userType, userId });
      return false;
    }

    await notificationAxios.put(
      `${NOTIFICATION_ENDPOINTS.MARK_ALL_READ}?userType=${userType}&userId=${userId}`,
      {}
    );
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Delete a notification
 * @param {number} notificationId - ID of the notification
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
  try {
    await notificationAxios.delete(NOTIFICATION_ENDPOINTS.DELETE(notificationId));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for the current user
 * @param {string} userType - User type (customer, provider, admin)
 * @param {number} userId - ID of the user
 * @returns {Promise<boolean>} Success status
 */
export const deleteAllNotifications = async (userType, userId) => {
  try {
    // Ensure both parameters are provided
    if (!userType || !userId) {
      console.warn('Missing required parameters for deleteAllNotifications', { userType, userId });
      return false;
    }

    await notificationAxios.delete(
      `${NOTIFICATION_ENDPOINTS.DELETE_ALL}?userType=${userType}&userId=${userId}`
    );
    return true;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return false;
  }
};
