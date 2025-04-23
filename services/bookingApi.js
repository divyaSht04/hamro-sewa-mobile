import axios from 'axios';
import { API_BASE_URL } from './config';
import { getToken } from './storageService';

// Create axios instance with base config
const bookingAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Add auth token to requests
bookingAxios.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Starting Booking Request:', {
      url: config.url,
      method: config.method
    });
    
    return config;
  },
  (error) => {
    console.error('Booking Request Error:', error);
    return Promise.reject(error);
  }
);

// Log all responses
bookingAxios.interceptors.response.use(
  (response) => {
    console.log('Booking Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('Booking Response Error:', {
      message: error.message,
      code: error.code,
      response: error.response ? `Status: ${error.response.status}` : 'No response'
    });
    return Promise.reject(error);
  }
);

// Booking endpoints
export const BOOKING_ENDPOINTS = {
  CREATE_BOOKING: `/bookings`,
  CUSTOMER_BOOKINGS: (customerId) => `/bookings/customer/${customerId}`,
  SERVICE_BOOKINGS: (serviceId) => `/bookings/service/${serviceId}`,
  BOOKING_DETAIL: (bookingId) => `/bookings/${bookingId}`,
  UPDATE_STATUS: (bookingId) => `/bookings/${bookingId}/status`
};

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data (customerId, providerServiceId, bookingNotes)
 * @returns {Promise<Object>} - Created booking
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await bookingAxios.post(BOOKING_ENDPOINTS.CREATE_BOOKING, bookingData);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Get bookings for customer
 * @param {number} customerId - Customer ID
 * @returns {Promise<Array>} - Array of bookings
 */
export const getCustomerBookings = async (customerId) => {
  try {
    const response = await bookingAxios.get(BOOKING_ENDPOINTS.CUSTOMER_BOOKINGS(customerId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching bookings for customer ${customerId}:`, error);
    throw error;
  }
};

/**
 * Get bookings for service
 * @param {number} serviceId - Service ID
 * @returns {Promise<Array>} - Array of bookings
 */
export const getServiceBookings = async (serviceId) => {
  try {
    const response = await bookingAxios.get(BOOKING_ENDPOINTS.SERVICE_BOOKINGS(serviceId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching bookings for service ${serviceId}:`, error);
    throw error;
  }
};

/**
 * Get booking details
 * @param {number} bookingId - Booking ID
 * @returns {Promise<Object>} - Booking details
 */
export const getBookingDetails = async (bookingId) => {
  try {
    const response = await bookingAxios.get(BOOKING_ENDPOINTS.BOOKING_DETAIL(bookingId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching details for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Update booking status
 * @param {number} bookingId - Booking ID
 * @param {string} status - New status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>} - Updated booking
 */
export const updateBookingStatus = async (bookingId, status, comment = '') => {
  try {
    const response = await bookingAxios.put(
      BOOKING_ENDPOINTS.UPDATE_STATUS(bookingId), 
      null, 
      { params: { status, comment } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating status for booking ${bookingId}:`, error);
    throw error;
  }
};

/**
 * Cancel booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise<string>} - Success message
 */
export const cancelBooking = async (bookingId) => {
  try {
    const response = await bookingAxios.delete(BOOKING_ENDPOINTS.BOOKING_DETAIL(bookingId));
    return response.data;
  } catch (error) {
    console.error(`Error cancelling booking ${bookingId}:`, error);
    throw error;
  }
};
