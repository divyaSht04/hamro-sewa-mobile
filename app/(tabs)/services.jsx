import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getApprovedServices, getServiceImageUrl } from '../../services/providerServiceApi';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

// Fallback images for each category
const fallbackImages = {
  Cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Plumbing: 'https://images.unsplash.com/photo-1603796846097-bee99e4a601f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Electrical: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Gardening: 'https://images.unsplash.com/photo-1599629954294-14df9ec8dfe8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  Painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  default: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
};

export default function ServicesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['All']);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch approved services from the backend
  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await getApprovedServices();
      console.log('Fetched services:', data);
      setServices(data);

      // Extract unique categories from the services
      const uniqueCategories = ['All', ...new Set(data.map((service) => service.category))];
      setCategories(uniqueCategories);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching approved services:', err);
      setError('Unable to load services. The server may be down or unavailable at the moment.');
      setServices([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchServices();
    } catch (error) {
      console.error('Error refreshing services:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter services based on category and search term
  useEffect(() => {
    if (!services || services.length === 0) {
      setFilteredServices([]);
      return;
    }
    
    console.log('Filtering services. Total services:', services.length);
    console.log('Sample service data:', JSON.stringify(services[0]).substring(0, 200) + '...');
    
    const filtered = services.filter(
      (service) => {
        // Handle potential null values safely
        const serviceName = service.serviceName || '';
        const category = service.category || '';
        const providerName = service.serviceProvider?.name || '';
        
        const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
        const matchesSearch = 
          serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          providerName.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
      }
    );
    
    console.log(`Filtered to ${filtered.length} services for category '${selectedCategory}' and search '${searchTerm}'`);
    setFilteredServices(filtered);
  }, [selectedCategory, searchTerm, services]);

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'All':
        return <MaterialIcons name="grid-view" size={24} color="#6B46C1" />;
      case 'Cleaning':
        return <MaterialIcons name="cleaning-services" size={24} color="#6B46C1" />;
      case 'Plumbing':
        return <MaterialCommunityIcons name="pipe" size={24} color="#6B46C1" />;
      case 'Electrical':
        return <MaterialCommunityIcons name="flash" size={24} color="#6B46C1" />;
      case 'Gardening':
        return <MaterialCommunityIcons name="flower" size={24} color="#6B46C1" />;
      case 'Painting':
        return <MaterialCommunityIcons name="brush" size={24} color="#6B46C1" />;
      default:
        return <MaterialIcons name="grid-view" size={24} color="#6B46C1" />;
    }
  };

  // Get image for service
  const getImageForService = (service) => {
    if (service.imagePath) {
      // Debug the image URL
      const imageUrl = getServiceImageUrl(service.id);
      console.log(`Image URL for service ${service.id}:`, imageUrl);
      return imageUrl;
    }
    // If no image path or error loading, use a fallback image based on category
    return fallbackImages[service.category] || fallbackImages.default;
  };

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item)}
    >
      <View style={styles.categoryIcon}>
        {getCategoryIcon(item)}
      </View>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item && styles.categoryTextActive,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  // Render service card
  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => {
        // Navigate to service details screen
        router.push(`/(screens)/service-details/${item.id}`);
      }}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getImageForService(item) }}
          style={styles.serviceImage}
          resizeMode="cover"
        />
        <View style={styles.serviceOverlay}>
          <Text style={styles.serviceName}>{item.serviceName}</Text>
          <Text style={styles.providerName}>
            {item.serviceProvider?.businessName || 'Unknown Provider'}
          </Text>
        </View>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        )}
      </View>
      <View style={styles.serviceContent}>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.serviceFooter}>
          <View style={styles.ratingContainer}>
            <FontAwesome name="star" size={16} color="#F59E0B" />
          </View>
          <View style={styles.priceContainer}>
            <FontAwesome name="Rs" size={16} color="#6B7280" />
            <Text style={styles.priceText}>
              Rs. {item.price ? parseFloat(item.price).toFixed(2) : 'N/A'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.viewDetailsButton}
          onPress={() => {
            // Navigate to service details screen
            router.push(`/(screens)/service-details/${item.id}`);
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#FFFFFF" />
          <Text style={styles.viewDetailsText}>Book Service</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <Ionicons name="server-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Service Unavailable</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            Please try again later or contact support if the problem persists.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchServices}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services or providers..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchTerm('')}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      <View style={styles.servicesContainer}>
        <View style={styles.servicesHeader}>
          <Text style={styles.servicesTitle}>{selectedCategory} Services</Text>
          <Text style={styles.servicesCount}>{filteredServices.length} services found</Text>
        </View>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="info-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Services Found</Text>
            <Text style={styles.emptyMessage}>
              {searchTerm
                ? `No results found for "${searchTerm}". Please try a different search term or category.`
                : selectedCategory !== 'All'
                ? `No ${selectedCategory} services are available at the moment.`
                : 'No services are available at the moment. Please check back later.'}
            </Text>
            <View style={styles.emptyActions}>
              {searchTerm && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchTerm('')}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
              {selectedCategory !== 'All' && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setSelectedCategory('All')}
                >
                  <Text style={styles.viewAllText}>View All Services</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            renderItem={renderServiceCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.servicesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6B46C1']}
                tintColor="#6B46C1"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    marginTop: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
    height: 44,
  },
  categoryButtonActive: {
    backgroundColor: '#6B46C1',
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  servicesContainer: {
    flex: 1,
    padding: 16,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  servicesCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  servicesList: {
    paddingBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: cardWidth,
    alignSelf: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  providerName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(107, 70, 193, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  serviceContent: {
    padding: 16,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    height: 40,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewDetailsButton: {
    backgroundColor: '#6B46C1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginVertical: 12,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: '80%',
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearSearchButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
