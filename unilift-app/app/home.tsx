// home.tsx (replace the previous file content with this)
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { matchRides } from '../services/api';
import { getCurrentLocation, getAddressFromCoordinates } from '../services/locationService';
import { AuthContext } from '../utils/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [mode, setMode] = useState<'find' | 'offer'>('find');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchSource, setSearchSource] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // NOTE: we intentionally DO NOT call fetchRides on mount.
  // The screen will show only the search UI until user searches.

  const geocodeAddress = async (address: string) => {
    try {
      if (!address) return null;
      // Use OpenStreetMap Nominatim
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'UniLift/1.0 (rishika.anand0805@gmail.com)',
          Accept: 'application/json'
        }
      });
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        const place = json[0];
        return {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const useCurrentLocation = async (field: 'source' | 'destination') => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        const address = await getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
        if (field === 'source') {
          setSearchSource(address);
        } else {
          setSearchDestination(address);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchSource || !searchDestination) {
      Alert.alert('Please enter both pickup and drop locations');
      return;
    }

    setLoading(true);
    try {
      // geocode both addresses (first try quick geocode, else fallback to current location)
      const [fromCoords, toCoords] = await Promise.all([
        geocodeAddress(searchSource),
        geocodeAddress(searchDestination)
      ]);

      if (!fromCoords || !toCoords) {
        Alert.alert(
          'Location not found',
          'Could not convert one of the addresses to coordinates. Try a more specific address or use the location button.'
        );
        setLoading(false);
        return;
      }

      const params: any = {
        fromLat: fromCoords.latitude,
        fromLng: fromCoords.longitude,
        toLat: toCoords.latitude,
        toLng: toCoords.longitude,
        maxDistanceKm: 12 // tweakable
      };

      const response = await matchRides(params);
      setRides(response.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // refresh current matched results (if any)
    setTimeout(() => setRefreshing(false), 800);
  };

  const RideCard = ({ ride }) => {
    if (!ride) return null;

    const driver = ride.driver || {};
    const source = ride.source || {};
    const destination = ride.destination || {};

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push(`/ride-detail?id=${ride._id}`)}
      >
        <View style={styles.rideHeader}>
          <Text style={styles.driverName}>{driver.name || "Unknown Driver"}</Text>
          <Text style={styles.rating}>
            ⭐ {driver.rating ? driver.rating.toFixed(1) : "0.0"}
          </Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>From:</Text>
            <Text style={styles.routeText}>{source.address || "Unknown"}</Text>
          </View>

          <Text style={styles.arrow}>→</Text>

          <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>To:</Text>
            <Text style={styles.routeText}>{destination.address || "Unknown"}</Text>
          </View>
        </View>

        <View style={styles.rideInfo}>
          <Text style={styles.infoText}>
            📅 {ride.date ? new Date(ride.date).toLocaleDateString("en-IN") : "--"}
          </Text>

          <Text style={styles.infoText}>🕐 {ride.time || "--"}</Text>
          <Text style={styles.infoText}>💺 {ride.availableSeats || "?"} seats</Text>
          <Text style={styles.price}>₹{ride.pricePerSeat || "?"}/seat</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text style={styles.college}>🎓 {driver.college || "Unknown College"}</Text>

  {/* Match Score Percentage */}
  <Text style={{ fontSize: 13, color: '#4CAF50', fontWeight: '600' }}>
    {ride.score
      ? `✨ Match: ${Math.round(ride.score * 100)}%`
      : '✨ Match: --'}
  </Text>
</View>


        <View style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 13, color: '#777' }}>
            📍 Pickup dist: {ride.pickupDistanceKm ?? '--'} km • Drop dist: {ride.dropDistanceKm ?? '--'} km
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚗 UniLift</Text>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => router.push('/find-ride-map')}
        >
          <Text style={styles.mapIcon}>🗺️</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/profile');
            }}
          >
            <Text style={styles.menuItemText}>👤 Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/my-rides');
            }}
          >
            <Text style={styles.menuItemText}>🚗 My Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/my-bookings');
            }}
          >
            <Text style={styles.menuItemText}>📝 My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              router.push('/post-ride');
            }}
          >
            <Text style={styles.menuItemText}>➕ Post Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'find' && styles.modeButtonActive]}
          onPress={() => setMode('find')}
        >
          <Text style={[styles.modeButtonText, mode === 'find' && styles.modeButtonTextActive]}>
            🔍 Find a Pool
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'offer' && styles.modeButtonActive]}
          onPress={() => setMode('offer')}
        >
          <Text style={[styles.modeButtonText, mode === 'offer' && styles.modeButtonTextActive]}>
            🚗 Offer a Pool
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'find' ? (
        <View style={styles.content}>
          {/* Search Section */}
          <View style={styles.searchContainer}>
            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search from..."
                value={searchSource}
                onChangeText={setSearchSource}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => useCurrentLocation('source')}
                disabled={locationLoading}
              >
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWithButton}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search to..."
                value={searchDestination}
                onChangeText={setSearchDestination}
              />
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => useCurrentLocation('destination')}
                disabled={locationLoading}
              >
                <Text style={styles.locationButtonText}>📍</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>🔍 Search Rides</Text>
            </TouchableOpacity>
          </View>

          {/* Rides List */}
          <FlatList
            data={rides}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <RideCard ride={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No matched rides yet</Text>
                <Text style={styles.emptySubtext}>Enter From and To and tap Search</Text>
              </View>
            }
          />
        </View>
      ) : (
        // Offer Pool View (unchanged)
        <View style={styles.offerContainer}>
          <Text style={styles.offerTitle}>Ready to offer a ride?</Text>
          <Text style={styles.offerSubtitle}>
            Help fellow students and earn some extra cash!
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💰</Text>
              <Text style={styles.benefitText}>Share travel costs</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🌍</Text>
              <Text style={styles.benefitText}>Reduce carbon footprint</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>👥</Text>
              <Text style={styles.benefitText}>Make new friends</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.postRideButton}
            onPress={() => router.push('/post-ride')}
          >
            <Text style={styles.postRideButtonText}>➕ Post a Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewMyRidesButton}
            onPress={() => router.push('/my-rides')}
          >
            <Text style={styles.viewMyRidesButtonText}>View My Posted Rides</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// styles you already have below (unchanged)...
const styles = StyleSheet.create({
  /* keep your existing style definitions here (same as before) */
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 20,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
  },
  modeButtonActive: {
    backgroundColor: '#2196F3',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    width: 45,
    alignItems: 'center',
  },
  locationButtonText: {
    fontSize: 20,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  rating: {
    fontSize: 16,
    color: '#FF9800',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeItem: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 20,
    marginHorizontal: 10,
    color: '#2196F3',
  },
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  college: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  offerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  offerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  postRideButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  postRideButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewMyRidesButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  viewMyRidesButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
});
