import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const features = [
  {
    icon: 'groups',
    title: 'Our Vision',
    description: 'To revolutionize the service industry through technology and innovation, making quality services accessible to all.'
  },
  {
    icon: 'track-changes',
    title: 'Our Mission',
    description: 'Delivering exceptional services that simplify lives and exceed expectations, while empowering local service providers.'
  },
  {
    icon: 'emoji-events',
    title: 'Our Values',
    description: 'Integrity, excellence, and customer satisfaction guide everything we do, fostering trust and long-lasting relationships.'
  },
];

const timeline = [
  { year: '2015', event: 'Hamro Sewa founded by a group of passionate entrepreneurs' },
  { year: '2017', event: 'Expanded services to cover major cities across the country' },
  { year: '2019', event: 'Launched mobile app for easier booking and management' },
  { year: '2021', event: 'Introduced eco-friendly service options' },
  { year: '2023', event: 'Reached milestone of 1 million satisfied customers' },
];

const stats = [
  { value: '50,000+', label: 'Service Providers' },
  { value: '1M+', label: 'Satisfied Customers' },
  { value: '100+', label: 'Cities Covered' },
  { value: '4.8/5', label: 'Average Rating' },
];

const whyChooseUs = [
  {
    icon: 'check-circle',
    title: 'Vetted Professionals',
    description: 'All our service providers undergo thorough background checks and skill assessments.'
  },
  {
    icon: 'access-time',
    title: 'Timely Service',
    description: 'We value your time and ensure punctual service delivery.'
  },
  {
    icon: 'flash-on',
    title: 'Instant Booking',
    description: 'Book services with just a few taps on our user-friendly platform.'
  },
  {
    icon: 'favorite',
    title: 'Customer Satisfaction',
    description: 'Your satisfaction is our top priority, backed by our service guarantee.'
  },
];

export default function AboutPage() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style='light' backgroundColor='#161622' />


      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="bg-[#161622] px-4 py-8">
          <Text className="text-3xl font-bold text-white text-center mb-3">About Hamro Sewa</Text>
          <Text className="text-base text-white text-center">
            Connecting quality service providers with customers since 2015. We're on a mission to simplify your life, one service at a time.
          </Text>
        </View>

        {/* Our Story Section */}
        <View className="bg-white px-4 py-6 mt-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Our Story</Text>
          <Text className="text-gray-600 mb-3">
            Hamro Sewa was born from a simple yet powerful idea: to make everyday services accessible, reliable, and hassle-free for everyone. Our journey began in 2015 when a group of passionate entrepreneurs recognized the need for a platform that could bridge the gap between skilled service providers and customers seeking quality services.
          </Text>
          <Text className="text-gray-600 mb-4">
            Since then, we've grown from a small startup to a trusted name in the service industry, connecting thousands of skilled professionals with customers across the country.
          </Text>

          <Image
            source={{ uri: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }}
            className="w-full h-48 rounded-lg mt-2"
            resizeMode="cover"
          />
        </View>

        {/* Vision, Mission, Values Section */}
        <View className="bg-white px-4 py-6 mt-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Our Foundation</Text>

          {features.map((feature, index) => (
            <View key={index} className="bg-gray-100 p-4 rounded-lg mb-4">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name={feature.icon} size={28} color="#FF9C01" />
                <Text className="text-lg font-bold text-gray-800 ml-2">{feature.title}</Text>
              </View>
              <Text className="text-gray-600">{feature.description}</Text>
            </View>
          ))}
        </View>

        {/* Timeline Section */}
        <View className="bg-white px-4 py-6 mt-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Our Journey</Text>

          {timeline.map((item, index) => (
            <View key={index} className="flex-row mb-4">
              <View className="items-center">
                <View className="w-3 h-3 rounded-full bg-secondary" />
                {index !== timeline.length - 1 && (
                  <View className="w-1 flex-1 bg-gray-300 mt-1" style={{ height: 50 }} />
                )}
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-secondary">{item.year}</Text>
                <Text className="text-gray-600">{item.event}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Stats Section */}
        <View className="bg-[#161622] px-4 py-6 mt-4">
          <Text className="text-2xl font-bold text-white text-center mb-4">Hamro Sewa in Numbers</Text>

          <View className="flex-row flex-wrap justify-between">
            {stats.map((stat, index) => (
              <View key={index} className="w-[48%] bg-[#232533] p-4 rounded-lg mb-4 items-center">
                <Text className="text-2xl font-bold text-secondary">{stat.value}</Text>
                <Text className="text-white text-center">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Why Choose Us Section */}
        <View className="bg-white px-4 py-6 mt-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Why Choose Hamro Sewa?</Text>

          {whyChooseUs.map((item, index) => (
            <View key={index} className="flex-row items-start mb-4">
              <MaterialIcons name={item.icon} size={24} color="#FF9C01" />
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-gray-800">{item.title}</Text>
                <Text className="text-gray-600">{item.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Call to Action Section */}
        <View className="bg-gray-100 px-4 py-8 mt-4 items-center">
          <Text className="text-2xl font-bold text-gray-800 text-center mb-2">Ready to Experience Hamro Sewa?</Text>
          <Text className="text-gray-600 text-center mb-4">Join thousands of satisfied customers and simplify your life today.</Text>

          <TouchableOpacity className="bg-secondary py-3 px-6 rounded-lg">
            <Text className="text-white font-bold text-center">Book a Service Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
