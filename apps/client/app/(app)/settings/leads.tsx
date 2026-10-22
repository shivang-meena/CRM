import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import LeadSettingsScreen from '@/settings/LeadSettingsScreen';

export default function LeadSettingsRoute() {
  const { role } = useAuth();
  if (role !== 'admin') return <Redirect href="/" />;
  return <LeadSettingsScreen />;
}
