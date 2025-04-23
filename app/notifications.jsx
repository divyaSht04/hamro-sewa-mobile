import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications,
    refreshNotifications 
  } = useNotification();
  
  const [refreshing, setRefreshing] = useState(false);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  // Mark notification as read when it's opened
  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.data && notification.data.type) {
      switch(notification.data.type) {
        case 'BOOKING_STATUS_CHANGE':
          if (notification.data.bookingId) {
            router.push(`/booking-details/${notification.data.bookingId}`);
          }
          break;
        case 'NEW_SERVICE':
          router.push('/services');
          break;
        case 'LOYALTY_POINTS':
          router.push('/loyalty');
          break;
        default:
          // Just mark as read without navigation
          break;
      }
    }
  };
  
  // Confirm and delete a notification
  const handleDeleteNotification = (notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteNotification(notification.id) 
        },
      ]
    );
  };
  
  // Confirm and delete all notifications
  const handleDeleteAllNotifications = () => {
    if (notifications.length === 0) return;
    
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete All', 
          style: 'destructive',
          onPress: deleteAllNotifications 
        },
      ]
    );
  };

  // Format notification date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 0) {
        return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
      } else if (diffHour > 0) {
        return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Render a single notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        {/* Notification icon based on type */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getNotificationIcon(item)} 
            size={24} 
            color={item.read ? '#64748b' : '#2563eb'} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.notificationTitle,
            !item.read && styles.unreadText
          ]}>
            {item.title}
          </Text>
          
          <Text style={styles.notificationMessage}>
            {item.message}
          </Text>
          
          <Text style={styles.notificationTime}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Get appropriate icon based on notification type
  const getNotificationIcon = (notification) => {
    if (!notification.data || !notification.data.type) {
      return 'notifications-outline';
    }
    
    switch (notification.data.type) {
      case 'BOOKING_STATUS_CHANGE':
        return 'calendar-outline';
      case 'NEW_SERVICE':
        return 'briefcase-outline';
      case 'LOYALTY_POINTS':
        return 'gift-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        We'll notify you when something important happens
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () => (
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={markAllAsRead}
                >
                  <Text style={styles.headerButtonText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={[styles.headerButton, styles.deleteAllButton]}
                  onPress={handleDeleteAllNotifications}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginHorizontal: 8,
    padding: 4,
  },
  headerButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteAllButton: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unreadNotification: {
    backgroundColor: '#eff6ff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  unreadText: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
