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
import { getBookingById } from '../services/api';
import { getCurrentLocation } from '../services/locationService';

export default function TrackRiderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  
  const [booking, setBooking] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState<any>(null);
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
      const bookingResponse = await getBookingById(bookingId);
      setBooking(bookingResponse.data);
      
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

      // Set rider location to their pickup point
      if (bookingResponse.data.pickupPoint?.coordinates) {
        setRiderLocation({
          latitude: bookingResponse.data.pickupPoint.coordinates.latitude,
          longitude: bookingResponse.data.pickupPoint.coordinates.longitude,
        });
      }

    } catch (error) {
      Alert.alert('Error', 'Could not load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const updateLocations = async () => {
    // Simulate rider location updates (in real app, rider would share live location)
    const location = await getCurrentLocation();
    if (location) {
      setMyLocation(location);
    }
  };

  const calculateDistance = () => {
    if (!riderLocation || !myLocation) return 'Calculating...';
    
    const lat1 = riderLocation.latitude;
    const lon1 = riderLocation.longitude;
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
    
    return `${distance.toFixed(1)} km`;
  };

  const calculateETA = () => {
    if (!riderLocation || !myLocation) return 'Calculating...';
    
    const lat1 = myLocation.latitude;
    const lon1 = myLocation.longitude;
    const lat2 = riderLocation.latitude;
    const lon2 = riderLocation.longitude;
    
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
    const passenger = booking?.rider || booking?.passenger;
    if (passenger?.phone) {
      Linking.openURL(`tel:${passenger.phone}`);
    }
  };

  const handleWhatsApp = async () => {
    const passenger = booking?.rider || booking?.passenger;
    if (!passenger?.phone) return;

    const message = `Hi ${passenger.name}! I'm on my way to pick you up. ETA: ${calculateETA()}`;
    const url = `whatsapp://send?phone=+91${passenger.phone}&text=${encodeURIComponent(message)}`;

    const supported = await Linking.canOpenURL("whatsapp://send");
    if (!supported) {
      Alert.alert("WhatsApp not installed");
      return;
    }

    Linking.openURL(url);
  };

  const handleNavigate = () => {
    if (riderLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${riderLocation.latitude},${riderLocation.longitude}`;
      Linking.openURL(url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading rider tracking...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const passenger = booking.rider || booking.passenger;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation
      >
        {/* Your Location (Driver) */}
        {myLocation && (
          <Marker coordinate={myLocation} title="Your Location (Driver)">
            <View style={styles.myLocationMarker}>
              <Text style={styles.markerIcon}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Rider Location */}
        {riderLocation && (
          <Marker 
            coordinate={riderLocation} 
            title={passenger?.name || "Rider"}
            description={booking.pickupPoint?.address}
          >
            <View style={styles.riderMarker}>
              <Text style={styles.markerIcon}>📍</Text>
            </View>
          </Marker>
        )}

        {/* Route Line */}
        {riderLocation && myLocation && (
          <Polyline
            coordinates={[myLocation, riderLocation]}
            strokeColor="#4CAF50"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.riderInfo}>
          <View style={styles.riderAvatar}>
            <Text style={styles.riderAvatarText}>
              {passenger?.name?.charAt(0).toUpperCase() || 'R'}
            </Text>
          </View>
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{passenger?.name || 'Unknown'}</Text>
            <Text style={styles.riderCollege}>🎓 {passenger?.college || 'N/A'}</Text>
            <Text style={styles.riderPhone}>📞 {passenger?.phone || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, {
            backgroundColor: booking.status === 'confirmed' ? '#4CAF50' : '#FF9800'
          }]}>
            <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>💺 Seats</Text>
            <Text style={styles.detailValue}>{booking.seatsBooked}</Text>
          </View>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>💰 Amount</Text>
            <Text style={[styles.detailValue, styles.priceText]}>
              ₹{booking.totalPrice || (booking.seatsBooked * (booking.ride?.pricePerSeat || 0))}
            </Text>
          </View>
        </View>

        {/* Pickup Address */}
        <View style={styles.addressBox}>
          <Text style={styles.addressLabel}>📍 Pickup Location</Text>
          <Text style={styles.addressText}>
            {booking.pickupPoint?.address || 'Not specified'}
          </Text>
        </View>

        {/* Distance & ETA */}
        <View style={styles.etaContainer}>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>Distance</Text>
            <Text style={styles.etaValue}>{calculateDistance()}</Text>
          </View>
          <View style={styles.etaBox}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>{calculateETA()}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCall}>
            <Text style={styles.actionButtonText}>📞 Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.whatsappButton]} onPress={handleWhatsApp}>
            <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.navigateButton]} onPress={handleNavigate}>
            <Text style={styles.actionButtonText}>🗺️ Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Live Update Indicator */}
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live tracking • Updates every 10s</Text>
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
  errorText: { fontSize: 18, color: '#666', marginBottom: 20 },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8
  },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  map: { flex: 1 },
  myLocationMarker: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff', elevation: 5,
  },
  riderMarker: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff', elevation: 5,
  },
  markerIcon: { fontSize: 24 },
  infoCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, elevation: 10,
  },
  riderInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  riderAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center',
    marginRight: 15,
  },
  riderAvatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  riderDetails: { flex: 1 },
  riderName: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  riderCollege: { fontSize: 14, color: '#666', marginBottom: 2 },
  riderPhone: { fontSize: 14, color: '#666' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  detailLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  detailValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  priceText: { color: '#4CAF50' },
  addressBox: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  addressLabel: { fontSize: 12, fontWeight: '600', color: '#2196F3', marginBottom: 5 },
  addressText: { fontSize: 14, color: '#333', lineHeight: 20 },
  etaContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15
  },
  etaBox: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  etaLabel: { fontSize: 12, color: '#666', marginBottom: 5 },
  etaValue: { fontSize: 24, fontWeight: 'bold', color: '#2196F3' },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  actionButton: { flex: 1, borderRadius: 12, padding: 15, alignItems: 'center' },
  callButton: { backgroundColor: '#2196F3' },
  whatsappButton: { backgroundColor: '#25D366' },
  navigateButton: { backgroundColor: '#FF9800' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8
  },
  liveText: { fontSize: 12, color: '#666', fontStyle: 'italic' }
});