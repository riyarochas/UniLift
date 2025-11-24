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
import { createRide } from '../services/api';

export default function PostRideScreen({ navigation }) {
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

  const handlePostRide = async () => {
    if (!sourceAddress || !destAddress || !date || !time || !seats) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        source: {
          address: sourceAddress,
          coordinates: {
            latitude: parseFloat(sourceLat) || 0,
            longitude: parseFloat(sourceLng) || 0
          }
        },
        destination: {
          address: destAddress,
          coordinates: {
            latitude: parseFloat(destLat) || 0,
            longitude: parseFloat(destLng) || 0
          }
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
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>📍 Route Details</Text>
        
        <Text style={styles.label}>Source Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pickup location"
          value={sourceAddress}
          onChangeText={setSourceAddress}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              value={sourceLat}
              onChangeText={setSourceLat}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              value={sourceLng}
              onChangeText={setSourceLng}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Destination Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter drop location"
          value={destAddress}
          onChangeText={setDestAddress}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Latitude</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              value={destLat}
              onChangeText={setDestLat}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Longitude</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              value={destLng}
              onChangeText={setDestLng}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>🕐 Schedule</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-01-15"
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
            <Text style={styles.label}>Total Seats *</Text>
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
        
        <Text style={styles.label}>Model</Text>
        <TextInput
          style={styles.input}
          placeholder="Honda City"
          value={vehicleModel}
          onChangeText={setVehicleModel}
        />

        <Text style={styles.label}>Number</Text>
        <TextInput
          style={styles.input}
          placeholder="KA-01-AB-1234"
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
        />

        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          placeholder="White"
          value={vehicleColor}
          onChangeText={setVehicleColor}
        />

        <Text style={styles.label}>Additional Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special instructions..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handlePostRide}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Post Ride</Text>
          )}
        </TouchableOpacity>
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
});