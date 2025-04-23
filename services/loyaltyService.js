import axios from 'axios';
import { API_BASE_URL } from './config';
import * as StorageService from './storageService';

// Get the loyalty progress for a specific customer with a specific service provider
export const getLoyaltyProgress = async (customerId, serviceProviderId) => {
  try {
    console.log(`*** LOYALTY API: Getting progress for customer ${customerId} and provider ${serviceProviderId}`);
    console.log(`*** LOYALTY API: Base URL is ${API_BASE_URL}`);
    
    // Get token from SecureStore using StorageService
    const token = await StorageService.getToken();
    console.log(`*** LOYALTY API: Auth token exists: ${!!token}`);
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Log the exact URL being called
    const url = `${API_BASE_URL}/loyalty/progress/${customerId}/${serviceProviderId}`;
    console.log(`*** LOYALTY API: Calling ${url}`);
    console.log(`*** LOYALTY API: Using token: ${token.substring(0, 20)}...`);
    
    const response = await axios.get(
      url,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    const data = response.data;
    console.log(`Loyalty data for customer ${customerId} with provider ${serviceProviderId}:`, data);
    
    // Ensure the discount eligibility is correctly determined
    if (!data.discountEligible && !data.eligibleForDiscount && data.completedBookings >= 4) {
      data.discountEligible = true;
      data.eligibleForDiscount = true;
      console.log('Setting discount eligibility based on completed bookings count');
    }
    
    return data;
  } catch (error) {
    console.error('*** LOYALTY API ERROR:', error.message);
    console.error('*** LOYALTY API ERROR DETAILS:', JSON.stringify({
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    }));
    throw error;
  }
};

// Get all loyalty progress for a customer across all service providers
export const getAllLoyaltyProgress = async (customerId) => {
  try {
    // Get token from SecureStore using StorageService
    const token = await StorageService.getToken();
    
    const response = await axios.get(
      `${API_BASE_URL}/loyalty/progress/customer/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching all loyalty progress:', error.response?.data || error.message);
    throw error;
  }
};

// Fix loyalty tracking issues
export const fixLoyaltyTracking = async (customerId) => {
  try {
    // Get token from SecureStore using StorageService
    const token = await StorageService.getToken();
    console.log(`*** LOYALTY API: Fix tracking for customer ${customerId}`);
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/loyalty/fix/${customerId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fixing loyalty tracking:', error.response?.data || error.message);
    throw error;
  }
};
