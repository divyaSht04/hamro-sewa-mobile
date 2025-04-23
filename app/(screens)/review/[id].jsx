import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as StorageService from '../../../services/storageService';
import { API_BASE_URL } from '../../../services/config';
import axios from 'axios';
import {
  createReview,
  updateReview,
  deleteReview,
  getReviewByBookingId,
  checkBookingReviewed
} from '../../../services/reviewApi';

const ReviewScreen = () => {
  const { id } = useLocalSearchParams(); // This is the booking ID
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [existingReview, setExistingReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user info and booking details on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const userData = await StorageService.getUser();
        if (!userData) {
          Alert.alert('Error', 'You must be logged in to leave a review');
          router.replace('/(auth)/login');
          return;
        }
        setUser(userData);

        // Fetch booking details
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

        const bookingData = bookingResponse.data;
        setBooking(bookingData);

        // Check if the booking is completed
        if (bookingData.status !== 'COMPLETED') {
          Alert.alert(
            'Not Eligible',
            'You can only review completed bookings',
            [{ text: 'Go Back', onPress: () => router.back() }]
          );
          return;
        }

        // Check if the booking already has a review
        const isReviewed = await checkBookingReviewed(id);
        
        if (isReviewed) {
          // Fetch existing review
          const reviewData = await getReviewByBookingId(id);
          setExistingReview(reviewData);
          // Pre-fill form with existing review data
          setRating(reviewData.rating);
          setComment(reviewData.comment);
        }
      } catch (error) {
        console.error('Error loading review data:', error);
        Alert.alert('Error', 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Handle review submission
  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5 stars');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Missing Comment', 'Please write a comment for your review');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare review data
      const reviewData = {
        customerId: user.id,
        providerServiceId: booking.providerService.id,
        bookingId: parseInt(id),
        rating: rating,
        comment: comment
      };

      if (existingReview) {
        // Update existing review - get a fresh token
        const token = await StorageService.getToken();
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Make direct API call with all required fields in the request body
        // The backend validation requires customerId, bookingId, and providerServiceId
        const completeReviewData = {
          rating: rating,
          comment: comment,
          customerId: user.id,
          bookingId: parseInt(id), // bookingId from URL param
          providerServiceId: booking.providerService.id
        };
        
        console.log('Updating review with data:', completeReviewData);
        
        await axios.put(
          `${API_BASE_URL}/reviews/${existingReview.id}`,
          completeReviewData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        Alert.alert('Success', 'Your review has been updated');
      } else {
        // Create new review
        await createReview(reviewData);
        Alert.alert('Success', 'Your review has been submitted');
      }
      
      // Go back to bookings page
      router.back();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle review deletion
  const handleDeleteReview = async () => {
    if (!existingReview) return;

    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              
              // Get fresh authentication token before making request
              const token = await StorageService.getToken();
              
              if (!token) {
                throw new Error('Authentication token not found');
              }
              
              // Make direct API call with token instead of using service
              // The backend requires customerId as a query parameter
              const response = await axios.delete(
                `${API_BASE_URL}/reviews/${existingReview.id}?customerId=${user.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              console.log('Review deletion successful:', response.status);
              Alert.alert('Success', 'Your review has been deleted');
              router.back();
            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert(
                'Error', 
                `Failed to delete your review: ${error.response?.status || error.message}. Please try again.`
              );
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
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
          <Text style={styles.headerTitle}>Review</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loaderText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {existingReview && !isEditing ? 'Your Review' : 'Write a Review'}
          </Text>
          {existingReview && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={toggleEditMode}
              disabled={submitting}
            >
              {isEditing ? (
                <AntDesign name="close" size={20} color="white" />
              ) : (
                <AntDesign name="edit" size={20} color="white" />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView style={styles.scrollContainer}>
          {booking && (
            <View style={styles.bookingCard}>
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
                </View>
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.bookingDate}>
                  {booking.bookingDate 
                    ? `${booking.bookingDate[2]}/${booking.bookingDate[1]}/${booking.bookingDate[0]}`
                    : 'No date'}
                </Text>
                <Text style={styles.bookingPrice}>
                  Rs. {booking.finalPrice ? booking.finalPrice.toFixed(2) : booking.providerService.price}
                </Text>
              </View>
            </View>
          )}

          {existingReview && !isEditing ? (
            // Display existing review
            <View style={styles.reviewContainer}>
              <Text style={styles.reviewTitle}>Your Review</Text>
              
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <AntDesign
                    key={star}
                    name="star"
                    size={28}
                    color={star <= existingReview.rating ? '#f59e0b' : '#d1d5db'}
                  />
                ))}
              </View>
              
              <View style={styles.reviewCommentBox}>
                <Text style={styles.reviewComment}>{existingReview.comment}</Text>
                <Text style={styles.reviewDate}>
                  {new Date(existingReview.timestamp).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editReviewButton}
                  onPress={toggleEditMode}
                  disabled={submitting}
                >
                  <AntDesign name="edit" size={18} color="white" />
                  <Text style={styles.buttonText}>Edit Review</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteReviewButton}
                  onPress={handleDeleteReview}
                  disabled={submitting}
                >
                  <AntDesign name="delete" size={18} color="white" />
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Review form for creating or editing
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    disabled={submitting}
                  >
                    <AntDesign
                      name="star"
                      size={32}
                      color={star <= rating ? '#f59e0b' : '#d1d5db'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.formLabel}>Write your review</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience with this service..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={6}
                maxLength={500}
                textAlignVertical="top"
                editable={!submitting}
              />
              
              <Text style={styles.charCount}>
                {comment.length}/500
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.submitButton, { opacity: submitting ? 0.7 : 1 }]}
                  onPress={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="rate-review" size={18} color="white" />
                      <Text style={styles.buttonText}>
                        {existingReview ? 'Update Review' : 'Submit Review'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {existingReview && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={toggleEditMode}
                    disabled={submitting}
                  >
                    <AntDesign name="close" size={18} color="white" />
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
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
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  serviceDetails: {
    marginLeft: 12,
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
  },
  bookingDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bookingDate: {
    fontSize: 14,
    color: '#4b5563',
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 150,
    backgroundColor: '#f9fafb',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
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
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  reviewContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  reviewCommentBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewComment: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  reviewDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  editReviewButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  deleteReviewButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default ReviewScreen;
