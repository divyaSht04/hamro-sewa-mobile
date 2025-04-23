import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const services = [
  {
    id: 1,
    title: 'Plumbing',
    icon: 'plumbing',
    iconType: 'MaterialIcons',
  },
  {
    id: 2,
    title: 'Electrical',
    icon: 'electrical-services',
    iconType: 'MaterialIcons',
  },
  {
    id: 3,
    title: 'Cleaning',
    icon: 'cleaning-services',
    iconType: 'MaterialIcons',
  },
  {
    id: 4,
    title: 'Home Repair',
    icon: 'home-repair-service',
    iconType: 'MaterialIcons',
  },
  {
    id: 5,
    title: 'Gardening',
    icon: 'grass',
    iconType: 'MaterialIcons',
  },
  {
    id: 6,
    title: 'More',
    icon: 'more-horiz',
    iconType: 'MaterialIcons',
  },
];

const featuredProviders = [
  {
    id: 1,
    name: 'Raj Sharma',
    service: 'Plumbing Expert',
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 2,
    name: 'Sunita KC',
    service: 'Home Cleaning',
    rating: 4.9,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 3,
    name: 'Anil Thapa',
    service: 'Electrician',
    rating: 4.7,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
  },
];

const promotions = [
  {
    id: 1,
    title: '20% OFF First Booking',
    description: 'Use code: WELCOME20',
    background: '#FF9C01',
  },
  {
    id: 2,
    title: 'Refer & Earn',
    description: 'Get Rs.500 for each referral',
    background: '#161622',
  },
];

export default function HomePage() {
  const { signOut, isLoading, user } = useAuth();
  
  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: async () => {
              const result = await signOut();
              if (result.success) {
                router.replace('/');
              } else {
                Alert.alert('Error', 'Failed to logout: ' + result.error);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred during logout');
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style='light' backgroundColor='#161622'/>
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-white px-4 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-gray-800">Welcome to</Text>
              <Text className="text-2xl font-bold text-secondary">Hamro Sewa</Text>
            </View>
            <View className="flex-row">
              <TouchableOpacity 
                className="px-3 py-2 bg-secondary rounded-lg items-center justify-center mr-3"
                onPress={() => router.push('/(tabs)/my-bookings')}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={18} color="#FFF" />
                  <Text className="ml-1 text-white font-medium">My Bookings</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3"
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF9C01" />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <FontAwesome name="user" size={20} color="#FF9C01" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity className="flex-row items-center bg-gray-100 px-4 py-3 rounded-lg">
            <FontAwesome name="search" size={18} color="#666" />
            <Text className="ml-2 text-gray-500">Search for services...</Text>
          </TouchableOpacity>
        </View>

        {/* Service Categories */}
        <View className="mt-4 bg-white px-4 py-5">
          <Text className="text-lg font-bold text-gray-800 mb-4">Our Services</Text>
          <View className="flex-row flex-wrap">
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                className="w-1/3 items-center mb-4"
              >
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                  <MaterialIcons name={service.icon} size={28} color="#FF9C01" />
                </View>
                <Text className="mt-2 text-sm font-medium text-gray-700">{service.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Promotions Carousel */}
        <View className="mt-4 px-4">
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {promotions.map((promo) => (
              <TouchableOpacity
                key={promo.id}
                className="mr-4 rounded-xl overflow-hidden"
                style={{ width: width * 0.85, height: 120, backgroundColor: promo.background }}
              >
                <View className="p-4 flex-1 justify-center">
                  <Text className="text-xl font-bold text-white">{promo.title}</Text>
                  <Text className="text-white mt-1">{promo.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Service Providers */}
        <View className="mt-6 bg-white px-4 py-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">Featured Professionals</Text>
            <TouchableOpacity>
              <Text className="text-secondary font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          {featuredProviders.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              className="flex-row items-center p-3 bg-gray-50 rounded-lg mb-3"
            >
              <Image
                source={{ uri: provider.image }}
                className="w-16 h-16 rounded-full"
              />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-gray-800">{provider.name}</Text>
                <Text className="text-gray-500">{provider.service}</Text>
                <View className="flex-row items-center mt-1">
                  <FontAwesome name="star" size={14} color="#FF9C01" />
                  <Text className="ml-1 font-medium">{provider.rating}</Text>
                  <Text className="ml-1 text-gray-500">({provider.reviews} reviews)</Text>
                </View>
              </View>
              <TouchableOpacity className="bg-secondary p-2 rounded-full">
                <FontAwesome name="arrow-right" size={14} color="#FFF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Services */}
        <View className="mt-6 bg-white px-4 py-5 mb-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">Recent Bookings</Text>
          
          <View className="items-center justify-center py-8">
            <Ionicons name="calendar-outline" size={48} color="#DDD" />
            <Text className="mt-2 text-gray-500 text-center">No recent bookings</Text>
            <Text className="text-gray-400 text-center">Your recent service bookings will appear here</Text>
            <TouchableOpacity className="mt-4 bg-secondary py-2 px-4 rounded-md">
              <Text className="text-white font-medium">Book a Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
