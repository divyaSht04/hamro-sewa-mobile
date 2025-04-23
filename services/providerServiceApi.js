import axios from 'axios';
import { API_BASE_URL } from './config';

// Create axios instance with base config
const serviceAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 15000 // 15 seconds timeout
});

// Logging interceptor
serviceAxios.interceptors.request.use(
  (config) => {
    console.log('Starting Request:', {
      url: config.url,
      method: config.method,
      data: config.data ? 'Data present' : 'No data'
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Log all responses
serviceAxios.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data ? 'Data received' : 'No data'
    });
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      message: error.message,
      code: error.code,
      response: error.response ? `Status: ${error.response.status}` : 'No response'
    });
    return Promise.reject(error);
  }
);

// Service endpoints
export const SERVICE_ENDPOINTS = {
  APPROVED_SERVICES: '/provider-services/status/APPROVED',
  SERVICE_DETAILS: (id) => `/provider-services/${id}`,
  SERVICE_IMAGE: (id) => `/provider-services/image/${id}`
};

/**
 * Get all approved services from the backend
 * @returns {Promise<Array>} Array of services
 */
export const getApprovedServices = async () => {
  try {
    console.log('Fetching approved services from:', API_BASE_URL + SERVICE_ENDPOINTS.APPROVED_SERVICES);
    const response = await serviceAxios.get(SERVICE_ENDPOINTS.APPROVED_SERVICES);
    
    // Log the raw data to help debugging
    console.log('Raw service data:', JSON.stringify(response.data).substring(0, 200) + '...');
    
    // Ensure we return an array even if the API returns a single object
    const services = Array.isArray(response.data) ? response.data : [response.data];
    console.log(`Successfully fetched ${services.length} services`);
    return services;
  } catch (error) {
    console.error('Error fetching approved services:', error);
    throw error;
  }
};

/**
 * Get service details by ID
 * @param {number} id Service ID
 * @returns {Promise<Object>} Service details
 */
export const getServiceDetails = async (id) => {
  try {
    const response = await serviceAxios.get(SERVICE_ENDPOINTS.SERVICE_DETAILS(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching service details for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get service image URL
 * @param {number} id Service ID
 * @returns {string} URL to service image
 */
export const getServiceImageUrl = (id) => {
  return `${API_BASE_URL}${SERVICE_ENDPOINTS.SERVICE_IMAGE(id)}`;
};

/**
 * Get service by category
 * @param {string} category Category name
 * @returns {Promise<Array>} Array of services in that category
 */
export const getServicesByCategory = async (category) => {
  try {
    const allServices = await getApprovedServices();
    return allServices.filter(service => service.category === category);
  } catch (error) {
    console.error(`Error fetching services for category ${category}:`, error);
    throw error;
  }
};
