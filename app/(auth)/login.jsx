import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Get authentication context
  const { signIn, isLoading, isAuthenticated, user } = useAuth();

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    // Email validation
    if (!formData.email) {
      formErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      formErrors.email = 'Email is invalid';
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

    setErrors(formErrors);
    return isValid;
  };

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // Clear previous errors
      setErrors({});
      
      console.log('Attempting login with:', {
        email: formData.email,
        passwordLength: formData.password?.length || 0
      });
      
      // Call sign in from auth context
      const result = await signIn(formData.email, formData.password);
      
      console.log('Login result:', result);
      
      if (result.success) {
        // Navigate to home on successful login
        console.log('Login successful, navigating to home');
        router.replace('/(tabs)/home');
      } else {
        // Show error message
        console.warn('Login failed:', result.error);
        setErrors({ form: result.error || 'Login failed. Please try again.' });
        
        Alert.alert(
          'Login Error',
          result.error || 'Login failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Login error caught in UI:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      setErrors({ form: errorMessage });
      
      // Show error in alert for debugging on phone
      Alert.alert(
        'Login Error',
        errorMessage,
        [{ text: 'OK' }]
      );
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
            <Text className="text-3xl font-bold text-gray-800 mb-1">Welcome Back!</Text>
            <Text className="text-base text-gray-500 text-center mb-8">
              Sign in to your account to continue
            </Text>
          </View>

          {/* Error message if any */}
          {errors.form && (
            <View className="bg-red-50 p-3 rounded-lg mb-4">
              <Text className="text-red-500">{errors.form}</Text>
            </View>
          )}

          {/* Login Form */}
          <View className="mt-2">
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
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              isPassword={true}
              iconName="lock-closed"
              iconType="Ionicons"
              errorText={errors.password}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />


            <CustomButton 
              title="Login" 
              handlePress={handleSubmit}
              isLoading={isLoading}
              style={{
                marginBottom: 16
              }}
            />
          </View>

          <View className="flex-row justify-center mt-6 mb-6">
            <Text className="text-gray-600">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-secondary font-medium">Sign Up</Text>
            </TouchableOpacity>
          </View>
          

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
