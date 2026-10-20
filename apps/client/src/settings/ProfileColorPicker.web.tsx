import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { FieldLabel, fieldStyles } from "./ProfileFields";
import type { ColorPickerProps } from "./ProfileColorPicker";

function toHsv(hex: string): [number, number, number] {
  const rgb = [1, 3, 5].map(
    (offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const [r, g, b] = rgb;
  const max = Math.max(...rgb),
    min = Math.min(...rgb),
    delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  return [(h * 60 + 360) % 360, max ? delta / max : 0, max];
}

function toHex(h: number, s: number, v: number): string {
  const channel = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`.toUpperCase();
}

export default function ProfileColorPicker({
  label,
  value,
  onChange,
}: ColorPickerProps) {
  const valid = /^#[\da-f]{6}$/i.test(value);
  const color = valid ? value : "#1966A6";
  const [h, s, v] = toHsv(color);
  const [lastHue, setLastHue] = useState(h);
  const hue = s > 0 && v > 0 ? h : lastHue;

  function pick(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const saturation = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const brightness =
      1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    onChange(toHex(hue, saturation, brightness));
  }

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <View style={styles.panel}>
        <div
          role="slider"
          aria-label={`${label} saturation and brightness`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(v * 100)}
          aria-valuetext={color}
          tabIndex={0}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pick(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) pick(event);
          }}
          onKeyDown={(event) => {
            const steps: Record<string, [number, number]> = {
              ArrowLeft: [-0.02, 0],
              ArrowRight: [0.02, 0],
              ArrowUp: [0, 0.02],
              ArrowDown: [0, -0.02],
            };
            const step = steps[event.key];
            if (step) {
              event.preventDefault();
              onChange(
                toHex(
                  hue,
                  Math.max(0, Math.min(1, s + step[0])),
                  Math.max(0, Math.min(1, v + step[1])),
                ),
              );
            }
          }}
          style={{
            height: 70,
            borderRadius: 3,
            position: "relative",
            touchAction: "none",
            cursor: "crosshair",
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #FFF, hsl(${hue}, 100%, 50%))`,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: `${s * 100}%`,
              top: `${(1 - v) * 100}%`,
              width: 10,
              height: 10,
              border: "2px solid white",
              borderRadius: "50%",
              boxSizing: "border-box",
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 1px #333",
              pointerEvents: "none",
            }}
          />
        </div>
        <input
          type="range"
          aria-label={`${label} hue`}
          min={0}
          max={359}
          value={Math.round(hue)}
          onChange={(event) => {
            const nextHue = Number(event.target.value);
            setLastHue(nextHue);
            onChange(toHex(nextHue, s || 1, v || 1));
          }}
          style={{
            width: "100%",
            height: 7,
            margin: "4px 0",
            appearance: "none",
            borderRadius: 10,
            accentColor: "#FFFFFF",
            cursor: "pointer",
            background:
              "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
          }}
        />
        <View style={styles.row}>
          <input
            type="color"
            aria-label={`${label} color picker`}
            value={color}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              border: 0,
              borderRadius: 6,
              cursor: "pointer",
              background: color,
            }}
          />
          <TextInput
            accessibilityLabel={`${label} hex code`}
            value={value}
            onChangeText={onChange}
            maxLength={7}
            autoCapitalize="characters"
            style={[
              fieldStyles.input,
              styles.hex,
              !valid && fieldStyles.invalid,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7, width: 280, maxWidth: "100%" },
  panel: {
    padding: 5,
    borderWidth: 1,
    borderColor: "#E8E5ED",
    borderRadius: 6,
    gap: 3,
  },
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  hex: {
    flex: 1,
    minHeight: 28,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 11,
  },
});
