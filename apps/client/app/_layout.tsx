import React from 'react';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { FeedbackToastProvider } from '@/components/FeedbackToast';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FeedbackToastProvider>
          <Slot />
        </FeedbackToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
