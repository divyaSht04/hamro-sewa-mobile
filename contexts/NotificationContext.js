import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { initializeWebSocketConnection, disconnectWebSocket } from '../services/socketService';
import { 
  getNotifications, 
  getUnreadNotificationsCount, 
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

// Create context
const NotificationContext = createContext();

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Make sure user has id and role
      if (!user.id || !user.role) {
        console.warn('User object missing required properties:', user);
        setError('Unable to load notifications: missing user data');
        setLoading(false);
        return;
      }
      
      // Extract user type and ID from user object
      const userType = user.role.replace('ROLE_', '').toLowerCase();
      const userId = user.id;
      
      // Get notifications with both parameters
      const notificationsData = await getNotifications(userType, userId);
      setNotifications(notificationsData || []);
      
      // Get unread count with both parameters
      const count = await getUnreadNotificationsCount(userType, userId);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Handle new notification
  const handleNewNotification = useCallback((notification) => {
    // Add new notification to the list
    setNotifications(prevNotifications => [notification, ...prevNotifications]);
    
    // Increment unread count
    setUnreadCount(prevCount => prevCount + 1);
    
    // Can also display a notification alert here
    Alert.alert(
      'New Notification',
      notification.message || 'You have a new notification',
      [{ text: 'OK' }],
      { cancelable: true }
    );
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    let cleanup = null;
    
    const setupWebSocket = async () => {
      if (isAuthenticated && user) {
        try {
          cleanup = await initializeWebSocketConnection(
            user,
            handleNewNotification,
            () => {
              console.log('WebSocket connection established');
              // Load notifications after connection is established
              loadNotifications();
            },
            (error) => {
              console.error('WebSocket connection error:', error);
              setError('Failed to establish real-time connection');
            }
          );
        } catch (err) {
          console.error('Error setting up WebSocket:', err);
        }
      }
    };
    
    setupWebSocket();
    
    // Clean up WebSocket connection when component unmounts or user changes
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [isAuthenticated, user, handleNewNotification, loadNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!isAuthenticated || !user) return false;
    
    try {
      // Make sure user has id and role
      if (!user.id || !user.role) {
        console.warn('User object missing required properties:', user);
        return false;
      }
      
      const userType = user.role.replace('ROLE_', '').toLowerCase();
      const userId = user.id;
      
      // Pass both parameters to the API call
      const success = await markAllAsRead(userType, userId);
      
      if (success) {
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notification => ({ ...notification, read: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
      
      return success;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };

  // Delete notification
  const removeNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // Update unread count if needed
      const removedNotification = notifications.find(n => n.id === notificationId);
      if (removedNotification && !removedNotification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  };

  // Delete all notifications
  const removeAllNotifications = async () => {
    if (!isAuthenticated || !user) return false;
    
    try {
      // Make sure user has id and role
      if (!user.id || !user.role) {
        console.warn('User object missing required properties:', user);
        return false;
      }
      
      const userType = user.role.replace('ROLE_', '').toLowerCase();
      const userId = user.id;
      
      // Pass both parameters to the API call
      const success = await deleteAllNotifications(userType, userId);
      
      if (success) {
        // Update local state
        setNotifications([]);
        setUnreadCount(0);
      }
      
      return success;
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      return false;
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    return loadNotifications();
  };

  // Provide context value
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: removeNotification,
    deleteAllNotifications: removeAllNotifications,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
