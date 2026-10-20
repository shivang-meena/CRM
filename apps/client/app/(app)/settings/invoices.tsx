import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import GstInvoiceSettingsScreen from '@/settings/GstInvoiceSettingsScreen';

export default function InvoiceSettingsRoute() {
  const { role } = useAuth();
  if (role !== 'admin') return <Redirect href="/" />;
  return <GstInvoiceSettingsScreen />;
}
