import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../../components/CustomButton';

export default function VerificationScreen() {
  const { verifyRegistration } = useAuth();
  const params = useLocalSearchParams();
  const email = params.email;
  const phone = params.phone;

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']); // Update to 6 digits
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]; // Update to 6 refs
  
  // Log initial params for debugging
  useEffect(() => {
    console.log('Verification screen params:', { 
      email: email || 'Not provided', 
      phone: phone || 'Not provided' 
    });
  }, []);

  useEffect(() => {
    // Auto-focus first input on component mount
    if (inputRefs[0].current) {
      setTimeout(() => {
        inputRefs[0].current.focus();
      }, 500);
    }
  }, []);

  useEffect(() => {

    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleCodeChange = (text, index) => {
    if (/^[0-9]?$/.test(text)) {
      const newVerificationCode = [...verificationCode];
      newVerificationCode[index] = text;
      setVerificationCode(newVerificationCode);

      if (text !== '' && index < 5) { 
        inputRefs[index + 1].current.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to navigate to previous input
    if (e.nativeEvent.key === 'Backspace' && index > 0 && verificationCode[index] === '') {
      inputRefs[index - 1].current.focus();
    }
  };

  const resendCode = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, call your backend API to resend the code
      // await AuthService.resendVerificationCode({ email, phone });
      
      // Reset the timer
      setTimer(30);
      setError('');
      // Show success message
      alert('A new verification code has been sent');
    } catch (error) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const code = verificationCode.join('');
    
    // Validate code length
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call verification API with the entered code
      const verificationData = {
        email: email,
        phoneNumber: phone,
        verificationCode: code
      };
      
      console.log('Submitting verification with data:', {
        email: email || 'Not provided',
        phone: phone || 'Not provided',
        codeLength: code.length
      });
      
      // Use the auth context to verify the code
      const response = await verifyRegistration(verificationData);
      
      console.log('Verification response:', response);
      
      if (response.success) {
        // Navigate to home on successful verification
        router.replace('/(tabs)/home');
      } else {
        setError(response.error || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
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
            <Text className="text-3xl font-bold text-gray-800 mb-1">Verification</Text>
            <Text className="text-base text-gray-500 text-center mb-2">
              We've sent a verification code to
            </Text>
            <Text className="text-base font-medium text-secondary mb-8">
              {email || phone}
            </Text>
          </View>

          {/* Error message if any */}
          {error ? (
            <View className="bg-red-50 p-3 rounded-lg mb-4">
              <Text className="text-red-500">{error}</Text>
            </View>
          ) : null}

          {/* Verification code inputs */}
          <View className="mt-4 mb-8">
            <Text className="text-gray-700 font-medium mb-4 text-center">Enter the 6-digit code</Text>
            
            <View className="flex-row justify-between px-4">
              {verificationCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={inputRefs[index]}
                  className="w-12 h-16 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold"
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
          </View>

          {/* Resend code section */}
          <View className="items-center mb-6">
            <Text className="text-gray-600 mb-2">Didn't receive the code?</Text>
            {timer > 0 ? (
              <Text className="text-gray-500">Resend code in {timer} seconds</Text>
            ) : (
              <TouchableOpacity onPress={resendCode}>
                <Text className="text-secondary font-medium">Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>

          <CustomButton
            title="Verify"
            handlePress={handleSubmit}
            isLoading={isLoading}
          />
          
          {/* Back button */}
          <TouchableOpacity 
            className="flex-row items-center justify-center py-4 mt-6"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#666" />
            <Text className="text-gray-600 ml-1">Back to Registration</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
