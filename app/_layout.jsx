import React from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import "@/global.css";
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Stack>
          <Stack.Screen name='index' options={{ headerShown: false }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
        </Stack>
      </NotificationProvider>
    </AuthProvider>
  )
}