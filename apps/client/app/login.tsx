import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { errorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';
import { useErrorToast } from '@/components/FeedbackToast';

export default function Login() {
  const { token, role, loading, login } = useAuth();
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useErrorToast(error, 'Sign in failed');


  async function submit() {
    setError('');
    if (!id.trim() || !password) {
      setError('Enter your User ID and password.');
      return;
    }
    setBusy(true);
    try {
      await login(id.trim(), password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <View style={styles.page}><ActivityIndicator color={colors.primary} /></View>;
  if (token) return <Redirect href={(role === 'super_admin' ? '/super-admin' : '/') as any} />;

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <View style={styles.logo}>
          <Image
            source={require('../assets/images/image.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Sign in</Text>
        <View style={styles.field}>
          <Text style={styles.label}>User ID</Text>
          <TextInput style={styles.input} value={id} onChangeText={setId} autoCapitalize="none" autoCorrect={false} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <PasswordInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
        </View>
        <Button title="Sign in" onPress={submit} loading={busy} />
        <Pressable onPress={() => router.replace('/staff-login' as any)} style={styles.switchLink}>
          <Text style={styles.switchText}>Staff? Sign in here</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9FC', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 24, gap: 14, backgroundColor: colors.white },
  logo: { width: 56, height: 56, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: 56, height: 56 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.white },
  error: { color: colors.danger, fontSize: 13 },
  switchLink: { alignItems: 'center', paddingTop: 4 },
  switchText: { color: colors.primaryText, fontSize: 13, fontWeight: '600' },
});
