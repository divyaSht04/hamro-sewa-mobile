import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../../services/config';
import * as StorageService from '../../services/storageService';
import { checkBookingReviewed } from '../../services/reviewApi';

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await StorageService.getUser();
        if (userData) {
          setUser(userData);
          fetchBookings(userData.id);
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        Alert.alert('Error', 'Authentication failed.');
      }
    };
    checkAuth();
  }, []);

  const checkBookingReviewStatus = async (bookingId) => {
    try {
      return await checkBookingReviewed(bookingId);
    } catch (error) {
      console.error(`Error checking review status for booking ${bookingId}:`, error);
      return false;
    }
  };

  const fetchBookings = async (userId) => {
    try {
      setLoading(true);
      const token = await StorageService.getToken();
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/bookings/customer/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setBookings(response.data);
      
      // Check review status for completed bookings
      const reviewStatus = {};
      const promises = response.data
        .filter(booking => booking.status === 'COMPLETED')
        .map(async (booking) => {
          const isReviewed = await checkBookingReviewStatus(booking.id);
          reviewStatus[booking.id] = isReviewed;
        });
        
      await Promise.all(promises);
      setReviewedBookings(reviewStatus);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (user) fetchBookings(user.id);
  };

  const viewBookingDetails = (bookingId) => {
    router.push(`/(screens)/booking-details/${bookingId}`);
  };
  
  const navigateToReview = (bookingId) => {
    router.push(`/(screens)/review/${bookingId}`);
  };

  const formatDateTime = (dateTimeArray) => {
    if (!dateTimeArray || dateTimeArray.length < 5) return 'Invalid date';
    const [year, month, day, hour, minute] = dateTimeArray;
    return `${day}/${month}/${year} ${hour}:${minute.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    return status === 'COMPLETED' ? '#10b981' : '#6b7280';
  };

  const renderBookingItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const isCompleted = item.status === 'COMPLETED';
    const isReviewed = isCompleted && reviewedBookings[item.id];
    
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => viewBookingDetails(item.id)}
      >
        <View style={styles.bookingHeader}>
          <View style={styles.serviceInfo}>
            <Image
              source={{ uri: `${API_BASE_URL}/provider-services/image/${item.providerService.id}` }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceName}>{item.providerService.serviceName}</Text>
              <Text style={styles.providerName}>
                By {item.providerService.serviceProvider.businessName || 'Service Provider'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{formatDateTime(item.bookingDateTime)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Rs. {item.discountedPrice ? item.discountedPrice : item.originalPrice}
            </Text>
          </View>
          
          {isCompleted && isReviewed && (
            <View style={styles.reviewedBadge}>
              <AntDesign name="star" size={14} color="#f59e0b" />
              <Text style={styles.reviewedText}>Reviewed</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bookingActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => viewBookingDetails(item.id)}
          >
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
          
          {isCompleted && !isReviewed && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => navigateToReview(item.id)}
            >
              <Text style={styles.reviewButtonText}>Add Review</Text>
            </TouchableOpacity>
          )}
          
          {isCompleted && isReviewed && (
            <TouchableOpacity
              style={styles.editReviewButton}
              onPress={() => navigateToReview(item.id)}
            >
              <Text style={styles.editReviewButtonText}>Edit Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.authPrompt}>
            <AntDesign name="login" size={50} color="#6366f1" />
            <Text style={styles.authTitle}>Authentication Required</Text>
            <Text style={styles.authMessage}>Please sign in to view your bookings</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loaderText}>Loading your bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AntDesign name="calendar" size={50} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptyMessage}>You haven't made any bookings yet</Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/home')}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBookingItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6366f1']}
              />
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  serviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  bookingDetails: {
    marginVertical: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#6366f1',
    borderRadius: 6,
    marginLeft: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  reviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    marginLeft: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  editReviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    marginLeft: 8,
  },
  editReviewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  reviewedText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 4,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  authMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default MyBookingsScreen;