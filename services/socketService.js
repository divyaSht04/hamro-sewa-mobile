import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { SOCKET_URL } from './config';
import * as StorageService from './storageService';

// Maintain socket state
let stompClient = null;
let connected = false;
let subscriptions = [];

/**
 * Initialize WebSocket connection for receiving real-time notifications
 * @param {object} user - Current user object with id and role
 * @param {function} onMessageReceived - Callback when notification is received
 * @param {function} onConnect - Optional callback when connection is established
 * @param {function} onError - Optional callback for connection errors
 * @returns {function} Cleanup function to disconnect
 */
export const initializeWebSocketConnection = async (
  user,
  onMessageReceived,
  onConnect,
  onError
) => {
  // Close any existing connection
  if (stompClient && connected) {
    disconnectWebSocket();
  }

  // Create a new STOMP client with modern configuration
  stompClient = new Client({
    webSocketFactory: () => new SockJS(SOCKET_URL),
    debug: process.env.NODE_ENV !== 'production' ? console.log : () => {},
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  // Extract user information for subscription
  const userType = user.role.replace('ROLE_', '').toLowerCase();
  const userId = user.id;

  // Handle successful connection
  stompClient.onConnect = (frame) => {
    console.log('WebSocket connected');
    connected = true;

    // Subscribe to personal notifications
    const subscription = stompClient.subscribe(
      `/user/${userType}-${userId}/notifications`,
      (message) => {
        try {
          const notification = JSON.parse(message.body);
          onMessageReceived(notification);
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      }
    );

    // Store subscription for later cleanup
    subscriptions.push(subscription);

    // Also subscribe to general notifications for this user type
    const topicSubscription = stompClient.subscribe(
      `/topic/${userType}`,
      (message) => {
        try {
          const notification = JSON.parse(message.body);
          onMessageReceived(notification);
        } catch (error) {
          console.error('Error parsing topic notification:', error);
        }
      }
    );

    subscriptions.push(topicSubscription);

    if (onConnect) {
      onConnect();
    }
  };

  // Handle connection errors
  stompClient.onStompError = (frame) => {
    console.error('STOMP error:', frame.headers.message);
    connected = false;
    if (onError) {
      onError(frame);
    }
  };

  // Start the connection
  stompClient.activate();

  // Return disconnect function for cleanup
  return () => disconnectWebSocket();
};

/**
 * Disconnect WebSocket connection
 */
export const disconnectWebSocket = () => {
  if (stompClient) {
    try {
      // Unsubscribe from all subscriptions
      subscriptions.forEach((subscription) => {
        if (subscription && subscription.id) {
          subscription.unsubscribe();
        }
      });

      // Clear subscriptions array
      subscriptions = [];

      // Deactivate the client
      if (connected) {
        stompClient.deactivate();
        connected = false;
        console.log('WebSocket disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting WebSocket:', error);
    }
  }
};

/**
 * Check if WebSocket is connected
 * @returns {boolean} Connection status
 */
export const isWebSocketConnected = () => {
  return connected && stompClient !== null;
};
