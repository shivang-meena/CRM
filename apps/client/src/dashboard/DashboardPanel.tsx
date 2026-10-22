import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const dashboardColors = {
  purple: '#0B2F7D',
  text: '#0E1B3D',
  muted: '#56627C',
  border: '#DCE3F0',
  background: '#F7F9FC',
};
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Props = {
  title: string;
  icon: IconName;
  tabs?: { key: string; label: string; count: number }[];
  selected?: string;
  onSelect?: (key: string) => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
  empty: boolean;
  loading?: boolean;
  emptyMessage: string;
  fullWidth?: boolean;
};

export default function DashboardPanel(props: Props) {
  return (
    <View style={[styles.panel, props.fullWidth && styles.notesPanel]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={props.icon} size={18} color={dashboardColors.purple} />
          <Text style={styles.title}>{props.title}</Text>
        </View>
        {props.tabs ? (
          <View style={styles.tabs}>
            {props.tabs.map((tab) => (
              <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: props.selected === tab.key }}
                onPress={() => props.onSelect?.(tab.key)} style={[styles.tab, props.selected === tab.key && styles.activeTab]}>
                <Text style={[styles.tabText, props.selected === tab.key && styles.activeText]}>{tab.label} ({tab.count})</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {props.action ? <View style={styles.action}>{props.action}</View> : null}
      </View>
      {props.loading ? (
        <View style={styles.empty}><ActivityIndicator color={dashboardColors.purple} /></View>
      ) : props.empty ? (
        <View style={styles.empty}>
          <Ionicons name={props.icon} size={42} color="#D5D5D8" />
          <Text style={styles.emptyText}>{props.emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} nestedScrollEnabled>{props.children}</ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { height: 302, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: dashboardColors.border, borderRadius: 10,
    overflow: 'hidden', boxShadow: '0 2px 8px rgba(11,47,125,0.06)' },
  notesPanel: { height: 248 },
  header: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, borderBottomColor: dashboardColors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: dashboardColors.text, fontSize: 15, fontWeight: '500' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#EEEDF5', borderRadius: 7, padding: 3, gap: 4 },
  tab: { backgroundColor: '#F6F6F7', borderRadius: 4, paddingHorizontal: 12, minHeight: 24, justifyContent: 'center' },
  activeTab: { backgroundColor: '#E8E6F3' },
  tabText: { fontSize: 10, fontWeight: '600', color: '#85858E' },
  activeText: { color: dashboardColors.purple },
  action: { marginLeft: 'auto' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 48, gap: 9 },
  emptyText: { color: dashboardColors.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },
  body: { flex: 1 },
  bodyContent: { padding: 14, gap: 9 },
});
