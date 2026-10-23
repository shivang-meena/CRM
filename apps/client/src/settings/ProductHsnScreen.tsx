import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ProductMasterEditor from './ProductMasterEditor';

export default function ProductHsnScreen() {
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ProductMasterEditor />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 18, gap: 16 },
});
