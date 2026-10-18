import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

type Props = { value: number; size?: number; onChange?: (v: number) => void };

export default function Stars({ value, size = 16, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Ionicons name="star" size={size} color={n <= value ? colors.star : colors.starEmpty} />;
        return onChange ? (
          <Pressable key={n} hitSlop={6} onPress={() => onChange(n === value ? 0 : n)}>
            {icon}
          </Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}
