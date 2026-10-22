import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WebSettingsTabs({
  active,
}: {
  active: 'general' | 'invoice';
}) {
  const router = useRouter();
  return (
    <View style={styles.tabs}>
      {(
        [
          {
            key: 'general',
            label: 'General Settings',
            icon: 'settings-outline',
            path: '/settings/web',
          },
          {
            key: 'invoice',
            label: 'Invoice Settings',
            icon: 'document-text-outline',
            path: '/settings/invoices',
          },
        ] as const
      ).map((tab) => (
        <Pressable
          key={tab.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === tab.key }}
          onPress={() => {
            if (active !== tab.key) router.replace(tab.path as Href);
          }}
          style={[styles.tab, active === tab.key && styles.active]}
        >
          <Ionicons
            name={tab.icon}
            size={17}
            color={active === tab.key ? '#1D5FD6' : '#69616E'}
          />
          <Text style={styles.text}>{tab.label}</Text>
        </Pressable>
      ))}
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
    flexWrap: 'wrap',
    gap: 22,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 5,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  active: { borderBottomColor: '#1D5FD6' },
  text: { fontSize: 13, color: '#514059', fontWeight: '600' },
});
