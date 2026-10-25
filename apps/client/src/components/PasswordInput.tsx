import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

type Props = Omit<TextInputProps, 'secureTextEntry'>;

export default function PasswordInput({ style, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Password"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        {...props}
        secureTextEntry={!visible}
        style={[style, styles.input]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        onPress={() => setVisible(current => !current)}
        style={styles.toggle}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={colors.muted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  input: { minHeight: 44, paddingRight: 48 },
  toggle: { position: 'absolute', right: 1, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
});
