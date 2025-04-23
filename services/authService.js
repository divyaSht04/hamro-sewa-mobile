import axios from 'axios';
import { API_BASE_URL, AUTH_ENDPOINTS } from './config';
import * as StorageService from './storageService';

// Log the configured API URL for debugging
console.log('API configured with base URL:', API_BASE_URL);


const authAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
  validateStatus: status => status >= 200 && status < 300
});

console.log(authAxios);

// Log all requests for debugging
authAxios.interceptors.request.use(request => {
  console.log('Starting Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL,
    data: request.data ? 'Data present' : 'No data',
    headers: request.headers
  });
  return request;
});

// Log all responses for debugging
authAxios.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data ? 'Data received' : 'No data',
    });
    return response;
  },
  error => {
    console.error('Response Error:', {
      message: error.message,
      code: error.code,
      response: error.response ? `Status: ${error.response.status}` : 'No response'
    });
    return Promise.reject(error);
  }
);

authAxios.interceptors.request.use(
  async (config) => {
    if (config.url.includes('/login') || 
        config.url.includes('/initiate-') || 
        config.url.includes('/verify-')) {
      return config;
    }
    
    try {
      const token = await StorageService.getToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Auth interceptor error:', error);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);


const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decodedToken = parseJwt(token);
  if (!decodedToken) return true;
  
  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
};


export const login = async (email, password) => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    console.log("lets see if i get till here")

    const loginData = {
      email: email,
      password: password
    };

    const response = await authAxios.post(AUTH_ENDPOINTS.LOGIN, loginData);
    
    if (response && response.data) {
      const { token, user } = response.data;

      if (!token || !user || !user.roles) {
        throw new Error('Invalid response format from server');
      }

      const userRoles = user.roles;
      if (!userRoles.length) {
        throw new Error('No roles found in response');
      }

      const userData = {
        id: user.id,
        email: user.email,
        role: userRoles[0], // Use the first role
        username: user.username,
        fullName: user.fullName
      };

      // Save auth data to secure storage
      await StorageService.saveToken(token);
      await StorageService.saveUser(userData);

      return { token, user: userData };
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    // Add detailed logging for debugging mobile issues
    console.error('Login error details:', { 
      message: error.message,
      code: error.code,
      name: error.name,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      } : 'No response',
      request: error.request ? 'Request present' : 'No request',
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL,
        headers: error.config.headers
      } : 'No config'
    });
    
    // Handle specific error responses
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data;
      
      switch (status) {
        case 401:
          throw new Error('Incorrect password. Please try again.');
        case 404:
          throw new Error('Email not found. Please check your email address.');
        case 400:
          throw new Error(errorMessage || 'Invalid login request');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(errorMessage || 'Authentication failed');
      }
    }
    
    // Handle network errors - common on mobile devices
    if (error.code === 'ERR_NETWORK') {
      throw new Error(`Network error connecting to ${API_BASE_URL}. Please check your connection and server URL.`);
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Server may be unavailable.');
    }
    
    // Handle other common mobile networking issues
    if (error.message && error.message.includes('Network Error')) {
      throw new Error(`Network error. Make sure your backend is running at ${API_BASE_URL} and accessible from your device.`);
    }
    
    throw error;
  }
};

