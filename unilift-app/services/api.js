import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.150.23.93:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const register = (userData) => api.post('/auth/register', userData);
export const login = (credentials) => api.post('/auth/login', credentials);
export const getProfile = () => api.get('/auth/me');
// api.js (append near other exports)
export const matchRides = (params) => api.get('/rides/match', { params });


// Ride APIs
export const createRide = (rideData) => api.post('/rides', rideData);
export const getAllRides = () => api.get('/rides');
export const searchRides = (params) => api.get('/rides/search', { params });
export const getMyPostedRides = () => api.get('/rides/my-rides');
export const getRideById = (id) => api.get(`/rides/${id}`);
export const updateRide = (id, data) => api.put(`/rides/${id}`, data);
export const cancelRide = (id) => api.put(`/rides/${id}/cancel`);
export const deleteRide = (id) => api.delete(`/rides/${id}`);
export const completeRide = (id) => api.put(`/rides/${id}/complete`);

// Booking APIs
export const createBooking = (bookingData) => api.post('/bookings', bookingData);
export const getMyBookings = () => api.get('/bookings/my-bookings');
export const getBookingsForMyRides = () => api.get('/bookings/my-rides-bookings');
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const cancelBooking = (id) => api.put(`/bookings/${id}/cancel`);
export const rateBooking = (id, data) => api.put(`/bookings/${id}/rate`, data);

// NEW: Get bookings for a specific ride (for drivers to see who booked their ride)
export const getBookingsForRide = (rideId) => api.get(`/bookings/ride/${rideId}`);

// NEW: Confirm a booking (driver confirms passenger)
export const confirmBooking = (bookingId) => api.put(`/bookings/${bookingId}/confirm`);

// NEW: Reject a booking (driver rejects passenger)
export const rejectBooking = (bookingId) => api.put(`/bookings/${bookingId}/reject`);

// NEW: Rate passenger (driver rates passenger)
export const ratePassenger = (bookingId, data) => api.put(`/bookings/${bookingId}/rate-passenger`, data);

export const sendVerificationEmail = () => api.post('/auth/send-verification');
export const verifyEmail = (code) => api.post('/auth/verify-email', { code });

export default api;