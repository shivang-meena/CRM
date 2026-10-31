import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useErrorToast } from '@/components/FeedbackToast';

/* ------------------------------------------------------------------
   Brand accent: keep this identical to Login and StaffLogin.
------------------------------------------------------------------- */
const ACCENT: string = (colors as any).primary ?? colors.primaryText;

const INK = colors.text;
const MUTED = '#6B7280';
const PLACEHOLDER = '#9CA3AF';
const FIELD_BG = '#F4F6FA';

type FocusKey = 'id' | 'password' | null;

/* Soft colored glow: real blur on web, stacked circles on native */
function Glow({ size, style, opacity = 0.22 }: { size: number; style?: ViewStyle; opacity?: number }) {
  if (Platform.OS === 'web') {
    return (
      <View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: ACCENT,
            opacity,
            filter: 'blur(80px)',
          } as any,
          style,
        ]}
      />
    );
  }
  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {[1, 0.8, 0.6, 0.4, 0.2].map((s) => (
        <View
          key={s}
          style={{
            position: 'absolute',
            width: size * s,
            height: size * s,
            borderRadius: (size * s) / 2,
            backgroundColor: ACCENT,
            opacity: opacity / 3.2,
          }}
        />
      ))}
    </View>
  );
}

export default function SuperAdminLogin() {
  const { superAdminLogin } = useAuth();
  const passwordRef = useRef<TextInput>(null);

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState<FocusKey>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useErrorToast(error, 'Sign in failed');

  async function submit() {
    setError('');
    if (!id.trim() || !password) {
      setError('Enter your ID and password.');
      return;
    }
    setBusy(true);
    try {
      await superAdminLogin(id.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.page}>
      {/* Background glow */}
      <Glow size={420} style={{ top: -170, left: -130 }} />
      <Glow size={340} style={{ bottom: -140, right: -110 }} opacity={0.16} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoTile}>
              <Image
                source={require('../../assets/images/image.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Super Admin</Text>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={ACCENT} />
              <Text style={styles.badgeText}>Restricted area</Text>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* ID */}
            <View style={styles.field}>
              <Text style={styles.label}>ID</Text>
              <View style={[styles.inputWrap, focus === 'id' && styles.inputFocus]}>
                <Ionicons name="person-outline" size={18} color={focus === 'id' ? ACCENT : MUTED} />
                <TextInput
                  style={styles.input}
                  value={id}
                  onChangeText={setId}
                  placeholder="Enter your ID"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  returnKeyType="next"
                  onFocus={() => setFocus('id')}
                  onBlur={() => setFocus(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrap, focus === 'password' && styles.inputFocus]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focus === 'password' ? ACCENT : MUTED}
                />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={PLACEHOLDER}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  returnKeyType="go"
                  onFocus={() => setFocus('password')}
                  onBlur={() => setFocus(null)}
                  onSubmitEditing={submit}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={MUTED}
                  />
                </Pressable>
              </View>
            </View>

            {/* Primary CTA */}
            <Pressable
              onPress={submit}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                busy && { opacity: 0.75 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryText}>Sign in</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
          </View>

          <Text style={styles.footer}>This area is for authorized users only.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white, overflow: 'hidden' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  /* Brand */
  brand: { alignItems: 'center', marginBottom: 26 },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  logoImg: { width: 48, height: 48 },
  title: { fontSize: 30, fontWeight: '800', color: INK, letterSpacing: -0.6 },
  badge: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    backgroundColor: colors.white,
  },
  badgeText: { fontSize: 13, fontWeight: '700', color: ACCENT },

  /* Card */
  card: {
    width: '100%',
    maxWidth: 410,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 26,
    gap: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: INK },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: FIELD_BG,
  },
  inputFocus: {
    backgroundColor: colors.white,
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: INK,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  footer: { marginTop: 22, fontSize: 12.5, color: PLACEHOLDER, textAlign: 'center' },
});