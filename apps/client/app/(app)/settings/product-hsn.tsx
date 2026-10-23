import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import ProductHsnScreen from '@/settings/ProductHsnScreen';

export default function ProductHsnRoute() {
  const { role } = useAuth();
  if (role !== 'admin') return <Redirect href="/" />;
  return <ProductHsnScreen />;
}
