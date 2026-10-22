import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

const variants = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.white },
  outline: { bg: colors.white, border: colors.primary, text: colors.primaryText },
  danger: { bg: colors.white, border: colors.danger, text: colors.danger },
};

export default function Button({ title, onPress, variant = 'primary', disabled, loading }: Props) {
  const v = variants[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={[styles.btn, { backgroundColor: v.bg, borderColor: v.border }, off && { opacity: 0.6 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  text: { fontWeight: '700', fontSize: 14 },
});
