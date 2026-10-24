import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

export type MobileRecordLayout = 'cards' | 'table';

export const MOBILE_RECORD_LAYOUTS: Record<string, MobileRecordLayout> = {
  leadView: 'cards',
  notes: 'cards',
  meetings: 'cards',
  reminders: 'cards',
  customers: 'cards',
  staff: 'cards',
  leave: 'cards',
  invoices: 'cards',
  quotations: 'cards',
  paymentMethods: 'cards',
  brochures: 'cards',
};

export function useResponsiveLayout() {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    setWidth(current => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);
  return { width, onLayout, ready: width > 0 };
}
