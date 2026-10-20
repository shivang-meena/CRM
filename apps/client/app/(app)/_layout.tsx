import React from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import AppNavbar from '@/components/AppNavbar';
import Button from '@/components/Button';

export default function AppLayout() {
  const { token, role, permissions, loading } = useAuth();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!token) return <Redirect href={'/login' as any} />;

  const isUnauthorized = () => {
    if (role !== 'staff') return false;
    if (pathname.startsWith('/lead') && !permissions?.lead) return true;
    if (pathname.startsWith('/tasks') && !permissions?.task) return true;
    if (pathname.startsWith('/reminders') && !permissions?.reminder) return true;
    if (pathname.startsWith('/meetings') && !permissions?.meeting) return true;
    if (pathname.startsWith('/notes') && !permissions?.note) return true;
    if (pathname.startsWith('/calendar') && !permissions?.calendar) return true;
    if (pathname.startsWith('/customer') && !permissions?.customer) return true;
    if (pathname.startsWith('/invoice') && !permissions?.invoice) return true;
    if (pathname.startsWith('/staff') && !permissions?.staff) return true;
    if (pathname.startsWith('/leave') && !permissions?.leave) return true;
    return false;
  };

  const wide = width >= 768;
  const blocked = isUnauthorized();

  return (
    <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.white }}>
      <Sidebar horizontal={!wide} />
      <View style={{ flex: 1 }}>
        <AppNavbar />
        <View style={{ flex: 1 }}>
          {blocked ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
              <Ionicons name="lock-closed-outline" size={48} color={colors.danger} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Access Denied</Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', maxWidth: 360 }}>
                You do not have permission to access this module. Please contact your administrator.
              </Text>
              <Button title="Go to Dashboard" onPress={() => router.replace('/')} />
            </View>
          ) : (
            <Slot />
          )}
        </View>
      </View>
    </View>
  );
}
