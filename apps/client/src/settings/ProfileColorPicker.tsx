import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { FieldLabel, fieldStyles } from "./ProfileFields";

export type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};
export const COLOR_PRESETS = [
  "#1966A6",
  "#40348B",
  "#C72588",
  "#169D8F",
  "#15803D",
  "#E9A324",
  "#EF4444",
  "#111827",
  "#FFFFFF",
];

export default function ProfileColorPicker({
  label,
  value,
  onChange,
}: ColorPickerProps) {
  const color = /^#[\da-f]{6}$/i.test(value) ? value : "#1966A6";
  return (
    <View style={{ gap: 7, width: 280, maxWidth: "100%" }}>
      <FieldLabel label={label} />
      <View style={styles.panel}>
        <View style={styles.presets}>
          {COLOR_PRESETS.map((preset) => (
            <Pressable
              key={preset}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${preset}`}
              accessibilityState={{
                selected: color.toLowerCase() === preset.toLowerCase(),
              }}
              style={[
                styles.preset,
                {
                  backgroundColor: preset,
                  borderWidth:
                    color.toLowerCase() === preset.toLowerCase() ? 3 : 1,
                },
              ]}
              onPress={() => onChange(preset)}
            />
          ))}
        </View>
        <View style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <TextInput
            accessibilityLabel={`${label} hex code`}
            value={value}
            onChangeText={onChange}
            maxLength={7}
            autoCapitalize="characters"
            style={[fieldStyles.input, { flex: 1, textAlign: "center" }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 5,
    borderWidth: 1,
    borderColor: "#E8E5ED",
    borderRadius: 6,
    gap: 8,
  },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  preset: { width: 23, height: 34, borderRadius: 4, borderColor: "#C5C0D2" },
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  swatch: { width: 28, height: 28, borderRadius: 6 },
});
