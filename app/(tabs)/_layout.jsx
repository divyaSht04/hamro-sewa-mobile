import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import NotificationIcon from '../../components/NotificationIcon';
import { useNotification } from '../../contexts/NotificationContext';

export default function TabsLayout() {
  const { unreadCount } = useNotification();
  
  return (
    <Tabs
      screenOptions={{
        headerRight: () => <NotificationIcon style={{ marginRight: 15 }} />,
        headerShown: true,
        tabBarActiveTintColor: '#FF9C01',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#EEE',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#FF9C01',
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase-outline" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: 'My Bookings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="about"
        options={{
          title: 'About Us',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="info" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
