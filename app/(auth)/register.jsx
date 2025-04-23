import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    address: '',
    dateOfBirth: '2000-01-01', // Default date of birth required by backend
    gender: 'MALE', // Default gender required by backend
  });
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLocalLoading, setIsLocalLoading] = useState(false); // Add local loading state

  // Get authentication context
  const { register, isLoading, isAuthenticated } = useAuth();
  

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    // Username validation
    if (!formData.username.trim()) {
      formErrors.username = 'Username is required';
      isValid = false;
    } else if (formData.username.length < 4) {
      formErrors.username = 'Username must be at least 4 characters';
      isValid = false;
    }
    
    // Full name validation
    if (!formData.fullName.trim()) {
      formErrors.fullName = 'Full name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      formErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      formErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      formErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      formErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      formErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      formErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Note: Confirm password validation removed since field has been removed from UI
    // Address validation
    if (!formData.address.trim()) {
      formErrors.address = 'Address is required';
      isValid = false;
    }
    
    // Date of birth is required (using default if not set by user)
    if (!formData.dateOfBirth) {
      formErrors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    }
    
    // Logging validation errors for debugging
    console.log('Validation errors:', Object.keys(formErrors));

    setErrors(formErrors);
    return isValid;
  };

  // Request permission and handle profile image selection
  const handleImageUpload = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to upload a profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      console.log('Opening image picker...');
      // Use the correct enum value for mediaTypes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Keep using the enum for now
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      console.log('Image picker result received');
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage.uri);
        setProfileImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert(
        'Error',
        'Failed to pick an image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    console.log("=== STARTING REGISTRATION SUBMISSION ===")
    if (!validateForm()) {
      console.log("Form validation failed")
      return;
    }
    console.log("Form validation passed");
    
    // Log form data for debugging
    console.log("Form data:", {
      username: formData.username,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      hasPassword: !!formData.password,
      hasProfileImage: !!profileImage
    });
    try {
      setIsLocalLoading(true); // Use local loading state
      
      // Clear previous errors
      setErrors({});
      
      console.log('Preparing registration data with image:', !!profileImage);
      
      // Prepare user data for registration
      const userData = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth, // Make sure these fields are included
        gender: formData.gender, // Make sure these fields are included
        profileImage: profileImage // Image URI from expo-image-picker
      };
      
      console.log('Calling register function from auth context...');
      // Call register from auth context
      const result = await register(userData);
      console.log('Registration result received:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error || 'none'
      });
      
      if (result.success) {
        // Navigate to verification page with email/phone for OTP
        router.push({
          pathname: '/(auth)/verify',
          params: { 
            email: formData.email,
            phone: formData.phoneNumber 
          }
        });
      } else {
        // Show error message
        console.warn('Registration failed:', result.error);
        setErrors({ form: result.error || 'Registration failed. Please try again.' });
        
        Alert.alert(
          'Registration Error',
          result.error || 'Registration failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Registration error caught in UI:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setErrors({ form: errorMessage });
      
      // Show error in alert for debugging on phone
      Alert.alert(
        'Registration Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLocalLoading(false); // Use local loading state
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Header and Logo */}
          <View className="items-center mt-6">
            <Image 
              source={require('../../assets/images/react-logo.png')} 
              className="w-20 h-20 mb-2"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-gray-800 mb-1">Create Account</Text>
            <Text className="text-base text-gray-500 text-center mb-8">
              Sign up to get started with Hamro Sewa
            </Text>
          </View>

          {/* Error message if any */}
          {errors.form && (
            <View className="bg-red-50 p-3 rounded-lg mb-4">
              <Text className="text-red-500">{errors.form}</Text>
            </View>
          )}

          {/* Register Form */}
          <View className="mt-2">
            {/* Profile Image Upload */}
            <View className="items-center mb-6">
              <TouchableOpacity 
                onPress={handleImageUpload}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                {profileImage ? (
                  <Image 
                    source={{ uri: profileImage }} 
                    className="w-24 h-24 rounded-full mb-2"
                  />
                ) : (
                  <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-2">
                    <Ionicons name="person" size={40} color="#999" />
                  </View>
                )}
                <Text className="text-secondary font-medium text-center">
                  {profileImage ? 'Change Profile Picture' : 'Upload Profile Picture'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <FormField
              label="Username"
              placeholder="Choose a username"
              value={formData.username}
              onChangeText={(text) => handleChange('username', text)}
              iconName="at"
              iconType="Ionicons"
              errorText={errors.username}
            />
            
            <FormField
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              iconName="person"
              iconType="Ionicons"
              errorText={errors.fullName}
            />
            
            <FormField
              label="Email Address"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              iconName="mail"
              iconType="Ionicons"
              errorText={errors.email}
            />
            
            <FormField
              label="Phone Number"
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              keyboardType="phone-pad"
              iconName="call"
              iconType="Ionicons"
              errorText={errors.phoneNumber}
            />
            
            <FormField
              label="Address"
              placeholder="Enter your address"
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              iconName="location"
              iconType="Ionicons"
              errorText={errors.address}
            />
            
            <FormField
              label="Password"
              placeholder="Create a password"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              iconName="lock-closed"
              iconType="Ionicons"
              secureTextEntry={!showPassword}
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              rightIconType="Ionicons"
              onRightIconPress={() => setShowPassword(!showPassword)}
              errorText={errors.password}
            />
            
            <View className="flex-row items-center mt-2 mb-4">
              <Text className="text-gray-700 font-medium mb-1">Gender:</Text>
              <View className="flex-row ml-4">
                <TouchableOpacity 
                  className={`flex-row items-center mr-4 ${formData.gender === 'MALE' ? 'opacity-100' : 'opacity-50'}`}
                  onPress={() => handleChange('gender', 'MALE')}
                >
                  <View className={`w-5 h-5 rounded-full border border-secondary mr-1 items-center justify-center ${formData.gender === 'MALE' ? 'bg-secondary' : 'bg-white'}`}>
                    {formData.gender === 'MALE' && <View className="w-3 h-3 rounded-full bg-white" />}
                  </View>
                  <Text>Male</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className={`flex-row items-center ${formData.gender === 'FEMALE' ? 'opacity-100' : 'opacity-50'}`}
                  onPress={() => handleChange('gender', 'FEMALE')}
                >
                  <View className={`w-5 h-5 rounded-full border border-secondary mr-1 items-center justify-center ${formData.gender === 'FEMALE' ? 'bg-secondary' : 'bg-white'}`}>
                    {formData.gender === 'FEMALE' && <View className="w-3 h-3 rounded-full bg-white" />}
                  </View>
                  <Text>Female</Text>
                </TouchableOpacity>
                <Text className="text-xs text-gray-500 ml-2">(Current: {formData.gender})</Text>
              </View>
            </View>
            
            <Text className="text-gray-700 font-medium mb-1">Date of Birth: <Text className="text-xs text-gray-500">(Current: {formData.dateOfBirth})</Text></Text>
            <View className="bg-gray-100 rounded-lg px-4 py-3 mb-4">
              <TextInput
                value={formData.dateOfBirth}
                onChangeText={(text) => handleChange('dateOfBirth', text)}
                placeholder="YYYY-MM-DD"
                keyboardType="numeric"
                className="text-gray-800"
              />
              {errors.dateOfBirth && <Text className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</Text>}
              <Text className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD (e.g., 2000-01-01)</Text>
            </View>
          
          </View>

          <View className="mt-4 mb-4">
            <Text className="text-sm text-gray-600 text-center">
              By signing up, you agree to our{' '}
              <Text className="text-secondary font-medium">Terms of Service</Text> and{' '}
              <Text className="text-secondary font-medium">Privacy Policy</Text>
            </Text>
          </View>

          <CustomButton
            title={isLoading || isLocalLoading ? 'Registering...' : 'Register'}
            handlePress={handleSubmit}
            isLoading={isLoading || isLocalLoading}
            disabled={isLoading || isLocalLoading}
            style={{
              marginBottom: 16
            }}
          />
          
          {/* Form error message */}
          {errors.form && (
            <View className="bg-red-50 p-3 rounded-lg mb-4">
              <Text className="text-red-500 text-center">{errors.form}</Text>
            </View>
          )}

          <View className="flex-row justify-center mt-6 mb-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-secondary font-medium">Sign In</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
