import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { getCurrentLocation } from '../services/locationService';
import { searchRides } from '../services/api';

export default function FindRideMapScreen() {
  const router = useRouter();
  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchRadius, setSearchRadius] = useState('5');

  useEffect(() => {
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        await fetchNearbyRides(location.latitude, location.longitude);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyRides = async (lat: number, lng: number) => {
    try {
      const response = await searchRides({
        latitude: lat,
        longitude: lng,
        maxDistance: parseInt(searchRadius) * 1000
      });
      setRides(response.data);
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  };

  const handleRidePress = (ride: any) => {
    Alert.alert(
      ride.driver.name,
      `From: ${ride.source.address}\nTo: ${ride.destination.address}\nPrice: ₹${ride.pricePerSeat}/seat\nSeats: ${ride.availableSeats} available`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Details', 
          onPress: () => router.push(`/ride-detail?id=${ride._id}`)
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
  style={styles.map}
  showsUserLocation
  showsMyLocationButton
>
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="You are here"
            description="Your current location"
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationInner} />
            </View>
          </Marker>
        )}

        {/* Ride Markers */}
        {rides.map((ride: any) => (
          <Marker
            key={ride._id}
            coordinate={{
              latitude: ride.source.coordinates.latitude,
              longitude: ride.source.coordinates.longitude
            }}
            onPress={() => handleRidePress(ride)}
          >
            <View style={styles.rideMarkerContainer}>
              <View style={styles.rideMarker}>
                <Text style={styles.markerText}>🚗</Text>
                <Text style={styles.markerSeats}>{ride?.availableSeats ?? "?"}</Text>

              </View>
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>
  {ride?.driver?.name || "Unknown Driver"}
</Text>

<Text style={styles.calloutText}>
  ⭐ {ride?.driver?.rating ? ride.driver.rating.toFixed(1) : "0.0"}
</Text>

                <Text style={styles.calloutText}>💺 {ride.availableSeats} seats</Text>
                <Text style={styles.calloutPrice}>₹{ride.pricePerSeat}/seat</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Search Controls */}
      <View style={styles.controls}>
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Search Radius (km)</Text>
          <View style={styles.radiusControl}>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => setSearchRadius(Math.max(1, parseInt(searchRadius) - 1).toString())}
            >
              <Text style={styles.radiusButtonText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.radiusInput}
              value={searchRadius}
              onChangeText={setSearchRadius}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => setSearchRadius((parseInt(searchRadius) + 1).toString())}
            >
              <Text style={styles.radiusButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => currentLocation && fetchNearbyRides(currentLocation.latitude, currentLocation.longitude)}
          >
            <Text style={styles.searchButtonText}>🔍 Search Rides</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsBadge}>
          <Text style={styles.resultsText}>
            {rides.length} ride{rides.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.listButton}
        onPress={() => router.back()}
      >
        <Text style={styles.listButtonText}>📋 List View</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={() => {
          if (currentLocation) {
            setRegion({
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            });
          }
        }}
      >
        <Text style={styles.recenterButtonText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  currentLocationInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  rideMarkerContainer: {
    alignItems: 'center',
  },
  rideMarker: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 50,
  },
  markerText: {
    fontSize: 20,
  },
  markerSeats: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
  },
  calloutContainer: {
    padding: 10,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  calloutPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 5,
  },
  controls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  radiusControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radiusButton: {
    width: 40,
    height: 40,
    backgroundColor: '#2196F3',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  radiusInput: {
    flex: 1,
    height: 40,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    marginHorizontal: 10,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsBadge: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  listButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterButtonText: {
    fontSize: 24,
  },
});