export const registerCustomer = async (userData) => {
  try {
    console.log('Starting registration with data:', {
      username: userData.username,
      email: userData.email,
      hasImage: !!userData.profileImage
    });

    // Check if we have an image to upload
    if (userData.profileImage) {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Add the profile image
      const imageUri = userData.profileImage;
      const filename = imageUri.split('/').pop();
      
      // Determine mime type (default to jpeg if can't determine)
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('profileImage', {
        uri: imageUri,
        name: filename,
        type
      });
      
      // Explicitly add all required fields in the precise format expected by Spring backend
      // These are the required request parameters for your backend
      formData.append('username', userData.username);
      formData.append('fullName', userData.fullName);
      formData.append('email', userData.email);
      formData.append('phoneNumber', userData.phoneNumber);
      formData.append('password', userData.password);
      formData.append('address', userData.address);
      
      // Ensure dateOfBirth is in a valid ISO format (YYYY-MM-DD) for Spring LocalDate
      const dateOfBirth = userData.dateOfBirth || '2000-01-01';
      formData.append('dateOfBirth', dateOfBirth);
      
      // Ensure gender is a valid value
      const gender = userData.gender || 'MALE';
      formData.append('gender', gender);
      
      console.log('Registration form data:', {
        username: userData.username,
        email: userData.email,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        hasAddress: !!userData.address
      });
      
      console.log('Sending multipart form data with image');
      
      // Make multipart form request with image
      const response = await axios.post(
        `${API_BASE_URL}${AUTH_ENDPOINTS.REGISTER_CUSTOMER}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          },
          timeout: 30000 // Longer timeout for image upload
        }
      );
      
      return response.data;
    } else {
      // Use query parameters instead of JSON body
      // Create params object from userData
      console.log('Sending registration with query parameters');
      
      // Create the URL with query parameters using explicitly named fields
      const queryParams = new URLSearchParams();
      
      // Explicitly add all required fields in the format expected by Spring backend
      queryParams.append('username', userData.username);
      queryParams.append('fullName', userData.fullName);
      queryParams.append('email', userData.email);
      queryParams.append('phoneNumber', userData.phoneNumber);
      queryParams.append('password', userData.password);
      queryParams.append('address', userData.address);
      
      // Ensure dateOfBirth is in a valid ISO format (YYYY-MM-DD) for Spring LocalDate
      const dateOfBirth = userData.dateOfBirth || '2000-01-01';
      queryParams.append('dateOfBirth', dateOfBirth);
      
      // Ensure gender is a valid value
      const gender = userData.gender || 'MALE';
      queryParams.append('gender', gender);
      
      const url = `${AUTH_ENDPOINTS.REGISTER_CUSTOMER}?${queryParams.toString()}`;
      console.log('Request URL:', url);
      
      const response = await authAxios.post(url);
      return response.data;
    }
  } catch (error) {
    console.error('Customer registration error:', error);
    
    // Detailed error logging
    console.error('Registration error details:', { 
      message: error.message,
      code: error.code,
      name: error.name,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response'
    });
    
    if (error.response && error.response.data) {
      throw new Error(error.response.data || 'Registration failed');
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      throw new Error(`Network error connecting to ${API_BASE_URL}. Please check your connection.`);
    }
    
    throw new Error('Registration failed. Please try again.');
  }
};


export const verifyCustomerRegistration = async (verificationData) => {
  try {
    console.log('Verifying customer registration with data:', verificationData);
    
    // Create form data as expected by backend
    const formData = new FormData();
    
    // Add email to form data
    if (verificationData.email) {
      formData.append('email', verificationData.email);
      console.log('Adding email to form data:', verificationData.email);
    }
    
    // Add otp (lowercase as per backend code) - REQUIRED
    formData.append('otp', verificationData.verificationCode);
    console.log('Adding otp to form data:', verificationData.verificationCode);
    
    // Make the request with form data
    console.log('Sending verification with correct parameters');
    const response = await axios.post(
      `${API_BASE_URL}${AUTH_ENDPOINTS.VERIFY_CUSTOMER}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.data.token) {
      const { token, user } = response.data;
      
      // Create a user object
      const userData = {
        id: user.id,
        email: user.email,
        role: 'CUSTOMER',
        username: user.username,
        fullName: user.fullName
      };

      // Save auth data to secure storage
      await StorageService.saveToken(token);
      await StorageService.saveUser(userData);
    }
    
    return response.data;
  } catch (error) {
    console.error('Verification error:', error);
    
    console.error('Verification error details:', { 
      message: error.message,
      code: error.code,
      name: error.name,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : 'No response'
    });
    
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Verification failed');
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      throw new Error(`Network error connecting to ${API_BASE_URL}. Please check your connection.`);
    }
    
    throw new Error('Verification failed. Please try again.');
  }
};

export const logout = async () => {
  try {
    const token = await StorageService.getToken();
    
    if (token) {
      try {
        await authAxios.post(AUTH_ENDPOINTS.LOGOUT);
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local auth data
    await StorageService.clearAuthStorage();
  }
};


export const isAuthenticated = async () => {
  try {
    const token = await StorageService.getToken();
    const user = await StorageService.getUser();
    
    if (!token || !user) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      await StorageService.clearAuthStorage();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};


export const getCurrentUser = async () => {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return null;
    }
    
    return await StorageService.getUser();
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};
