import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { createRide } from '../services/api';
import { getCurrentLocation, getAddressFromCoordinates } from '../services/locationService';

export default function PostRideScreen() {
  const router = useRouter();
  
  const [sourceAddress, setSourceAddress] = useState('');
  const [sourceLat, setSourceLat] = useState('');
  const [sourceLng, setSourceLng] = useState('');
  
  const [destAddress, setDestAddress] = useState('');
  const [destLat, setDestLat] = useState('');
  const [destLng, setDestLng] = useState('');
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // -----------------------------
  // 🔍 Geocode function (OSM)
  // -----------------------------
  const geocodeAddress = async (address) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'UniLift/1.0 (support@unilift.app)',
          Accept: 'application/json'
        }
      });
      
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        return {
          latitude: parseFloat(json[0].lat),
          longitude: parseFloat(json[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // -----------------------------
  // 📍 Use current location
  // -----------------------------
  const useCurrentLocationFor = async (field: 'source' | 'destination') => {
    setLocationLoading(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        const address = await getAddressFromCoordinates(
          location.latitude,
          location.longitude
        );
        
        if (field === 'source') {
          setSourceAddress(address);
          setSourceLat(location.latitude.toString());
          setSourceLng(location.longitude.toString());
        } else {
          setDestAddress(address);
          setDestLat(location.latitude.toString());
          setDestLng(location.longitude.toString());
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setLocationLoading(false);
    }
  };

  // -----------------------------
  // 🚗 Submit Ride
  // -----------------------------
  const handlePostRide = async () => {
    if (!sourceAddress || !destAddress || !date || !time || !seats) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Determine final coordinates
      let finalSourceCoords = null;
      let finalDestCoords = null;

      // Use existing coordinates if user used "📍" button
      if (sourceLat && sourceLng) {
        finalSourceCoords = {
          latitude: parseFloat(sourceLat),
          longitude: parseFloat(sourceLng),
        };
      } else {
        finalSourceCoords = await geocodeAddress(sourceAddress);
      }

      if (destLat && destLng) {
        finalDestCoords = {
          latitude: parseFloat(destLat),
          longitude: parseFloat(destLng),
        };
      } else {
        finalDestCoords = await geocodeAddress(destAddress);
      }

      // If geocoding fails
      if (!finalSourceCoords || !finalDestCoords) {
        Alert.alert(
          'Location Error',
          'Could not determine coordinates for one of the addresses. Try a clearer address or use 📍.'
        );
        setLoading(false);
        return;
      }

      const rideData = {
        source: {
          address: sourceAddress,
          coordinates: finalSourceCoords
        },
        destination: {
          address: destAddress,
          coordinates: finalDestCoords
        },
        date,
        time,
        totalSeats: parseInt(seats),
        pricePerSeat: parseInt(price) || 0,
        vehicleDetails: {
          model: vehicleModel,
          number: vehicleNumber,
          color: vehicleColor
        },
        notes
      };

      await createRide(rideData);
      Alert.alert('Success', 'Ride posted successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.mainTitle}>Post Your Ride</Text>
        
        <Text style={styles.sectionTitle}>📍 Route Details</Text>
        
        <Text style={styles.label}>Pickup Location *</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={styles.input}
            placeholder="e.g., MG Road, Bengaluru"
            value={sourceAddress}
            onChangeText={setSourceAddress}
          />
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={() => useCurrentLocationFor('source')}
            disabled={locationLoading}
          >
            <Text style={styles.locationBtnText}>📍</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Drop Location *</Text>
        <View style={styles.inputWithButton}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Electronic City, Bengaluru"
            value={destAddress}
            onChangeText={setDestAddress}
          />
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={() => useCurrentLocationFor('destination')}
            disabled={locationLoading}
          >
            <Text style={styles.locationBtnText}>📍</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>🕐 Schedule</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-01-20"
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Time *</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00 AM"
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>💺 Ride Details</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Available Seats *</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              value={seats}
              onChangeText={setSeats}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Price per Seat (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>🚗 Vehicle Details</Text>
        
        <Text style={styles.label}>Vehicle Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Maruti Swift, Honda City"
          value={vehicleModel}
          onChangeText={setVehicleModel}
        />

        <Text style={styles.label}>Vehicle Number</Text>
        <TextInput
          style={styles.input}
          placeholder="KA-01-AB-1234"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Vehicle Color</Text>
        <TextInput
          style={styles.input}
          placeholder="White, Black, Red, etc."
          value={vehicleColor}
          onChangeText={setVehicleColor}
        />

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special instructions or pickup points..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handlePostRide}
          disabled={loading || locationLoading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Ride</Text>
          )}
        </TouchableOpacity>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for a successful ride:</Text>
          <Text style={styles.tipText}>• Be punctual and communicate clearly</Text>
          <Text style={styles.tipText}>• Set a fair price based on distance</Text>
          <Text style={styles.tipText}>• Keep your vehicle clean and comfortable</Text>
          <Text style={styles.tipText}>• Follow traffic rules for everyone's safety</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBtn: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    width: 50,
    alignItems: 'center',
  },
  locationBtnText: {
    fontSize: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsContainer: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
