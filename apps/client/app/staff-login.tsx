// import React, { useState } from 'react';
// import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
// import { Redirect, useRouter } from 'expo-router';
// import { colors } from '@/theme/colors';
// import { errorMessage } from '@/api/client';
// import { useAuth } from '@/context/AuthContext';
// import Button from '@/components/Button';
// import PasswordInput from '@/components/PasswordInput';
// import { useErrorToast } from '@/components/FeedbackToast';

// export default function StaffLogin() {
//   const { token, role, loading, staffLogin } = useAuth();
//   const router = useRouter();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [busy, setBusy] = useState(false);
//   useErrorToast(error, 'Sign in failed');

//   async function submit() {
//     setError('');
//     if (!email.trim() || !password) {
//       setError('Enter your email and password.');
//       return;
//     }
//     setBusy(true);
//     try {
//       await staffLogin(email.trim(), password);
//     } catch (e) {
//       setError(errorMessage(e));
//     } finally {
//       setBusy(false);
//     }
//   }

//   if (loading) return <View style={styles.page}><ActivityIndicator color={colors.primary} /></View>;
//   if (token) return <Redirect href={(role === 'super_admin' ? '/super-admin' : '/') as any} />;

//   return (
//     <View style={styles.page}>
//       <View style={styles.card}>
//         <View style={styles.logo}>
//           <Image
//             source={require('../assets/images/image.png')}
//             style={styles.logoImg}
//             resizeMode="contain"
//           />
//         </View>
//         <Text style={styles.title}>Staff Sign in</Text>
//         <Text style={styles.subtitle}>Login with your staff email and password</Text>
//         <View style={styles.field}>
//           <Text style={styles.label}>Email</Text>
//           <TextInput
//             style={styles.input}
//             value={email}
//             onChangeText={setEmail}
//             autoCapitalize="none"
//             autoCorrect={false}
//             keyboardType="email-address"
//             placeholder="staff@example.com"
//             placeholderTextColor={colors.muted}
//           />
//         </View>
//         <View style={styles.field}>
//           <Text style={styles.label}>Password</Text>
//           <PasswordInput
//             style={styles.input}
//             value={password}
//             onChangeText={setPassword}
//             onSubmitEditing={submit}
//           />
//         </View>
//         <Button title="Sign in" onPress={submit} loading={busy} />
//         <Pressable onPress={() => router.replace('/login' as any)} style={styles.switchLink}>
//           <Text style={styles.switchText}>Admin? Sign in here</Text>
//         </Pressable>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: '#F7F9FC', alignItems: 'center', justifyContent: 'center', padding: 20 },
//   card: { width: '100%', maxWidth: 380, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 24, gap: 14, backgroundColor: colors.white },
//   logo: { width: 56, height: 56, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
//   logoImg: { width: 56, height: 56 },
//   title: { fontSize: 22, fontWeight: '800', color: colors.text },
//   subtitle: { fontSize: 13, color: colors.muted, marginTop: -8 },
//   field: { gap: 6 },
//   label: { fontSize: 13, fontWeight: '700', color: colors.text },
//   input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.white },
//   error: { color: colors.danger, fontSize: 13 },
//   switchLink: { alignItems: 'center', paddingTop: 4 },
//   switchText: { color: colors.primaryText, fontSize: 13, fontWeight: '600' },
// });


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
import { Redirect, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';

/* ------------------------------------------------------------------
   Brand accent: uses your theme's `primary` if it exists, otherwise
   `primaryText`. Keep this identical to the Login screen.
------------------------------------------------------------------- */
const ACCENT: string = (colors as any).primary ?? colors.primaryText;

const INK = colors.text;
const MUTED = '#6B7280';
const PLACEHOLDER = '#9CA3AF';
const FIELD_BG = '#F4F6FA';

type FocusKey = 'email' | 'password' | null;

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

export default function StaffLogin() {
  const { token, staffLogin } = useAuth();
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState<FocusKey>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    try {
      await staffLogin(email.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (token) return <Redirect href={'/' as any} />;

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
                source={require('../assets/images/image.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Staff sign in</Text>
            <Text style={styles.subtitle}>Use your staff email and password to continue</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputWrap, focus === 'email' && styles.inputFocus]}>
                <Ionicons name="mail-outline" size={18} color={focus === 'email' ? ACCENT : MUTED} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="staff@example.com"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onFocus={() => setFocus('email')}
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

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Admin */}
            <Pressable
              onPress={() => router.replace('/login' as any)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.altBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={ACCENT} />
              <Text style={styles.altText}>Continue as admin</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>Trouble signing in? Contact your administrator.</Text>
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
  subtitle: { marginTop: 8, fontSize: 15, color: MUTED, textAlign: 'center' },

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

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.danger },

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

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 12, color: PLACEHOLDER },

  altBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  altText: { fontSize: 15, fontWeight: '700', color: ACCENT },

  footer: { marginTop: 22, fontSize: 12.5, color: PLACEHOLDER, textAlign: 'center' },
});