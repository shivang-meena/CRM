import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type Props = { label: string; value: boolean; onChange: (next: boolean) => void; disabled?: boolean };

export function FeatureSwitch({ label, value, onChange, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={[styles.row, disabled && { opacity: 0.6 }]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.white, minWidth: 200, flexGrow: 1, flexBasis: 200 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  track: { width: 42, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  trackOn: { backgroundColor: colors.success },
  trackOff: { backgroundColor: colors.border },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  thumbOn: { alignSelf: 'flex-end' },
  thumbOff: { alignSelf: 'flex-start' },
});
