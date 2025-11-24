import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getBookingById, rateBooking } from '../services/api';

export default function RateRideScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, []);

  const fetchBookingDetails = async () => {
    try {
      const response = await getBookingById(bookingId);
      setBooking(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Required', 'Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await rateBooking(bookingId, { rating, feedback });
      
      Alert.alert(
        'Success!',
        'Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/my-bookings')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    );
  }

  const driver = booking.ride?.driver;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>⭐</Text>
          <Text style={styles.headerTitle}>Rate Your Ride</Text>
          <Text style={styles.headerSubtitle}>How was your experience?</Text>
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.avatarText}>
              {driver?.name?.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
            <Text style={styles.driverCollege}>🎓 {driver?.college || 'N/A'}</Text>
            <Text style={styles.vehicleInfo}>
              🚗 {booking.ride?.vehicleDetails?.model || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Ride Details */}
        <View style={styles.rideDetails}>
          <View style={styles.routeItem}>
            <Text style={styles.routeIcon}>📍</Text>
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeAddress}>{booking.pickupPoint?.address}</Text>
            </View>
          </View>
          <View style={styles.routeItem}>
            <Text style={styles.routeIcon}>🎯</Text>
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeAddress}>{booking.ride?.destination?.address}</Text>
            </View>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Rate the Driver</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={[
                  styles.star,
                  star <= rating && styles.starActive
                ]}>
                  {star <= rating ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 && 'Tap to rate'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Below Average'}
            {rating === 3 && 'Average'}
            {rating === 4 && 'Good'}
            {rating === 5 && 'Excellent'}
          </Text>
        </View>

        {/* Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>Share Your Experience (Optional)</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Tell us about your ride..."
            multiline
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{feedback.length}/500</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmitRating}
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.replace('/my-bookings')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 18,
    color: '#666'
  },
  content: {
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20
  },
  headerEmoji: {
    fontSize: 60,
    marginBottom: 15
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666'
  },
  driverCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  driverAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  driverInfo: {
    flex: 1
  },
  driverName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  driverCollege: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666'
  },
  rideDetails: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15
  },
  routeIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2
  },
  routeText: {
    flex: 1
  },
  routeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  routeAddress: {
    fontSize: 16,
    color: '#333'
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15
  },
  starButton: {
    padding: 5
  },
  star: {
    fontSize: 50,
    color: '#ddd'
  },
  starActive: {
    color: '#FFD700'
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600'
  },
  feedbackSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f9f9f9'
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: '#999'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc'
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  skipButton: {
    padding: 15,
    alignItems: 'center'
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16
  }
});