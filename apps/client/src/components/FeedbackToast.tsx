import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedbackToastPortal } from './FeedbackToastPortal';

type ToastType = 'error' | 'success';
type ToastMessage = { title: string; message: string; id: number; type: ToastType };
type FeedbackContextValue = {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);
let globalShowError: FeedbackContextValue['showError'] | null = null;
let globalShowSuccess: FeedbackContextValue['showSuccess'] | null = null;

export function notifyGlobalError(message: string, title = 'Request failed') {
  globalShowError?.(message, title);
}

export function notifyGlobalSuccess(message: string, title = 'Success') {
  globalShowSuccess?.(message, title);
}

export function FeedbackToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showError = useCallback((message: string, title = 'Could not complete action') => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    setToast({ title, message: cleanMessage, id: Date.now(), type: 'error' });
  }, []);

  const showSuccess = useCallback((message: string, title = 'Success') => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;
    setToast({ title, message: cleanMessage, id: Date.now(), type: 'success' });
  }, []);

  useEffect(() => {
    globalShowError = showError;
    globalShowSuccess = showSuccess;
    return () => {
      if (globalShowError === showError) globalShowError = null;
      if (globalShowSuccess === showSuccess) globalShowSuccess = null;
    };
  }, [showError, showSuccess]);

  useEffect(() => {
    if (!toast) return;
    const duration = toast.type === 'success' ? 4000 : 6500;
    const timeout = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timeout);
  }, [toast]);

  const isSuccess = toast?.type === 'success';

  return (
    <FeedbackContext.Provider value={{ showError, showSuccess }}>
      <View style={styles.root}>
        {children}
        {toast ? (
          <FeedbackToastPortal>
            <View pointerEvents="box-none" style={styles.toastLayer}>
              <View
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={[
                  styles.toast,
                  isSuccess ? styles.toastSuccess : styles.toastError,
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    isSuccess ? styles.iconBoxSuccess : styles.iconBoxError,
                  ]}
                >
                  <Ionicons
                    name={isSuccess ? 'checkmark-circle' : 'warning-outline'}
                    size={21}
                    color={isSuccess ? '#34D399' : '#FFC83D'}
                  />
                </View>
                <View style={styles.copy}>
                  <Text
                    style={[
                      styles.title,
                      isSuccess ? styles.titleSuccess : styles.titleError,
                    ]}
                  >
                    {toast.title}
                  </Text>
                  <Text style={styles.message}>{toast.message}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notification"
                  hitSlop={10}
                  style={styles.close}
                  onPress={() => setToast(null)}
                >
                  <Ionicons name="close" size={20} color="#D7D4CC" />
                </Pressable>
              </View>
            </View>
          </FeedbackToastPortal>
        ) : null}
      </View>
    </FeedbackContext.Provider>
  );
}

export function useFeedbackToast() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedbackToast must be used within FeedbackToastProvider');
  return context;
}

/** Show an error message in the shared toast whenever a form's error changes. */
export function useErrorToast(message: string | null | undefined, title = 'Please check the form') {
  const { showError } = useFeedbackToast();
  useEffect(() => {
    if (message) showError(message, title);
  }, [message, showError, title]);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toastLayer: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 16,
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
  },
  toast: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 540,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  toastError: { borderColor: '#44391B', backgroundColor: '#1C1A13' },
  toastSuccess: { borderColor: '#1D4B34', backgroundColor: '#0F241A' },
  iconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  iconBoxError: { backgroundColor: '#3B3013' },
  iconBoxSuccess: { backgroundColor: '#143826' },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '800' },
  titleError: { color: '#FFD04A' },
  titleSuccess: { color: '#34D399' },
  message: { color: '#F2F0EA', fontSize: 13, fontWeight: '600' },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#34332F' },
});
