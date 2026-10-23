import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ServiceMasterEditor from './ServiceMasterEditor';

export default function ServiceHsnScreen() {
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ServiceMasterEditor />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    padding: 18,
    gap: 16,
  },
});
