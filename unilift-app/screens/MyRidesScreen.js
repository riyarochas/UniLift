import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { getMyPostedRides, cancelRide, deleteRide } from '../services/api';

export default function MyRidesScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyRides();
  }, []);

  const fetchMyRides = async () => {
    try {
      const response = await getMyPostedRides();
      setRides(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelRide = (rideId) => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRide(rideId);
              Alert.alert('Success', 'Ride cancelled');
              fetchMyRides();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel ride');
            }
          }
        }
      ]
    );
  };

  const handleDeleteRide = (rideId) => {
    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride permanently?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRide(rideId);
              Alert.alert('Success', 'Ride deleted');
              fetchMyRides();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ride');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyRides();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#f44336';
      default: return '#FF9800';
    }
  };

  const RideCard = ({ ride }) => (
    <View style={styles.rideCard}>
      <View style={styles.statusBadge}>
        <Text style={[styles.statusText, { color: getStatusColor(ride.status) }]}>
          {ride.status.toUpperCase()}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <Text style={styles.routeLabel}>From:</Text>
          <Text style={styles.routeText}>{ride.source.address}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.routeItem}>
          <Text style={styles.routeLabel}>To:</Text>
          <Text style={styles.routeText}>{ride.destination.address}</Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>
          📅 {new Date(ride.date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailText}>🕐 {ride.time}</Text>
      </View>

      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>
          💺 {ride.availableSeats}/{ride.totalSeats} available
        </Text>
        <Text style={styles.priceText}>₹{ride.pricePerSeat}/seat</Text>
      </View>

      {ride.vehicleDetails?.model && (
        <Text style={styles.vehicleInfo}>
          🚗 {ride.vehicleDetails.model} - {ride.vehicleDetails.number}
        </Text>
      )}

      {ride.notes && (
        <Text style={styles.notes}>📝 {ride.notes}</Text>
      )}

      {ride.status === 'active' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelRide(ride._id)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRide(ride._id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

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
        data={rides}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RideCard ride={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rides posted yet</Text>
            <Text style={styles.emptySubtext}>Post a ride to see it here</Text>
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
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
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
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
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
  cancelButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});