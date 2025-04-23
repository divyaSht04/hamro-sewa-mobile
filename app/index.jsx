import { View, ScrollView, StyleSheet, Text, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import CustomButton from '../components/CustomButton'
import { router } from 'expo-router'

const Index = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Image 
            source={require('../assets/images/react-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome to Hamro Sewa</Text>
          <Text style={styles.subtitle}>
            Your trusted service booking platform
          </Text>
          
          <View style={styles.buttonContainer}>
            <CustomButton 
              title="Sign In" 
              handlePress={() => router.push('/(auth)/login')} 
            />
            
            <View style={{height: 16}} />
            
            <CustomButton 
              title="Create Account" 
              handlePress={() => router.push('/(auth)/register')} 
            />
            
            <View style={{height: 20}} />
            
            <CustomButton 
              title="Continue as Guest" 
              handlePress={() => router.push('/(tabs)/home')} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#161622',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  }
});

export default Index