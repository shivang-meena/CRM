import React, { useRef, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fieldStyles } from './ProfileFields';

export default function GstSignatureUpload({
  value,
  onChange,
  onError,
  onBusyChange,
  disabled,
  label = 'Invoice GST Signature:',
}: {
  value: string;
  onChange: (value: string) => void;
  onError: (error: string) => void;
  onBusyChange: (busy: boolean) => void;
  disabled: boolean;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  function read(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || disabled) return;
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(
        file.type,
      )
    ) {
      onError('Choose a PNG, JPG, WEBP or GIF signature.');
      return;
    }
    if (file.size > 1024 * 1024) {
      onError('Signature must be 1 MB or smaller.');
      return;
    }
    onBusyChange(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onError('');
        onChange(reader.result);
      } else onError('Could not read the signature. Please choose it again.');
    };
    reader.onerror = () =>
      onError('Could not read the signature. Please choose it again.');
    reader.onloadend = () => onBusyChange(false);
    reader.readAsDataURL(file);
  }
  return (
    <View style={styles.container}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={styles.preview}>
        {value ? (
          <Image
            source={{ uri: value }}
            resizeMode="contain"
            style={styles.image}
            accessibilityLabel={`${label} preview`}
            onError={() =>
              onError(
                'This signature could not be displayed. Choose a valid image.',
              )
            }
          />
        ) : (
          <Ionicons name="create-outline" size={35} color="#C1B6CA" />
        )}
      </View>
      {Platform.OS === 'web' ? (
        <>
          {React.createElement('input', {
            ref: input,
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp,image/gif',
            'aria-label': `Upload ${label}`,
            style: { display: 'none' },
            onChange: read,
          })}
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            style={styles.upload}
            onPress={() => input.current?.click()}
          >
            <Text style={styles.buttonText}>Upload</Text>
          </Pressable>
        </>
      ) : (
        <View style={{ gap: 8 }}>
          <TextInput
            accessibilityLabel={`${label} image URL`}
            editable={!disabled}
            style={fieldStyles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="HTTPS signature image URL"
            autoCapitalize="none"
            keyboardType="url"
          />
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            style={styles.upload}
            onPress={() => {
              if (!/^https:\/\/[^\s]+$/i.test(url.trim())) {
                onError('Enter a valid HTTPS signature image URL.');
                return;
              }
              onError('');
              onChange(url.trim());
            }}
          >
            <Text style={styles.buttonText}>Upload</Text>
          </Pressable>
        </View>
      )}
      {value ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => {
            onError('');
            onChange('');
          }}
        >
          <Text style={styles.remove}>Remove signature</Text>
        </Pressable>
      ) : null}
      <Text style={styles.hint}>PNG, JPG, WEBP or GIF · Max 1 MB</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 230,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  preview: {
    width: 160,
    height: 125,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: 150, height: 100 },
  upload: {
    backgroundColor: '#40348B',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 17,
    alignSelf: 'center',
  },
  buttonText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  remove: { color: '#84778E', fontSize: 11 },
  hint: { color: '#928897', fontSize: 10 },
});
