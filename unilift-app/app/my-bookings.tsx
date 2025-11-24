import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMyBookings, cancelBooking } from '../services/api';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await getMyBookings();
      setBookings(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelBooking(bookingId);
              Alert.alert('Success', 'Booking cancelled');
              fetchBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handleCallDriver = (phone: string, name: string) => {
    Alert.alert(
      'Call Driver',
      `Call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  const BookingCard = ({ booking }: any) => {
    const isCompleted = booking.status === 'completed' || booking.readyForRating;
    const hasRated = booking.driverRating;

    return (
      <View style={styles.bookingCard}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(booking.status)} {booking.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.driverSection}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>
              {booking.ride.driver.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{booking.ride.driver.name}</Text>
            <Text style={styles.rating}>
              ⭐ {booking.ride.driver.rating ? booking.ride.driver.rating.toFixed(1) : 'N/A'}
            </Text>
            <Text style={styles.college}>🎓 {booking.ride.driver.college}</Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <Text style={styles.routeLabel}>From:</Text>
          <Text style={styles.routeText}>{booking.ride.source.address}</Text>
        </View>

        <View style={styles.routeContainer}>
          <Text style={styles.routeLabel}>To:</Text>
          <Text style={styles.routeText}>{booking.ride.destination.address}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            📅 {new Date(booking.ride.date).toLocaleDateString('en-IN')}
          </Text>
          <Text style={styles.detailText}>🕐 {booking.ride.time}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>💺 {booking.seatsBooked} seats booked</Text>
          <Text style={styles.priceText}>
            ₹{(booking.totalPrice || (booking.ride.pricePerSeat * booking.seatsBooked))}
          </Text>
        </View>

        <Text style={styles.driverPhone}>📱 {booking.ride.driver.phone}</Text>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {/* Pending Booking */}
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCallDriver(booking.ride.driver.phone, booking.ride.driver.name)}
              >
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelBooking(booking._id)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Confirmed Booking */}
          {booking.status === 'confirmed' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.trackButton]}
                onPress={() => router.push(`/track-driver?bookingId=${booking._id}&rideId=${booking.ride._id}`)}
              >
                <Text style={styles.actionButtonText}>🗺️ Track</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCallDriver(booking.ride.driver.phone, booking.ride.driver.name)}
              >
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelBooking(booking._id)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Completed - Ready to Rate */}
          {isCompleted && !hasRated && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rateButton]}
              onPress={() => router.push(`/rate-ride?bookingId=${booking._id}`)}
            >
              <Text style={styles.actionButtonText}>⭐ Rate Driver</Text>
            </TouchableOpacity>
          )}

          {/* Already Rated */}
          {hasRated && (
            <View style={styles.ratedContainer}>
              <Text style={styles.ratedText}>
                ✅ You rated: {booking.driverRating} ⭐
              </Text>
              {booking.driverFeedback && (
                <Text style={styles.feedback}>"{booking.driverFeedback}"</Text>
              )}
            </View>
          )}
        </View>

        {/* Ride Status Message */}
        {booking.status === 'pending' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>⏳ Waiting for driver to confirm</Text>
          </View>
        )}
        
        {isCompleted && !hasRated && (
          <View style={[styles.infoBox, styles.completedBox]}>
            <Text style={styles.completedText}>🎉 Ride completed! Please rate your driver</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <BookingCard booking={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>Book a ride to see it here</Text>
            <TouchableOpacity
              style={styles.findRideButton}
              onPress={() => router.push('/home')}
            >
              <Text style={styles.findRideButtonText}>🔍 Find a Ride</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  bookingCard: {
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
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  rating: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 2,
  },
  college: {
    fontSize: 12,
    color: '#666',
  },
  routeContainer: {
    marginBottom: 8,
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  driverPhone: {
    fontSize: 14,
    color: '#2196F3',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  trackButton: {
    backgroundColor: '#2196F3',
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  rateButton: {
    backgroundColor: '#FFD700',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ratedContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  feedback: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  completedBox: {
    backgroundColor: '#E3F2FD',
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 13,
    color: '#F57C00',
    textAlign: 'center',
  },
  completedText: {
    fontSize: 13,
    color: '#1976D2',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
  },
  findRideButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  findRideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});