import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { getAllRides, searchRides } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchSource, setSearchSource] = useState('');
  const [searchDestination, setSearchDestination] = useState('');

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const response = await getAllRides();
      setRides(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load rides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchSource && !searchDestination) {
      fetchRides();
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (searchSource) params.sourceAddress = searchSource;
      if (searchDestination) params.destinationAddress = searchDestination;

      const response = await searchRides(params);
      setRides(response.data);
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const RideCard = ({ ride, navigation }) => {

  // 🔒 Prevent ALL crashes
  if (!ride) return null;

  const driver = ride.driver ?? {};
  const source = ride.source ?? {};
  const destination = ride.destination ?? {};

  return (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => navigation.navigate('RideDetail', { rideId: ride._id })}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.driverName}>{driver.name ?? "Unknown Driver"}</Text>

        <Text style={styles.rating}>
          ⭐ {driver.rating ? driver.rating.toFixed(1) : "0.0"}
        </Text>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeItem}>
          <Text style={styles.routeLabel}>From:</Text>
          <Text style={styles.routeText}>{source.address ?? "Unknown"}</Text>
        </View>

        <Text style={styles.arrow}>→</Text>

        <View style={styles.routeItem}>
          <Text style={styles.routeLabel}>To:</Text>
          <Text style={styles.routeText}>{destination.address ?? "Unknown"}</Text>
        </View>
      </View>

      <View style={styles.rideInfo}>
        <Text style={styles.infoText}>
          📅 {ride.date ? new Date(ride.date).toLocaleDateString() : "--"}
        </Text>

        <Text style={styles.infoText}>🕐 {ride.time ?? "--"}</Text>
        <Text style={styles.infoText}>💺 {ride.availableSeats ?? "?"} seats</Text>
        <Text style={styles.price}>₹{ride.pricePerSeat ?? "?"}/seat</Text>
      </View>

      <Text style={styles.college}>
        🎓 {driver.college ?? "Unknown College"}
      </Text>
    </TouchableOpacity>
  );
};



  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search from..."
          value={searchSource}
          onChangeText={setSearchSource}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search to..."
          value={searchDestination}
          onChangeText={setSearchDestination}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>🔍 Search</Text>
        </TouchableOpacity>
      </View>

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
            <Text style={styles.emptyText}>No rides available</Text>
            <Text style={styles.emptySubtext}>Pull down to refresh</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PostRide')}
      >
        <Text style={styles.fabText}>+ Post Ride</Text>
      </TouchableOpacity>
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
  searchContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  rating: {
    fontSize: 16,
    color: '#FF9800',
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
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  college: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2196F3',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});