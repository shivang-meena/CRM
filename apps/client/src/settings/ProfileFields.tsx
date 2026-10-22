import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#0B2F7D";

export function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <Text style={fieldStyles.label}>
      {label}
      {required ? <Text style={fieldStyles.required}> *</Text> : null}
    </Text>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  placeholder?: string;
  maxLength?: number;
};

export function ProfileField({
  label,
  value,
  onChange,
  required,
  error,
  multiline,
  keyboardType,
  placeholder,
  maxLength,
}: FieldProps) {
  return (
    <View style={fieldStyles.field}>
      <FieldLabel label={label} required={required} />
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        style={[
          fieldStyles.input,
          multiline && fieldStyles.multiline,
          Boolean(error) && fieldStyles.invalid,
        ]}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#96919D"
        maxLength={maxLength}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
      />
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
    </View>
  );
}

export function ProfileSelect({
  label,
  value,
  onChange,
  options,
  required,
  error,
  allowCustom = true,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
  error?: string;
  allowCustom?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchValue = search.trim();
  const values = options.filter((option) =>
    option.toLowerCase().includes(searchValue.toLowerCase()),
  );
  function choose(option: string) {
    onChange(option);
    setOpen(false);
  }

  return (
    <View style={fieldStyles.field}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label || "Country calling code"}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setSearch("");
          setOpen(true);
        }}
        style={[
          fieldStyles.input,
          fieldStyles.select,
          Boolean(error) && fieldStyles.invalid,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[fieldStyles.value, !value && fieldStyles.placeholder]}
        >
          {value || `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={15} color="#68616E" />
      </Pressable>
      {error ? <Text style={fieldStyles.error}>{error}</Text> : null}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={fieldStyles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close selection"
          />
          <View style={fieldStyles.dialog} accessibilityViewIsModal>
            <View style={fieldStyles.dialogHeader}>
              <Text accessibilityRole="header" style={fieldStyles.dialogTitle}>
                {label || "Country calling code"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close selection"
                hitSlop={12}
                onPress={() => setOpen(false)}
              >
                <Ionicons name="close" size={22} color="#514759" />
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel={`Search or enter ${label || "calling code"}`}
              value={search}
              onChangeText={setSearch}
              placeholder={
                allowCustom ? "Search or enter a value..." : "Search..."
              }
              maxLength={label === "Business Category" ? 150 : 100}
              style={fieldStyles.input}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={fieldStyles.options}
            >
              {allowCustom &&
              searchValue &&
              !options.some(
                (option) => option.toLowerCase() === searchValue.toLowerCase(),
              ) ? (
                <Pressable
                  accessibilityRole="button"
                  style={fieldStyles.option}
                  onPress={() => choose(searchValue)}
                >
                  <Text style={fieldStyles.customValue}>
                    Use “{searchValue}”
                  </Text>
                </Pressable>
              ) : null}
              {values.map((option) => (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === option }}
                  style={[
                    fieldStyles.option,
                    value === option && fieldStyles.selected,
                  ]}
                  onPress={() => choose(option)}
                >
                  <Text style={fieldStyles.value}>{option}</Text>
                  {value === option ? (
                    <Ionicons name="checkmark" size={18} color={PURPLE} />
                  ) : null}
                </Pressable>
              ))}
              {!values.length && !searchValue ? (
                <Text style={fieldStyles.hint}>
                  Type a value above to select it.
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function ProfileTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={fieldStyles.field}>
      <FieldLabel label={label} />
      {Platform.OS === "web" ? (
        React.createElement("input", {
          type: "time",
          "aria-label": label,
          value,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value),
          style: {
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            height: 39,
            padding: "8px 10px",
            border: "1px solid #DEDBE5",
            borderRadius: 4,
            color: "#665F6C",
            background: "#FFFFFF",
            font: "inherit",
            fontSize: 12,
          },
        })
      ) : (
        <TextInput
          accessibilityLabel={label}
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder="HH:mm"
          maxLength={5}
          keyboardType="numbers-and-punctuation"
        />
      )}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  field: { gap: 7, flex: 1, minWidth: 0 },
  label: { fontSize: 12, color: "#584859" },
  required: { color: "#E44255" },
  input: {
    minHeight: 39,
    borderWidth: 1,
    borderColor: "#DEDBE5",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 12,
    color: "#665F6C",
    backgroundColor: "#FFFFFF",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  invalid: { borderColor: "#C6384C" },
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "space-between",
  },
  value: { fontSize: 12, color: "#665F6C", flexShrink: 1 },
  placeholder: { color: "#96919D" },
  error: { fontSize: 11, color: "#B3261E" },
  hint: { fontSize: 12, color: "#77707E", padding: 12 },
  backdrop: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(25, 18, 43, 0.35)",
  },
  dialog: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    width: "100%",
    maxWidth: 440,
    maxHeight: "80%",
    gap: 14,
  },
  dialogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dialogTitle: { fontSize: 15, fontWeight: "700", color: "#514759" },
  options: { flexGrow: 0, maxHeight: 320 },
  option: {
    minHeight: 42,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 4,
  },
  selected: { backgroundColor: "#F0EDF9" },
  customValue: { fontSize: 12, color: PURPLE, fontWeight: "600" },
});
