/**
 * Storage Service
 * Handles secure storage of authentication tokens and user data
 */

import * as SecureStore from 'expo-secure-store';

// Constants for storage keys
const STORAGE_KEYS = {
  TOKEN: 'hamroSewa_token',
  USER: 'hamroSewa_user'
};

export const saveToStorage = async (key, value) => {
  try {
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error('Storage save error:', error);
    return false;
  }
};

export const getFromStorage = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Storage retrieval error:', error);
    return null;
  }
};

export const removeFromStorage = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error('Storage removal error:', error);
    return false;
  }
};


export const saveToken = async (token) => {
  return await saveToStorage(STORAGE_KEYS.TOKEN, token);
};


export const getToken = async () => {
  return await getFromStorage(STORAGE_KEYS.TOKEN);
};


export const removeToken = async () => {
  return await removeFromStorage(STORAGE_KEYS.TOKEN);
};

export const saveUser = async (userData) => {
  return await saveToStorage(STORAGE_KEYS.USER, JSON.stringify(userData));
};


export const getUser = async () => {
  try {
    const userData = await getFromStorage(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};


export const removeUser = async () => {
  return await removeFromStorage(STORAGE_KEYS.USER);
};


export const clearAuthStorage = async () => {
  try {
    await removeToken();
    await removeUser();
    return true;
  } catch (error) {
    console.error('Error clearing auth storage:', error);
    return false;
  }
};
