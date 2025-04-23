import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import * as StorageService from '../../../services/storageService';
import { API_BASE_URL } from '../../../services/config';
import axios from 'axios';
import { checkBookingReviewed, getReviewByBookingId } from '../../../services/reviewApi';
import { useNotification } from '../../../contexts/NotificationContext';

const BookingDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const { notifications } = useNotification();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [hasReview, setHasReview] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  // Handle real-time notifications for this booking
  useEffect(() => {
    if (!id || notifications.length === 0) return;
    
    // Check for notifications related to this booking
    const bookingNotifications = notifications.filter(notification => 
      notification.data && 
      notification.data.type === 'BOOKING_STATUS_CHANGE' && 
      notification.data.bookingId === parseInt(id)
    );
    
    // Show the most recent notification if available
    if (bookingNotifications.length > 0) {
      const latestNotification = bookingNotifications[0];
      setStatusUpdateMessage(latestNotification.message);
      
      // Auto-refresh booking details
      loadBookingDetails();
      
      // Clear the message after 10 seconds
      const timer = setTimeout(() => {
        setStatusUpdateMessage('');
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [id, notifications]);

  // Load booking details function
  const loadBookingDetails = useCallback(async () => {
      try {
        // Check authentication
        const userData = await StorageService.getUser();
        if (!userData) {
          Alert.alert('Error', 'You must be logged in to view booking details');
          router.replace('/(auth)/login');
          return;
        }

        // Get auth token
        const token = await StorageService.getToken();
        if (!token) {
          Alert.alert('Error', 'Authentication token not found');
          router.back();
          return;
        }

        // Fetch booking details
        const bookingResponse = await axios.get(
          `${API_BASE_URL}/bookings/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setBooking(bookingResponse.data);

        // Check if the booking has a review
        const isReviewed = await checkBookingReviewed(id);
        setHasReview(isReviewed);

        if (isReviewed) {
          // Fetch the review
          const reviewData = await getReviewByBookingId(id);
          setReview(reviewData);
        }
      } catch (error) {
        console.error('Error loading booking details:', error);
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
      } finally {
        setLoading(false);
      }
    }, [id]);

  // Initial load of booking details
  useEffect(() => {
    loadBookingDetails();
  }, [loadBookingDetails]);

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    try {
      const token = await StorageService.getToken();
      
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }
      
      // Show confirmation dialog
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                // The endpoint appears to be status update rather than a direct cancel endpoint
                await axios.put(
                  `${API_BASE_URL}/bookings/${id}/status?status=CANCELLED`,
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                
                Alert.alert('Success', 'Booking cancelled successfully');
                // Refresh booking details
                const updatedBooking = await axios.get(
                  `${API_BASE_URL}/bookings/${id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
                setBooking(updatedBooking.data);
                setLoading(false);
              } catch (error) {
                console.error('Error cancelling booking:', error);
                Alert.alert('Error', 'Failed to cancel booking. Please try again.');
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in cancel booking handler:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (dateArray) => {
    if (!dateArray || !Array.isArray(dateArray) || dateArray.length < 3) {
      return 'Invalid date';
    }
    
    try {
      const [year, month, day] = dateArray;
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  // Format time for display
  const formatTime = (timeArray) => {
    if (!timeArray || !Array.isArray(timeArray) || timeArray.length < 2) {
      return 'Invalid time';
    }
    
    try {
      const [hour, minute] = timeArray;
      return `${hour}:${minute.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  // Navigate to review page
  const navigateToReview = () => {
    router.push(`/(screens)/review/${id}`);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return '#f59e0b'; // Amber
      case 'CONFIRMED':
        return '#3b82f6'; // Blue
      case 'COMPLETED':
        return '#10b981'; // Green
      case 'CANCELLED':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>Loading booking details...</Text>
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <AntDesign name="exclamationcircle" size={50} color="#ef4444" />
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorMessage}>
            We couldn't find the booking details you're looking for.
          </Text>
          <TouchableOpacity
            style={styles.backToBookingsButton}
            onPress={() => router.push('/(tabs)/my-bookings')}
          >
            <Text style={styles.backToBookingsText}>Back to My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor(booking.status);
  const isPending = booking.status === 'PENDING';
  const isConfirmed = booking.status === 'CONFIRMED';
  const isCompleted = booking.status === 'COMPLETED';
  const isCancelled = booking.status === 'CANCELLED';
  const canCancel = isPending || isConfirmed;
  const canReview = isCompleted && !hasReview;
  const hasReviewed = isCompleted && hasReview;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Real-time notification message */}
        {statusUpdateMessage ? (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>{statusUpdateMessage}</Text>
          </View>
        ) : null}
        
        {/* Service Provider Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Service Details</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{booking.status}</Text>
            </View>
          </View>

          <View style={styles.serviceInfo}>
            <Image
              source={{ uri: `${API_BASE_URL}/provider-services/image/${booking.providerService.id}` }}
              style={styles.serviceImage}
              resizeMode="cover"
            />
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceName}>{booking.providerService.serviceName}</Text>
              <Text style={styles.providerName}>
                By {booking.providerService.serviceProvider.businessName || 'Service Provider'}
              </Text>
              <Text style={styles.serviceCategory}>{booking.providerService.category}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Information</Text>
          
          <View style={styles.detailItem}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Date:</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.bookingDate ? formatDate(booking.bookingDate) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Time:</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.bookingTime ? formatTime(booking.bookingTime) : 'Not specified'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Address:</Text>
            </View>
            <Text style={styles.detailValue}>
              {booking.address || 'No address provided'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailRow}>
              <MaterialIcons name="payment" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Price:</Text>
            </View>
            <Text style={[styles.detailValue, { color: '#059669', fontWeight: '600' }]}>
              Rs. {booking.finalPrice ? booking.finalPrice.toFixed(2) : booking.providerService.price}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailRow}>
              <MaterialIcons name="event-note" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Booking ID:</Text>
            </View>
            <Text style={styles.detailValue}>#{booking.id}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={20} color="#6b7280" />
              <Text style={styles.detailLabel}>Created:</Text>
            </View>
            <Text style={styles.detailValue}>
              {new Date(booking.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Customer Notes Card */}
        {booking.customerNotes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Notes</Text>
            <Text style={styles.notesText}>{booking.customerNotes}</Text>
          </View>
        )}

        {/* Review Card - Only show if completed and has review */}
        {hasReviewed && review && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Review</Text>
            
            <View style={styles.reviewContent}>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <AntDesign
                    key={star}
                    name="star"
                    size={20}
                    color={star <= review.rating ? '#f59e0b' : '#d1d5db'}
                  />
                ))}
                <Text style={styles.ratingText}>{review.rating}/5</Text>
              </View>
              
              <Text style={styles.reviewComment}>{review.comment}</Text>
              
              <Text style={styles.reviewDate}>
                Posted on {new Date(review.timestamp).toLocaleDateString()}
              </Text>
              
              <TouchableOpacity
                style={styles.editReviewButton}
                onPress={navigateToReview}
              >
                <AntDesign name="edit" size={16} color="white" />
                <Text style={styles.buttonText}>Edit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelBooking}
            >
              <MaterialIcons name="cancel" size={20} color="white" />
              <Text style={styles.buttonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
          
          {canReview && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={navigateToReview}
            >
              <MaterialIcons name="rate-review" size={20} color="white" />
              <Text style={styles.buttonText}>Write Review</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.backToBookingsButton}
            onPress={() => router.push('/(tabs)/my-bookings')}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.buttonText}>Back to My Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  notificationContainer: {
    backgroundColor: '#dbeafe',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationText: {
    color: '#1e40af',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 48,
    paddingBottom: 16,
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  serviceDetails: {
    marginLeft: 16,
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 13,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  detailItem: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 15,
    color: '#4b5563',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 28,
    marginTop: 4,
  },
  notesText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  reviewContent: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  reviewComment: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
  },
  actionContainer: {
    marginBottom: 32,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reviewButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  editReviewButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  backToBookingsButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToBookingsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default BookingDetailsScreen;
