import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getRideById } from '../services/api';
import { getCurrentLocation } from '../services/locationService';

export default function TrackDriverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  
  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [myLocation, setMyLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    initializeTracking();
    const interval = setInterval(updateLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  const initializeTracking = async () => {
    try {
      const rideResponse = await getRideById(params.rideId as string);
      setRide(rideResponse.data);
      
      const location = await getCurrentLocation();
      if (location) {
        setMyLocation(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }

      setDriverLocation({
        latitude: rideResponse.data.source.coordinates.latitude + 0.01,
        longitude: rideResponse.data.source.coordinates.longitude + 0.01,
      });

    } catch (error) {
      Alert.alert('Error', 'Could not load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const updateLocations = async () => {
    if (driverLocation && myLocation) {
      const latDiff = (myLocation.latitude - driverLocation.latitude) * 0.1;
      const lngDiff = (myLocation.longitude - driverLocation.longitude) * 0.1;
      
      setDriverLocation({
        latitude: driverLocation.latitude + latDiff,
        longitude: driverLocation.longitude + lngDiff,
      });
    }
  };

  const calculateETA = () => {
    if (!driverLocation || !myLocation) return 'Calculating...';
    
    const lat1 = driverLocation.latitude;
    const lon1 = driverLocation.longitude;
    const lat2 = myLocation.latitude;
    const lon2 = myLocation.longitude;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const avgSpeed = 30;
    const time = Math.ceil((distance / avgSpeed) * 60);
    
    return `${time} min`;
  };

  const handleCall = () => {
    if (ride?.driver?.phone) {
      Linking.openURL(`tel:${ride.driver.phone}`);
    }
  };

  const handleMessage = () => {
    if (ride?.driver?.phone) {
      Linking.openURL(`sms:${ride.driver.phone}`);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will call emergency services (112). Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', style: 'destructive', onPress: () => Linking.openURL('tel:112') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading tracking...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
      >
        {myLocation && (
          <Marker coordinate={myLocation} title="Your Location">
            <View style={styles.myLocationMarker}>
              <Text style={styles.markerIcon}>📍</Text>
            </View>
          </Marker>
        )}

        {driverLocation && (
          <Marker coordinate={driverLocation} title="Driver">
            <View style={styles.driverMarker}>
              <Text style={styles.markerIcon}>🚗</Text>
            </View>
          </Marker>
        )}

        {driverLocation && myLocation && (
          <Polyline
            coordinates={[driverLocation, myLocation]}
            strokeColor="#2196F3"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {ride?.driver?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{ride?.driver?.name}</Text>
            <Text style={styles.vehicleInfo}>
              {ride?.vehicleDetails?.model} • {ride?.vehicleDetails?.number}
            </Text>
            <Text style={styles.rating}>⭐ {ride?.driver?.rating?.toFixed(1)}</Text>
          </View>
        </View>

        {/* SOS Button Inside Card */}
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Text style={styles.sosText}>🚨 SOS</Text>
        </TouchableOpacity>

        <View style={styles.etaContainer}>
          <Text style={styles.etaLabel}>ETA</Text>
          <Text style={styles.etaTime}>{calculateETA()}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
            <Text style={styles.actionButtonText}>📞 Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={handleMessage}>
            <Text style={styles.actionButtonText}>💬 Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5'
  },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  map: { flex: 1 },
  myLocationMarker: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff', elevation: 5,
  },
  driverMarker: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff', elevation: 5,
  },
  markerIcon: { fontSize: 24 },
  infoCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, elevation: 10,
  },
  driverInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  driverAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
  },
  driverAvatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  vehicleInfo: { fontSize: 14, color: '#666', marginBottom: 4 },
  rating: { fontSize: 14, color: '#FF9800' },

  sosButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  sosText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  etaContainer: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  etaLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  etaTime: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },

  buttonRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, borderRadius: 12, padding: 15, alignItems: 'center' },
  callButton: { backgroundColor: '#4CAF50' },
  messageButton: { backgroundColor: '#2196F3' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
