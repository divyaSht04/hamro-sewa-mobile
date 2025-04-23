import React, { createContext, useState, useContext, useEffect } from 'react';
import * as AuthService from '../services/authService';
import * as StorageService from '../services/storageService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  
  // Load authentication state on app start
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const isAuth = await AuthService.isAuthenticated();
        
        if (isAuth) {
          const userData = await StorageService.getUser();
          const authToken = await StorageService.getToken();
          
          setUser(userData);
          setToken(authToken);
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuthState();
  }, []);
  

  const signIn = async (email, password) => {
    setIsLoading(true);
    
    try {
      const response = await AuthService.login(email, password);
      
      if (response && response.user) {
        setUser(response.user);
        setToken(response.token);
        return { success: true, user: response.user };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };
  

  const register = async (userData) => {
    setIsLoading(true);
    
    try {
      const response = await AuthService.registerCustomer(userData);
      return { 
        success: true, 
        data: response,
        message: 'Registration successful. Please verify your account.'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  

  const verifyRegistration = async (verificationData) => {
    setIsLoading(true);
    
    try {
      const response = await AuthService.verifyCustomerRegistration(verificationData);
      
      // If verification contains token and user data
      if (response.token && response.user) {
        setUser(response.user);
        setToken(response.token);
      }
      
      return { 
        success: true, 
        data: response,
        message: 'Verification successful.'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Verification failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  

  const signOut = async () => {
    setIsLoading(true);
    
    try {
      await AuthService.logout();
      setUser(null);
      setToken(null);
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Logout failed' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  const authContext = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    register,
    verifyRegistration
  };
  
  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
