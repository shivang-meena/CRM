import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, Slot, usePathname } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';

export default function SuperAdminLayout() {
  const { token, role, loading } = useAuth();
  const pathname = usePathname();
  const onLogin = pathname === '/super-admin/login';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // A logged-in Admin or Staff can never see ANY super-admin page (not even the login page).
  if (token && role !== 'super_admin') return <Redirect href={'/' as any} />;

  if (onLogin) {
    if (token && role === 'super_admin') return <Redirect href={'/super-admin' as any} />;
    return <Slot />;
  }

  // Everything else under /super-admin needs the super admin session.
  if (!token) return <Redirect href={'/super-admin/login' as any} />;
  return <Slot />;
}
