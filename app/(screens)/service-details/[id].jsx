import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Ionicons,
  FontAwesome,
  MaterialIcons,
  MaterialCommunityIcons
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getServiceDetails, getServiceImageUrl } from '../../../services/providerServiceApi';
import { getServiceReviews, getServiceAverageRating } from '../../../services/reviewApi';

// Fallback images for each category
const fallbackImages = {
  Cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Plumbing: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Gardening: 'https://images.unsplash.com/photo-1599629954294-14df9ec8dfe8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  default: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
};

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch service details and reviews
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get service details
      const serviceData = await getServiceDetails(id);
      setService(serviceData);
      console.log('Service data received:', JSON.stringify(serviceData).substring(0, 200) + '...');

      // Get reviews for service
      const reviewsData = await getServiceReviews(id);
      setReviews(reviewsData || []);
      console.log(reviewsData)
      console.log(`Fetched ${reviewsData?.length || 0} reviews`);

      // Get average rating
      const ratingData = await getServiceAverageRating(id);
      console.log(ratingData)
      setAverageRating(ratingData || 0);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching service details:', err);
      setError('Failed to load service details. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Navigate to booking page
  const handleBookService = () => {
    router.push(`/(screens)/book-service/${id}`);
  };

  // Get image for service
  const getImageForService = () => {
    if (service?.imagePath) {
      return getServiceImageUrl(service.id);
    }
    return fallbackImages[service?.category] || fallbackImages.default;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';

    try {
      // If it's an array like [2023, 4, 15, ...], convert to ISO string
      if (Array.isArray(dateString)) {
        const [year, month, day, hour, minute, second] = dateString;
        const date = new Date(year, month - 1, day, hour, minute, second);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      // If it's already a string
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text className="text-gray-600 mt-4 text-base">Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center p-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Error Loading Service</Text>
          <Text className="text-gray-600 text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="mt-6 bg-purple-600 py-3 px-6 rounded-lg"
            onPress={onRefresh}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6B46C1']} />
        }
      >
        {/* Back button and header */}
        <View className="absolute top-2 left-2 z-10">
          <TouchableOpacity
            className="bg-gray-800/50 p-2 rounded-full"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Hero image */}
        <View className="h-72 w-full relative">
          <Image
            source={{ uri: getImageForService() }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* Category badge */}
          {service?.category && (
            <View className="absolute top-4 right-4 bg-purple-600/90 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-medium">{service.category}</Text>
            </View>
          )}

          {/* Service info overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text className="text-white text-2xl font-bold">{service?.serviceName}</Text>
            <View className="flex-row items-center mt-2">
              <FontAwesome name="star" size={16} color="#F59E0B" />
              <Text className="text-white ml-1">
                {averageRating ? averageRating : 'New'}
                {reviews.length > 0 ? ` (${reviews.length} review${reviews.length !== 1 ? 's' : ''})` : ' (No reviews yet)'}
              </Text>
            </View>
            <View className="flex-row items-center mt-2">
              <MaterialIcons name="store" size={16} color="#FFF" />
              <Text className="text-white ml-1">
                {service?.serviceProvider?.businessName || 'Unknown Provider'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="p-5">
          {/* Price and booking button */}
          <View className="flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-5">
            <View>
              <Text className="text-gray-500 text-sm">Price</Text>
              <Text className="text-2xl font-bold text-gray-800">
                Rs. {service?.price ? parseFloat(service.price).toFixed(2) : 'N/A'}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-purple-600 py-3 px-6 rounded-lg"
              onPress={handleBookService}
            >
              <Text className="text-white font-semibold">Book Now</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold text-gray-800 mb-3">Description</Text>
            <Text className="text-gray-600 leading-6">{service?.description}</Text>
          </View>

          {/* Reviews section */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">Reviews</Text>
            </View>

            {reviews.length === 0 ? (
              <View className="items-center py-6">
                <MaterialCommunityIcons name="comment-outline" size={48} color="#CBD5E1" />
                <Text className="text-gray-500 mt-2">No reviews yet</Text>
              </View>
            ) : (
              reviews.map((review) => (
                <View key={review.id} className="border-b border-gray-100 py-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center">
                        <Text className="text-gray-600 font-bold">
                          {review.customer?.fullName ? review.customer.fullName.charAt(0).toUpperCase() : '?'}
                        </Text>
                      </View>
                      <View className="ml-3">
                        <Text className="font-medium text-gray-800">
                          {review.customer?.fullName || 'Anonymous User'}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {formatDate(review.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-md">
                      <FontAwesome name="star" size={14} color="#F59E0B" />
                      <Text className="ml-1 text-gray-700 font-medium">{review.rating}</Text>
                    </View>
                  </View>
                  {review.comment && (
                    <Text className="text-gray-600 mt-3">{review.comment}</Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Provider details */}
          {service?.serviceProvider && (
            <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
              <Text className="text-lg font-bold text-gray-800 mb-3">About the Provider</Text>
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center">
                  <Text className="text-purple-700 font-bold text-lg">
                    {service.serviceProvider.name ? service.serviceProvider.name.charAt(0).toUpperCase() : 'P'}
                  </Text>
                </View>
                <View className="ml-3">
                  <Text className="font-medium text-gray-800">{service.serviceProvider.name}</Text>
                  <Text className="text-gray-500">{service.serviceProvider.email || 'No email provided'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>


    </SafeAreaView>
  );
}
