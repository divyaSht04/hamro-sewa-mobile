import axios from 'axios';
import { API_BASE_URL } from './config';
import * as StorageService from './storageService';

// Create axios instance with base config
const reviewAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Logging interceptor
reviewAxios.interceptors.request.use(
  (config) => {
    console.log('Starting Review Request:', {
      url: config.url,
      method: config.method
    });
    return config;
  },
  (error) => {
    console.error('Review Request Error:', error);
    return Promise.reject(error);
  }
);

// Log all responses
reviewAxios.interceptors.response.use(
  (response) => {
    console.log('Review Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('Review Response Error:', {
      message: error.message,
      code: error.code,
      response: error.response ? `Status: ${error.response.status}` : 'No response'
    });
    return Promise.reject(error);
  }
);

// Review endpoints
export const REVIEW_ENDPOINTS = {
  SERVICE_REVIEWS: (serviceId) => `/reviews/service/${serviceId}`,
  SERVICE_RATING: (serviceId) => `/reviews/service/${serviceId}/rating`,
  CREATE_REVIEW: `/reviews`,
  UPDATE_REVIEW: (reviewId) => `/reviews/${reviewId}`,
  DELETE_REVIEW: (reviewId) => `/reviews/${reviewId}`,
  CHECK_BOOKING_REVIEWED: (bookingId) => `/reviews/booking/${bookingId}/exists`,
  GET_REVIEW_BY_BOOKING: (bookingId) => `/reviews/booking/${bookingId}`,
  CUSTOMER_REVIEWS: (customerId) => `/reviews/customer/${customerId}`
};

/**
 * Get reviews for a service
 * @param {number} serviceId - Service ID to get reviews for
 * @returns {Promise<Array>} - Array of reviews
 */
export const getServiceReviews = async (serviceId) => {
  try {
    const response = await reviewAxios.get(REVIEW_ENDPOINTS.SERVICE_REVIEWS(serviceId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for service ${serviceId}:`, error);
    throw error;
  }
};

/**
 * Get average rating for a service
 * @param {number} serviceId - Service ID to get average rating for
 * @returns {Promise<number>} - Average rating (1-5)
 */
export const getServiceAverageRating = async (serviceId) => {
  try {
    const response = await reviewAxios.get(REVIEW_ENDPOINTS.SERVICE_RATING(serviceId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching average rating for service ${serviceId}:`, error);
    return null; // Return null to indicate no rating
  }
};

/**
 * Create a new review
 * @param {Object} reviewData - Review data (customerId, providerServiceId, bookingId, rating, comment)
 * @returns {Promise<Object>} - Created review
 */
export const createReview = async (reviewData) => {
  try {
    // Get authentication token
    const token = await StorageService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Add token to request headers
    const response = await reviewAxios.post(
      REVIEW_ENDPOINTS.CREATE_REVIEW, 
      reviewData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

/**
 * Check if a booking has already been reviewed
 * @param {number} bookingId - Booking ID to check
 * @returns {Promise<boolean>} - true if reviewed, false otherwise
 */
export const checkBookingReviewed = async (bookingId) => {
  try {
    const response = await reviewAxios.get(REVIEW_ENDPOINTS.CHECK_BOOKING_REVIEWED(bookingId));
    return response.data;
  } catch (error) {
    console.error(`Error checking if booking ${bookingId} is reviewed:`, error);
    return false; // Default to false on error
  }
};

/**
 * Get review for a specific booking
 * @param {number} bookingId - Booking ID to get review for
 * @returns {Promise<Object>} - Review object
 */
export const getReviewByBookingId = async (bookingId) => {
  try {
    const response = await reviewAxios.get(REVIEW_ENDPOINTS.GET_REVIEW_BY_BOOKING(bookingId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching review for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Get all reviews by a customer
 * @param {number} customerId - Customer ID to get reviews for
 * @returns {Promise<Array>} - Array of review objects
 */
export const getCustomerReviews = async (customerId) => {
  try {
    const response = await reviewAxios.get(REVIEW_ENDPOINTS.CUSTOMER_REVIEWS(customerId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for customer ${customerId}:`, error);
    return []; // Return empty array instead of throwing
  }
};

/**
 * Update an existing review
 * @param {number} reviewId - ID of the review to update
 * @param {Object} reviewData - Updated review data (rating, comment)
 * @returns {Promise<Object>} - Updated review
 */
export const updateReview = async (reviewId, reviewData) => {
  try {
    // Get authentication token
    const token = await StorageService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Add token to request headers
    const response = await reviewAxios.put(
      REVIEW_ENDPOINTS.UPDATE_REVIEW(reviewId), 
      reviewData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating review ${reviewId}:`, error);
    throw error;
  }
};

/**
 * Delete a review
 * @param {number} reviewId - ID of the review to delete
 * @returns {Promise<Object>} - Response object
 */
export const deleteReview = async (reviewId) => {
  try {
    console.log(`Attempting to delete review with ID: ${reviewId}`);
    
    // Get authentication token
    const token = await StorageService.getToken();
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // For Axios, the correct way to pass headers for DELETE is this
    const config = {
      headers: {
        'Authorization': `Bearer ${token}` 
      }
    };
    
    // Make the delete request
    // Note: With axios.delete, the second parameter must be the config
    console.log(`Making DELETE request to: ${REVIEW_ENDPOINTS.DELETE_REVIEW(reviewId)}`);
    const response = await axios({
      method: 'delete',
      url: `${API_BASE_URL}${REVIEW_ENDPOINTS.DELETE_REVIEW(reviewId)}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Review successfully deleted');
    return response.data;
  } catch (error) {
    console.error(`Error deleting review ${reviewId}:`, error);
    throw error;
  }
};
