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
import { getBookingById, ratePassenger } from '../services/api';

export default function RatePassengerScreen() {
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
      await ratePassenger(bookingId, { rating, feedback });
      
      Alert.alert(
        'Success!',
        'Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/my-rides')
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

  const passenger = booking.rider || booking.passenger;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>⭐</Text>
          <Text style={styles.headerTitle}>Rate Passenger</Text>
          <Text style={styles.headerSubtitle}>How was your experience?</Text>
        </View>

        {/* Passenger Info */}
        <View style={styles.passengerCard}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.avatarText}>
              {passenger?.name?.charAt(0).toUpperCase() || 'P'}
            </Text>
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{passenger?.name || 'Passenger'}</Text>
            <Text style={styles.passengerCollege}>🎓 {passenger?.college || 'N/A'}</Text>
            <Text style={styles.seatsInfo}>
              💺 {booking.seatsBooked} seat{booking.seatsBooked > 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Ride Details */}
        <View style={styles.rideDetails}>
          <View style={styles.routeItem}>
            <Text style={styles.routeIcon}>📍</Text>
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddress}>{booking.pickupPoint?.address}</Text>
            </View>
          </View>
          <View style={styles.routeItem}>
            <Text style={styles.routeIcon}>🎯</Text>
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>Destination</Text>
              <Text style={styles.routeAddress}>{booking.ride?.destination?.address}</Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>
              ₹{booking.totalPrice || (booking.seatsBooked * (booking.ride?.pricePerSeat || 0))}
            </Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Rate the Passenger</Text>
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
            placeholder="Tell us about the passenger..."
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
          onPress={() => router.replace('/my-rides')}
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
  passengerCard: {
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
  passengerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff'
  },
  passengerInfo: {
    flex: 1
  },
  passengerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  passengerCollege: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3
  },
  seatsInfo: {
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
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  amountLabel: {
    fontSize: 16,
    color: '#666'
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50'
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