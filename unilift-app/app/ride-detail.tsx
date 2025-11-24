import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
  RefreshControl
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getRideById, createBooking, getBookingsForRide, confirmBooking, rejectBooking, completeRide } from '../services/api';
import { AuthContext } from '../utils/AuthContext';

export default function RideDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rideId = params.id as string;
  const { user } = useContext(AuthContext);

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seatsToBook, setSeatsToBook] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRideDetails();
  }, []);

  const fetchRideDetails = async () => {
    try {
      const response = await getRideById(rideId);
      setRide(response.data);
      setPickupAddress(response.data.source.address);
      
      // If it's the driver's own ride, fetch bookings
      if (response.data.driver._id === user._id) {
        fetchBookings();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load ride details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await getBookingsForRide(rideId);
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRideDetails();
    setRefreshing(false);
  };

  const handleConfirmBooking = async (bookingId: string) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await confirmBooking(bookingId);
              Alert.alert('Success', 'Booking confirmed!');
              fetchRideDetails(); // Refresh to update available seats
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to confirm booking');
            }
          }
        }
      ]
    );
  };

  const handleRejectBooking = async (bookingId: string) => {
    Alert.alert(
      'Reject Booking',
      'Are you sure you want to reject this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectBooking(bookingId);
              Alert.alert('Success', 'Booking rejected');
              fetchRideDetails(); // Refresh to update available seats
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject booking');
            }
          }
        }
      ]
    );
  };

  const handleCallPassenger = (phone: string, name: string) => {
    Alert.alert(
      'Call Passenger',
      `Call ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phone}`)
        }
      ]
    );
  };

  const handleWhatsAppPassenger = async (phone: string, name: string, bookingDetails: any) => {
    const message = `Hi ${name}! This is regarding your booking for the ride from ${ride.source.address} to ${ride.destination.address} on ${new Date(ride.date).toLocaleDateString()}. Your booking has been confirmed!`;

    const url = `whatsapp://send?phone=+91${phone}&text=${encodeURIComponent(message)}`;

    const supported = await Linking.canOpenURL("whatsapp://send");
    if (!supported) {
      Alert.alert("WhatsApp not installed");
      return;
    }

    Linking.openURL(url);
  };

  const handleTrackPassenger = (bookingId: string) => {
    router.push(`/track-rider?bookingId=${bookingId}`);
  };

  const handleBookRide = async () => {
    const seats = parseInt(seatsToBook) || 0;

    if (seats < 1) {
      Alert.alert('Error', 'Please enter valid number of seats');
      return;
    }

    if (seats > ride.availableSeats) {
      Alert.alert('Error', `Only ${ride.availableSeats} seats available`);
      return;
    }

    setBooking(true);
    try {
      const bookingData = {
        rideId: ride._id,
        seatsBooked: seats,
        pickupPoint: {
          address: pickupAddress,
          coordinates: ride.source.coordinates
        }
      };

      const response = await createBooking(bookingData);

      Alert.alert(
        'Success!',
        '🎉 Ride booked successfully!\n\nDriver will contact you soon.',
        [
          {
            text: 'Track Driver',
            onPress: () =>
              router.push(
                `/track-driver?bookingId=${response.data._id}&rideId=${ride._id}`
              )
          },
          { text: 'View Bookings', onPress: () => router.push('/my-bookings') },
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleCompleteRide = async () => {
    Alert.alert(
      'Complete Ride',
      'Mark this ride as completed? All passengers will be asked to rate you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            try {
              await completeRide(rideId);
              Alert.alert(
                'Ride Completed!',
                'The ride has been marked as completed. You can now rate your passengers.',
                [{ text: 'OK', onPress: () => fetchRideDetails() }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to complete ride');
            }
          }
        }
      ]
    );
  };

  const handleCallDriver = () => {
    Alert.alert(
      'Call Driver',
      `Call ${ride.driver.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${ride.driver.phone}`)
        }
      ]
    );
  };

  const handleWhatsApp = async () => {
    const message = `Hi! I found your ride from ${ride.source.address} to ${ride.destination.address} on UniLift. Is it still available?`;

    const url = `whatsapp://send?phone=+91${ride.driver.phone}&text=${encodeURIComponent(message)}`;

    const supported = await Linking.canOpenURL("whatsapp://send");
    if (!supported) {
      Alert.alert("WhatsApp not installed");
      return;
    }

    Linking.openURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#f44336';
      case 'completed': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ride not found</Text>
      </View>
    );
  }

  const isOwnRide = ride.driver._id === user._id;
  const seats = parseInt(seatsToBook) || 0;
  const totalPrice = seats * ride.pricePerSeat;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Driver Section */}
      <View style={styles.header}>
        <View style={styles.driverSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {ride.driver.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{ride.driver.name}</Text>
            <Text style={styles.rating}>
              ⭐ {ride.driver.rating ? ride.driver.rating.toFixed(1) : 'N/A'} (
              {ride.driver.totalRatings || 0} ratings)
            </Text>
            <Text style={styles.college}>🎓 {ride.driver.college}</Text>
          </View>
        </View>

        {!isOwnRide && (
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCallDriver}>
              <Text style={styles.contactButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactButton, styles.whatsappButton]}
              onPress={handleWhatsApp}
            >
              <Text style={styles.contactButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Route Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Route</Text>
        <View style={styles.routeBox}>
          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: '#4CAF50' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeText}>{ride.source.address}</Text>
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeItem}>
            <View style={[styles.routeDot, { backgroundColor: '#f44336' }]} />
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>Drop</Text>
              <Text style={styles.routeText}>{ride.destination.address}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Schedule Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕐 Schedule</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(ride.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{ride.time}</Text>
          </View>
        </View>
      </View>

      {/* Ride Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💺 Ride Details</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💺</Text>
            <Text style={styles.infoLabel}>Available</Text>
            <Text style={styles.infoValue}>
              {ride.availableSeats}/{ride.totalSeats}
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💰</Text>
            <Text style={styles.infoLabel}>Price/Seat</Text>
            <Text style={[styles.infoValue, styles.priceValue]}>
              ₹{ride.pricePerSeat}
            </Text>
          </View>
        </View>
      </View>

      {/* Vehicle Section */}
      {ride.vehicleDetails?.model && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Vehicle</Text>
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleText}>🚙 {ride.vehicleDetails.model}</Text>
            <Text style={styles.vehicleText}>🔢 {ride.vehicleDetails.number}</Text>
            <Text style={styles.vehicleText}>🎨 {ride.vehicleDetails.color}</Text>
          </View>
        </View>
      )}

      {/* Notes */}
      {ride.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Additional Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{ride.notes}</Text>
          </View>
        </View>
      )}

      {/* BOOKINGS SECTION - FOR DRIVER ONLY */}
      {isOwnRide && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Bookings ({bookings.length})</Text>
          
          {loadingBookings ? (
            <ActivityIndicator size="small" color="#2196F3" />
          ) : bookings.length === 0 ? (
            <View style={styles.emptyBookings}>
              <Text style={styles.emptyBookingsText}>No bookings yet</Text>
            </View>
          ) : (
            bookings.map((booking) => {
              // Use rider instead of passenger (backend uses 'rider' field)
              const passenger = booking.rider || booking.passenger;
              
              if (!passenger) return null; // Skip if no passenger data
              
              return (
              <View key={booking._id} style={styles.bookingCard}>
                {/* Passenger Info */}
                <View style={styles.bookingHeader}>
                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerAvatar}>
                      <Text style={styles.passengerAvatarText}>
                        {passenger.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.passengerDetails}>
                      <Text style={styles.passengerName}>{passenger.name}</Text>
                      <Text style={styles.passengerCollege}>🎓 {passenger.college}</Text>
                      <Text style={styles.passengerPhone}>📞 {passenger.phone}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Text style={styles.statusText}>
                      {getStatusEmoji(booking.status)} {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Booking Details */}
                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>💺 Seats:</Text>
                    <Text style={styles.bookingDetailValue}>{booking.seatsBooked}</Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>📍 Pickup:</Text>
                    <Text style={styles.bookingDetailValue}>{booking.pickupPoint?.address || 'N/A'}</Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>💰 Amount:</Text>
                    <Text style={[styles.bookingDetailValue, styles.priceValue]}>
                      ₹{booking.totalPrice || (booking.seatsBooked * ride.pricePerSeat)}
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Text style={styles.bookingDetailLabel}>📅 Booked:</Text>
                    <Text style={styles.bookingDetailValue}>
                      {new Date(booking.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.bookingActions}>
                  {booking.status === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => handleConfirmBooking(booking._id)}
                      >
                        <Text style={styles.actionButtonText}>✅ Confirm</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRejectBooking(booking._id)}
                      >
                        <Text style={styles.actionButtonText}>❌ Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {booking.status === 'confirmed' && !booking.readyForRating && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.callButton]}
                        onPress={() => handleCallPassenger(passenger.phone, passenger.name)}
                      >
                        <Text style={styles.actionButtonText}>📞 Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.whatsappActionButton]}
                        onPress={() => handleWhatsAppPassenger(
                          passenger.phone, 
                          passenger.name,
                          booking
                        )}
                      >
                        <Text style={styles.actionButtonText}>💬 WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.trackButton]}
                        onPress={() => handleTrackPassenger(booking._id)}
                      >
                        <Text style={styles.actionButtonText}>📍 Track</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Rate Passenger Button - Shows after ride is completed */}
                  {booking.readyForRating && !booking.passengerRating && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rateButton]}
                      onPress={() => router.push(`/rate-passenger?bookingId=${booking._id}`)}
                    >
                      <Text style={styles.actionButtonText}>⭐ Rate Passenger</Text>
                    </TouchableOpacity>
                  )}

                  {/* Already Rated */}
                  {booking.passengerRating && (
                    <View style={styles.ratedContainer}>
                      <Text style={styles.ratedText}>
                        ✅ You rated this passenger: {booking.passengerRating} ⭐
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
            })
          )}
        </View>
      )}

      {/* Booking Section - FOR PASSENGERS */}
      {!isOwnRide && ride.status === 'active' && ride.availableSeats > 0 && (
        <View style={styles.bookingSection}>
          <Text style={styles.bookingTitle}>📝 Book This Ride</Text>

          <Text style={styles.label}>Number of Seats</Text>
          <View style={styles.seatsSelector}>
            <TouchableOpacity
              style={styles.seatButton}
              onPress={() =>
                setSeatsToBook(Math.max(1, seats - 1).toString())
              }
            >
              <Text style={styles.seatButtonText}>−</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.seatsInput}
              value={seatsToBook}
              onChangeText={setSeatsToBook}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={styles.seatButton}
              onPress={() =>
                setSeatsToBook(
                  Math.min(ride.availableSeats, seats + 1).toString()
                )
              }
            >
              <Text style={styles.seatButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Pickup Location</Text>
          <TextInput
            style={styles.input}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="Enter your pickup location"
            multiline
          />

          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalPrice}>₹{totalPrice}</Text>
          </View>

          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookRide}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>🎫 Book Now - ₹{totalPrice}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Own Ride Notice */}
      {isOwnRide && (
        <View style={styles.ownRideNotice}>
          <Text style={styles.ownRideIcon}>ℹ️</Text>
          <Text style={styles.ownRideText}>This is your own ride</Text>
          
          {/* Complete Ride Button */}
          {ride.status === 'active' && bookings.some(b => b.status === 'confirmed') && (
            <TouchableOpacity
              style={styles.completeRideButton}
              onPress={handleCompleteRide}
            >
              <Text style={styles.completeRideButtonText}>✅ Mark Ride as Completed</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Inactive Ride Notice */}
      {ride.status !== 'active' && (
        <View style={styles.inactiveNotice}>
          <Text style={styles.inactiveText}>This ride is {ride.status}</Text>
        </View>
      )}

      {/* No Seats Notice */}
      {ride.availableSeats === 0 && ride.status === 'active' && !isOwnRide && (
        <View style={styles.inactiveNotice}>
          <Text style={styles.inactiveText}>❌ No seats available</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 18,
    color: '#666'
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  driverInfo: {
    flex: 1
  },
  driverName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  rating: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 3
  },
  college: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  whatsappButton: {
    backgroundColor: '#25D366'
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3'
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
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
    marginBottom: 12
  },
  routeBox: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  routeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 5,
    marginRight: 12
  },
  routeContent: {
    flex: 1
  },
  routeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  routeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: '#ddd',
    marginLeft: 7,
    marginVertical: 5
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  priceValue: {
    color: '#4CAF50'
  },
  vehicleCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8
  },
  vehicleText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8
  },
  notesBox: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 8
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24
  },
  // NEW BOOKING STYLES
  emptyBookings: {
    padding: 30,
    alignItems: 'center'
  },
  emptyBookingsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic'
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  passengerInfo: {
    flexDirection: 'row',
    flex: 1
  },
  passengerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  passengerAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  passengerDetails: {
    flex: 1
  },
  passengerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  passengerCollege: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2
  },
  passengerPhone: {
    fontSize: 14,
    color: '#666'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  bookingDetails: {
    marginBottom: 15
  },
  bookingDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  bookingDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  bookingDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10
  },
  bookingActions: {
    gap: 10
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#f44336'
  },
  callButton: {
    backgroundColor: '#2196F3'
  },
  whatsappActionButton: {
    backgroundColor: '#25D366'
  },
  trackButton: {
    backgroundColor: '#FF9800'
  },
  rateButton: {
    backgroundColor: '#FFD700'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  ratedContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  ratedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600'
  },
  bookingSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10
  },
  seatsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  seatButton: {
    width: 50,
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  seatButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold'
  },
  seatsInput: {
    flex: 1,
    height: 50,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    marginHorizontal: 15,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center'
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  ownRideNotice: {
    backgroundColor: '#FFF9E6',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  ownRideIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  ownRideText: {
    fontSize: 16,
    color: '#F57C00',
    fontWeight: '600'
  },
  completeRideButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center'
  },
  completeRideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  inactiveNotice: {
    backgroundColor: '#FFEBEE',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  inactiveText: {
    fontSize: 16,
    color: '#C62828',
    fontWeight: '600'
  }
});