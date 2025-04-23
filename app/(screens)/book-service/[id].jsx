import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getServiceDetails, getServiceImageUrl } from '../../../services/providerServiceApi';
import { createBooking } from '../../../services/bookingApi';
import { getLoyaltyProgress } from '../../../services/loyaltyService';
import LoyaltyCard from '../../../components/LoyaltyCard';
import * as StorageService from '../../../services/storageService';

const fallbackImages = {
  'Home Improvement': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  default: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
};

export default function BookServiceScreen() {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingDateTime, setBookingDateTime] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isEligibleForDiscount, setIsEligibleForDiscount] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountedPrice, setDiscountedPrice] = useState(null);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userData = await StorageService.getUser();
        if (userData) setUserInfo(userData);
        
        const serviceData = await getServiceDetails(id);
        setService(serviceData);
        
        if (userData && serviceData?.serviceProvider) {
          checkLoyaltyStatus(userData.id, serviceData.serviceProvider.id);
        }
      } catch (err) {
        setError('Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [id]);

  const checkLoyaltyStatus = async (customerId, serviceProviderId) => {
    if (!customerId || !serviceProviderId) return;
    
    try {
      const loyaltyData = await getLoyaltyProgress(customerId, serviceProviderId);
      const isEligible = (
        loyaltyData.discountEligible || 
        loyaltyData.eligibleForDiscount || 
        (loyaltyData.completedBookings >= 4)
      );
      
      setIsEligibleForDiscount(isEligible);
      
      if (isEligible) {
        setDiscountPercentage(loyaltyData.discountPercentage || 20);
        if (service?.price) {
          const originalPrice = parseFloat(service.price);
          const discount = originalPrice * (loyaltyData.discountPercentage || 20) / 100;
          setDiscountedPrice(originalPrice - discount);
        }
      }
    } catch (error) {
      console.error("Error checking loyalty status:", error);
    }
  };

  const handleBookService = async () => {
    try {
      const authToken = await StorageService.getToken();
      if (!authToken) {
        Alert.alert(
          'Authentication Required', 
          'Please login to book this service',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Login', onPress: () => router.push('/(auth)/login')}
          ]
        );
        return;
      }

      if (!bookingDateTime) {
        Alert.alert('Required Fields', 'Please select both date and time for your booking.');
        return;
      }

      setIsBooking(true);

      const year = bookingDateTime.getFullYear();
      const month = bookingDateTime.getMonth() + 1; // Months are 0-indexed
      const day = bookingDateTime.getDate();
      const hour = bookingDateTime.getHours();
      const minute = bookingDateTime.getMinutes();

      const bookingData = {
        providerServiceId: service.id,
        customerId: userInfo.id,
        bookingDateTime: [year, month, day, hour, minute],
        bookingNotes,
        applyLoyaltyDiscount: isEligibleForDiscount,
      };
      
      await createBooking(bookingData);
      
      let message = 'Your service has been booked successfully!';
      if (isEligibleForDiscount) {
        message = `${message}\n\nA ${discountPercentage}% loyalty discount has been applied to your booking!`;
      }
      
      Alert.alert(
        'Booking Successful',
        message,
        [{ text: 'View My Bookings', onPress: () => router.push('/(tabs)/my-bookings') }]
      );
    } catch (error) {
      setIsBooking(false);
      Alert.alert(
        'Booking Failed',
        'There was an error booking the service. Please try again later.'
      );
    }
  };

  const getImageForService = () => {
    if (service?.imagePath) return `${getServiceImageUrl(service.id)}/${service.imagePath}`;
    return fallbackImages[service?.category] || fallbackImages.default;
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateConfirm = (date) => {
    const newDateTime = bookingDateTime ? new Date(bookingDateTime) : new Date();
    newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setBookingDateTime(newDateTime);
    hideDatePicker();
  };

  const showTimePicker = () => {
    setTimePickerVisible(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisible(false);
  };

  const handleTimeConfirm = (date) => {
    const newDateTime = bookingDateTime ? new Date(bookingDateTime) : new Date();
    newDateTime.setHours(date.getHours(), date.getMinutes());
    setBookingDateTime(newDateTime);
    hideTimePicker();
  };

  const formatDateDisplay = (date) => {
    if (!date) return 'Select Date';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const formatTimeDisplay = (date) => {
    if (!date) return 'Select Time';
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  if (loading) {
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
          <AntDesign name="exclamationcircle" size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Error Loading Service</Text>
          <Text className="text-gray-600 text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="mt-6 bg-purple-600 py-3 px-6 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-4">Book Service</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 bg-white mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Service Details</Text>
          <View className="flex-row">
            <Image
              source={{ uri: getImageForService() }}
              className="w-20 h-20 rounded-lg"
              resizeMode="cover"
            />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold text-gray-800">{service?.serviceName}</Text>
              <Text className="text-sm text-gray-600">{service?.category}</Text>
              
              {isEligibleForDiscount ? (
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-500 line-through">
                      Rs. {parseFloat(service.price).toFixed(2)}
                    </Text>
                    <View className="ml-2 bg-green-100 px-2 py-0.5 rounded">
                      <Text className="text-xs text-green-700">{discountPercentage}% OFF</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-medium text-green-700 mt-0.5">
                    Rs. {discountedPrice?.toFixed(2)}
                  </Text>
                </View>
              ) : (
                <Text className="text-sm font-medium text-gray-800 mt-1">
                  Rs. {parseFloat(service.price).toFixed(2)}
                </Text>
              )}
              
              <Text className="text-xs text-gray-500 mt-1">
                By {service?.serviceProvider?.businessName || 'Unknown Provider'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4 bg-white p-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-3">Loyalty Program</Text>
          
          {userInfo && service?.serviceProvider ? (
            <LoyaltyCard
              customerId={userInfo.id}
              serviceProviderId={service.serviceProvider.id}
              providerName={service.serviceProvider.businessName || 'Provider'}
            />
          ) : (
            <View className="bg-gray-50 p-6 rounded-lg">
              <View className="items-center mb-4">
                <AntDesign name="staro" size={24} color="#6366f1" />
                <Text className="text-base font-medium text-gray-700 mt-2">
                  Loyalty Benefits
                </Text>
                <Text className="text-sm text-gray-500 text-center mt-1">
                  After 4 completed bookings with {service?.serviceProvider?.businessName || 'this provider'}, 
                  you'll get 20% off your next service!
                </Text>
              </View>
              
              {!userInfo && (
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/login')}
                  className="bg-indigo-600 py-2 px-4 rounded-md items-center justify-center mb-2"
                >
                  <Text className="text-white font-medium text-center">Sign In</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View className="p-4 bg-white mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Booking Information</Text>
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Select Date</Text>
          <TouchableOpacity
            className="flex-row items-center p-3 bg-gray-100 rounded-lg mb-4"
            onPress={showDatePicker}
          >
            <AntDesign name="calendar" size={20} color="#6B7280" />
            <Text className="ml-2 flex-1 text-gray-800">
              {formatDateDisplay(bookingDateTime)}
            </Text>
          </TouchableOpacity>
          
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={hideDatePicker}
            minimumDate={new Date()} // Prevent selecting past dates
          />
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Select Time</Text>
          <TouchableOpacity
            className="flex-row items-center p-3 bg-gray-100 rounded-lg mb-4"
            onPress={showTimePicker}
          >
            <AntDesign name="clockcircle" size={20} color="#6B7280" />
            <Text className="ml-2 flex-1 text-gray-800">
              {formatTimeDisplay(bookingDateTime)}
            </Text>
          </TouchableOpacity>
          
          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={handleTimeConfirm}
            onCancel={hideTimePicker}
          />
          
          <Text className="text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</Text>
          <TextInput
            className="bg-gray-100 p-3 rounded-lg mb-4 text-gray-700 h-32"
            placeholder="Add any special requirements or preferences..."
            multiline
            value={bookingNotes}
            onChangeText={setBookingNotes}
          />
        </View>

        <View className="p-4 bg-white mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Your Information</Text>
          <View className="bg-purple-50 p-4 rounded-lg">
            <Text className="text-gray-800 font-medium">Name: {userInfo?.fullName || 'Not available'}</Text>
            <Text className="text-gray-800 mt-1">Email: {userInfo?.email || 'Not available'}</Text>
            <Text className="text-gray-800 mt-1">Phone: {userInfo?.phoneNumber || 'Not available'}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          className={`${isBooking ? 'bg-purple-400' : 'bg-purple-600'} py-4 rounded-lg items-center`}
          onPress={handleBookService}
          disabled={isBooking}
        >
          {isBooking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-base">Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}