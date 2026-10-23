import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WebSettingsTabs({
  active,
}: {
  active: 'general' | 'invoice';
}) {
  const heading = active === 'general' ? 'Company Settings' : 'Invoice Settings';
  const icon: keyof typeof Ionicons.glyphMap = active === 'general' ? 'settings-outline' : 'document-text-outline';

  return (
    <View style={styles.tabs}>
      <Ionicons name={icon} size={17} color="#1D5FD6" />
      <Text accessibilityRole="header" style={styles.text}>{heading}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    minHeight: 58,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEDF3',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: { fontSize: 13, color: '#514059', fontWeight: '600' },
});
