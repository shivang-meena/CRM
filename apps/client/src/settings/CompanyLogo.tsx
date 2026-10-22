import React, { useRef, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fieldStyles } from "./ProfileFields";

export default function CompanyLogo({
  value,
  onChange,
  onError,
  onBusyChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onError: (error: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  function readLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      onError("Choose a PNG, JPG, WEBP or GIF image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      onError("Logo must be 1 MB or smaller.");
      return;
    }
    onBusyChange(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onError("");
        onChange(reader.result);
      } else onError("Could not read this image. Please choose it again.");
    };
    reader.onerror = () =>
      onError("Could not read this image. Please choose it again.");
    reader.onloadend = () => onBusyChange(false);
    reader.readAsDataURL(file);
  }

  return (
    <View style={styles.container}>
      <Text style={fieldStyles.label}>Company Logo</Text>
      <View style={styles.preview}>
        {value ? (
          <Image
            source={{ uri: value }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel="Company logo preview"
            onError={() =>
              onError("This logo could not be displayed. Choose a valid image.")
            }
          />
        ) : (
          <View style={styles.emptyLogo}>
            <Ionicons name="business-outline" size={38} color="#A69AC7" />
            <Text style={styles.placeholder}>Your company logo</Text>
          </View>
        )}
      </View>
      {Platform.OS === "web"
        ? React.createElement("input", {
            ref: input,
            type: "file",
            accept: "image/png,image/jpeg,image/webp,image/gif",
            "aria-label": "Upload company logo",
            style: { display: "none" },
            onChange: readLogo,
          })
        : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upload company logo"
          style={styles.upload}
          onPress={() => {
            if (Platform.OS === "web") input.current?.click();
            else {
              setUrl(value.startsWith("https://") ? value : "");
              setUrlError("");
              setUrlOpen(true);
            }
          }}
        >
          <Text style={styles.uploadText}>Upload</Text>
        </Pressable>
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove company logo"
            onPress={() => {
              onError("");
              onChange("");
            }}
          >
            <Ionicons name="trash-outline" size={17} color="#84778E" />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.hint}>PNG, JPG, WEBP or GIF · Max 1 MB</Text>
      <Modal
        visible={urlOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUrlOpen(false)}
      >
        <View style={fieldStyles.backdrop}>
          <View style={fieldStyles.dialog}>
            <Text style={fieldStyles.dialogTitle}>Company Logo</Text>
            <Text style={styles.hint}>
              Enter an HTTPS image URL, or upload a file from Web Settings in
              your browser.
            </Text>
            <TextInput
              accessibilityLabel="Company logo URL"
              style={fieldStyles.input}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://example.com/logo.png"
            />
            {urlError ? (
              <Text style={fieldStyles.error}>{urlError}</Text>
            ) : null}
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                style={styles.upload}
                onPress={() => {
                  if (!/^https:\/\/[^\s]+$/i.test(url.trim())) {
                    setUrlError("Enter a valid HTTPS image URL.");
                    return;
                  }
                  onError("");
                  onChange(url.trim());
                  setUrlOpen(false);
                }}
              >
                <Text style={styles.uploadText}>Use logo</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setUrlOpen(false)}
              >
                <Text style={fieldStyles.value}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 225,
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  preview: {
    width: 160,
    height: 126,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: 150, height: 118 },
  emptyLogo: { alignItems: "center", gap: 8 },
  placeholder: { fontSize: 11, color: "#A69AAA" },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  upload: {
    backgroundColor: "#0B2F7D",
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 17,
  },
  uploadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  hint: { fontSize: 10, color: "#928897", textAlign: "center", lineHeight: 16 },
});
