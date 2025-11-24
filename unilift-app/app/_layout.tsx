import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../utils/AuthContext';
import 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ title: 'Verify Email' }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="post-ride" options={{ title: 'Post a Ride' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="my-rides" options={{ title: 'My Posted Rides' }} />
        <Stack.Screen name="my-bookings" options={{ title: 'My Bookings' }} />
        <Stack.Screen name="ride-detail" options={{ title: 'Ride Details' }} />
        <Stack.Screen name="find-ride-map" options={{ title: 'Find Rides on Map' }} />
        <Stack.Screen name="track-driver" options={{ title: 'Track Driver' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}