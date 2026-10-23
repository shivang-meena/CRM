import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import ServiceHsnScreen from '@/settings/ServiceHsnScreen';

export default function ServiceHsnRoute() {
  const { role } = useAuth();
  if (role !== 'admin') return <Redirect href="/" />;
  return <ServiceHsnScreen />;
}
