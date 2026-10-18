import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { colors } from '@/theme/colors';
import { LeadSection, sectionLabels, sectionOrder, SectionSummary } from '@/types/leadActivities';

type Props = {
  selected: LeadSection;
  onSelect: (section: LeadSection) => void;
  summary?: SectionSummary;
  loading: boolean;
  error: boolean;
};

export default function LeadSectionTabs({
  selected,
  onSelect,
  summary,
  loading,
  error,
}: Props) {
  // Badges map to counts for non-deleted records
  const getBadgeCount = (key: LeadSection): number | string | null => {
    if (key === 'details' || key === 'history') return null;
    if (loading) return '…';
    if (error || !summary) return '…';
    const c = summary.counts[key as keyof SectionSummary['counts']];
    return typeof c === 'number' ? c : '…';
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="tablist"
        accessibilityLabel="Lead section tabs"
      >
        {sectionOrder.map((key) => {
          const active = selected === key;
          const badge = getBadgeCount(key);

          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={`${sectionLabels[key]}${badge !== null ? `, ${badge} records` : ''}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(key)}
              style={[styles.tab, active && styles.activeTab]}
            >
              <Text style={[styles.tabText, active && styles.activeTabText]}>
                {sectionLabels[key]}
              </Text>
              {badge !== null ? (
                <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
                    {String(badge)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minHeight: 46,
  },
  activeTab: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activeTabText: {
    fontWeight: '800',
    color: colors.primaryText,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBadge: {
    backgroundColor: colors.primarySoft,
  },
  activeBadge: {
    backgroundColor: colors.accent,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inactiveBadgeText: {
    color: colors.primaryText,
  },
  activeBadgeText: {
    color: colors.white,
  },
});
