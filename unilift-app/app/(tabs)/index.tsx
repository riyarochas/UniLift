import React, { useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { AuthContext } from '../../utils/AuthContext';

export default function TabIndex() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Redirect href="/login" />;
  }

  // If logged in, redirect to home (rides list)
  return <Redirect href="/home" />;
}