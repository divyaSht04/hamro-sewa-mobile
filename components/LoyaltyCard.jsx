import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { getLoyaltyProgress } from '../services/loyaltyService';
import * as StorageService from '../services/storageService';

const LoyaltyCard = ({ customerId, serviceProviderId, providerName }) => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localCustomerId, setLocalCustomerId] = useState(customerId);
  const [localProviderId, setLocalProviderId] = useState(serviceProviderId);

  const getLocalUserData = async () => {
    if (!localCustomerId) {
      try {
        const userData = await StorageService.getUser();
        if (userData?.id) {
          setLocalCustomerId(userData.id);
          return userData.id;
        }
      } catch (err) {
        console.error('Error retrieving user data:', err);
      }
    }
    return localCustomerId;
  };

  const fetchLoyaltyData = async () => {
    const effectiveCustomerId = await getLocalUserData();
    const effectiveProviderId = localProviderId || serviceProviderId;
    
    if (!effectiveCustomerId || !effectiveProviderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getLoyaltyProgress(effectiveCustomerId, effectiveProviderId);
      
      if (!data.discountEligible && !data.eligibleForDiscount && data.completedBookings >= 4) {
        data.discountEligible = true;
        data.eligibleForDiscount = true;
      }
      
      setLoyaltyData(data);
    } catch (err) {
      console.error('Error loading loyalty info:', err);
      setError('Unable to load loyalty information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId !== localCustomerId) setLocalCustomerId(customerId);
    if (serviceProviderId !== localProviderId) setLocalProviderId(serviceProviderId);
  }, [customerId, serviceProviderId]);

  useEffect(() => {
    if (localCustomerId && localProviderId) {
      fetchLoyaltyData();
    } else {
      getLocalUserData().then(userId => {
        if (userId && localProviderId) {
          fetchLoyaltyData();
        }
      });
    }
  }, [localCustomerId, localProviderId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading loyalty status...</Text>
      </View>
    );
  }

  if (!localCustomerId || !localProviderId) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoText}>
          {!localCustomerId ? 'Please sign in to view loyalty status' : 'Service provider information is missing'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchLoyaltyData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loyaltyData) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderContainer}>
          <AntDesign name="staro" size={24} color="#9ca3af" style={{marginBottom: 8}} />
          <Text style={styles.infoTitle}>Loyalty Program</Text>
          <Text style={styles.infoText}>
            Complete bookings with {providerName || 'this provider'} to earn loyalty points.
            After 4 completed bookings, you'll receive a 20% discount on your next service!
          </Text>
        </View>
      </View>
    );
  }

  const { 
    completedBookings = 0, 
    eligibleForDiscount = false,
    discountPercentage = 20
  } = loyaltyData;

  const progressPercentage = Math.min((completedBookings / 4) * 100, 100);

  return (
    <View style={styles.container}>
      {eligibleForDiscount ? (
        <View style={styles.successContainer}>
          <View style={styles.successHeader}>
            <AntDesign name="checkcircle" size={20} color="#10B981" />
            <Text style={styles.successTitle}>Congratulations!</Text>
          </View>
          <Text style={styles.successDescription}>
            You qualify for a {discountPercentage}% discount on this booking!
          </Text>
        </View>
      ) : (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Completed bookings: {completedBookings}
          </Text>
          <Text style={styles.progressText}>
            Bookings needed for {discountPercentage}% discount: {Math.max(4 - completedBookings, 0)} more
          </Text>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${progressPercentage}%` }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    color: '#6b7280',
    marginTop: 4, 
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  successContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  successTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  successDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6B46C1',
    borderRadius: 4,
  }
});

export default LoyaltyCard;