import React from 'react';
import { ActivityIndicator, View, useWindowDimensions } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import AppNavbar from '@/components/AppNavbar';

export default function AppLayout() {
  const { token, loading } = useAuth();
  const { width } = useWindowDimensions();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!token) return <Redirect href={'/login' as any} />;

  const wide = width >= 768;
  return (
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.white }}>
      <Sidebar horizontal={!wide} />
      <View style={{ flex: 1 }}>
        <AppNavbar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}
