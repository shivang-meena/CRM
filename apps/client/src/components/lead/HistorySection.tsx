import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { errorMessage } from '@/api/client';
import Button from '@/components/Button';
import { useHistory } from '@/hooks/useLeadActivities';
import { HistoryRecord, ListFilters } from '@/types/leadActivities';
import { formatDateTime } from '@/utils/format';
import { colors } from '@/theme/colors';
import { labelFor, Pager, ui } from './FormControls';

export default function HistorySection({ leadId }: { leadId: string }) {
  const [filters, setFilters] = useState<ListFilters>({ page: 1, pageSize: 20 });
  const [text, setText] = useState('');
  const query = useHistory(leadId, filters);

  return (
    <View style={styles.container}>
      <View style={[ui.panel, ui.row]}>
        <TextInput
          accessibilityLabel="Search history"
          placeholder="Search history by summary..."
          value={text}
          onChangeText={setText}
          style={[ui.input, { flex: 1, minWidth: 160 }]}
          placeholderTextColor={colors.muted}
        />
        <Button
          title="Search"
          variant="outline"
          onPress={() => setFilters({ page: 1, pageSize: 20, search: text.trim() || undefined })}
        />
        {text ? (
          <Button
            title="Clear"
            variant="outline"
            onPress={() => {
              setText('');
              setFilters({ page: 1, pageSize: 20 });
            }}
          />
        ) : null}
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : query.isError ? (
        <View accessibilityRole="alert" style={ui.panel}>
          <Text style={ui.error}>{errorMessage(query.error)}</Text>
          <Button title="Retry" variant="outline" onPress={() => { void query.refetch(); }} />
        </View>
      ) : !query.data?.items.length ? (
        <View style={ui.panel}>
          <Text style={ui.muted}>No history records found for this lead.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {query.data.items.map((row: HistoryRecord) => (
            <View key={row.id} style={ui.panel}>
              <View style={ui.row}>
                <Text style={[ui.label, { flex: 1 }]}>{row.summary}</Text>
                <View style={styles.actionTag}>
                  <Text style={styles.actionTagText}>{labelFor(row.action)}</Text>
                </View>
              </View>
              <Text style={ui.muted}>
                {row.actorName} • {formatDateTime(row.createdAt)} IST • {labelFor(row.entityType)}
              </Text>
              {row.changes && Object.keys(row.changes).length > 0 ? (
                <View style={styles.changesBox}>
                  {Object.entries(row.changes).map(([field, change]) => (
                    <Text key={field} style={styles.changeLine}>
                      <Text style={styles.changeField}>{labelFor(field)}: </Text>
                      <Text style={styles.changeBefore}>{String(change.before ?? '—')}</Text>
                      <Text style={styles.changeArrow}> → </Text>
                      <Text style={styles.changeAfter}>{String(change.after ?? '—')}</Text>
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
          {query.data.total > (filters.pageSize ?? 20) ? (
            <Pager
              page={filters.page ?? 1}
              total={query.data.total}
              pageSize={filters.pageSize}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  list: {
    gap: 10,
  },
  actionTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  changesBox: {
    backgroundColor: '#F8FAFD',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    marginTop: 4,
  },
  changeLine: {
    fontSize: 12,
  },
  changeField: {
    fontWeight: '700',
    color: colors.text,
  },
  changeBefore: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  changeArrow: {
    color: colors.muted,
  },
  changeAfter: {
    color: colors.green,
    fontWeight: '600',
  },
});
