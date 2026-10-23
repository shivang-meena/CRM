// apps/client/app/(app)/invoice/add.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { InvoiceFormScreen } from '@/invoices/InvoiceFormScreen';
import { SalesDocumentType } from '@/types/salesDocuments';
import { useSalesDocument } from '@/hooks/useSalesDocuments';
import { colors } from '@/theme/colors';

export default function InvoiceAddRoute() {
  const params = useLocalSearchParams<{ type?: string; id?: string; cloneId?: string }>();
  const isClone = Boolean(params.cloneId);
  const targetId = params.id || params.cloneId;
  const initialType: SalesDocumentType =
    params.type === 'QUOTATION' ? 'QUOTATION' : 'INVOICE';

  const { data: existingDocument, isLoading } = useSalesDocument(targetId);

  if (targetId && isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.white,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <InvoiceFormScreen
      key={isClone ? `clone-${existingDocument?.id ?? 'doc'}` : existingDocument?.id ?? 'new-doc'}
      initialType={initialType}
      existingDocument={existingDocument}
      isClone={isClone}
    />
  );
}

