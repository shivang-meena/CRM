// ORIGINAL IMPLEMENTATION PRESERVED BELOW AS COMMENTS.
// // // apps/client/src/components/lead/LeadSectionTabs.tsx
// // import React from 'react';
// // import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
// // import { colors } from '@/theme/colors';
// // import { LeadSection, sectionLabels, sectionOrder, SectionSummary } from '@/types/leadActivities';
// // import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';
//
// // type Props = {
// //   selected: LeadSection;
// //   onSelect: (section: LeadSection) => void;
// //   summary?: SectionSummary;
// //   loading: boolean;
// //   error: boolean;
// // };
//
// // export default function LeadSectionTabs({
// //   selected,
// //   onSelect,
// //   summary,
// //   loading,
// //   error,
// // }: Props) {
// //   const { canAccess } = usePermissions();
// //   // Badges map to counts for non-deleted records
// //   const getBadgeCount = (key: LeadSection): number | string | null => {
// //     if (key === 'details' || key === 'history') return null;
// //     if (loading) return '…';
// //     if (error || !summary) return '…';
// //     const c = summary.counts[key as keyof SectionSummary['counts']];
// //     return typeof c === 'number' ? c : '…';
// //   };
//
// //   return (
// //     <View style={styles.tabContainer}>
// //       <ScrollView
// //         horizontal
// //         showsHorizontalScrollIndicator={false}
// //         contentContainerStyle={styles.scrollContent}
// //         accessibilityRole="tablist"
// //         accessibilityLabel="Lead section tabs"
// //       >
// //         {sectionOrder.filter(key => canAccess(leadSectionPermissions[key])).map((key) => {
// //           const active = selected === key;
// //           const badge = getBadgeCount(key);
//
// //           return (
// //             <Pressable
// //               key={key}
// //               accessibilityRole="tab"
// //               accessibilityLabel={`${sectionLabels[key]}${badge !== null ? `, ${badge} records` : ''}`}
// //               accessibilityState={{ selected: active }}
// //               onPress={() => onSelect(key)}
// //               style={[styles.tab, active && styles.activeTab]}
// //             >
// //               <Text style={[styles.tabText, active && styles.activeTabText]}>
// //                 {sectionLabels[key]}
// //               </Text>
// //               {badge !== null ? (
// //                 <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
// //                   <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
// //                     {String(badge)}
// //                   </Text>
// //                 </View>
// //               ) : null}
// //             </Pressable>
// //           );
// //         })}
// //       </ScrollView>
// //     </View>
// //   );
// // }
//
// // const styles = StyleSheet.create({
// //   tabContainer: {
// //     backgroundColor: colors.white,
// //     borderBottomWidth: 1,
// //     borderBottomColor: colors.border,
// //   },
// //   scrollContent: {
// //     flexDirection: 'row',
// //     alignItems: 'stretch',
// //   },
// //   tab: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: 6,
// //     paddingHorizontal: 14,
// //     paddingVertical: 12,
// //     borderBottomWidth: 3,
// //     borderBottomColor: 'transparent',
// //     minHeight: 46,
// //   },
// //   activeTab: {
// //     borderBottomColor: colors.accent,
// //   },
// //   tabText: {
// //     fontSize: 13,
// //     fontWeight: '600',
// //     color: colors.text,
// //   },
// //   activeTabText: {
// //     fontWeight: '800',
// //     color: colors.primaryText,
// //   },
// //   badge: {
// //     minWidth: 20,
// //     height: 20,
// //     paddingHorizontal: 6,
// //     borderRadius: 10,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   inactiveBadge: {
// //     backgroundColor: colors.primarySoft,
// //   },
// //   activeBadge: {
// //     backgroundColor: colors.accent,
// //   },
// //   badgeText: {
// //     fontSize: 11,
// //     fontWeight: '700',
// //   },
// //   inactiveBadgeText: {
// //     color: colors.primaryText,
// //   },
// //   activeBadgeText: {
// //     color: colors.white,
// //   },
// // });
//
// // apps/client/src/components/lead/LeadSectionTabs.tsx
// import React from 'react';
// import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
// import { colors } from '@/theme/colors';
// import { LeadSection, sectionLabels, sectionOrder, SectionSummary } from '@/types/leadActivities';
// import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';
//
// type Props = {
//   selected: LeadSection;
//   onSelect: (section: LeadSection) => void;
//   summary?: SectionSummary;
//   loading: boolean;
//   error: boolean;
// };
//
// export default function LeadSectionTabs({
//   selected,
//   onSelect,
//   summary,
//   loading,
//   error,
// }: Props) {
//   const { canAccess } = usePermissions();
//   // Badges map to counts for non-deleted records
//   const getBadgeCount = (key: LeadSection): number | string | null => {
//     if (key === 'details' || key === 'history') return null;
//     if (loading) return '…';
//     if (error || !summary) return '…';
//     const c = summary.counts[key as keyof SectionSummary['counts']];
//     return typeof c === 'number' ? c : '…';
//   };
//
//   return (
//     <View style={styles.tabContainer}>
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//         accessibilityRole="tablist"
//         accessibilityLabel="Lead section tabs"
//       >
//         {sectionOrder.filter(key => canAccess(leadSectionPermissions[key])).map((key) => {
//           const active = selected === key;
//           const badge = getBadgeCount(key);
//
//           return (
//             <Pressable
//               key={key}
//               accessibilityRole="tab"
//               accessibilityLabel={`${sectionLabels[key]}${badge !== null ? `, ${badge} records` : ''}`}
//               accessibilityState={{ selected: active }}
//               onPress={() => onSelect(key)}
//               style={({ pressed }) => [
//                 styles.tab,
//                 active && styles.activeTab,
//                 !active && pressed && styles.pressedTab,
//               ]}
//             >
//               <Text style={[styles.tabText, active && styles.activeTabText]}>
//                 {sectionLabels[key]}
//               </Text>
//               {badge !== null ? (
//                 <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
//                   <Text style={[styles.badgeText, active ? styles.activeBadgeText : styles.inactiveBadgeText]}>
//                     {String(badge)}
//                   </Text>
//                 </View>
//               ) : null}
//             </Pressable>
//           );
//         })}
//       </ScrollView>
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   tabContainer: {
//     backgroundColor: '#F8FAFD',
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   scrollContent: {
//     flexDirection: 'row',
//     alignItems: 'stretch',
//     paddingHorizontal: 8,
//   },
//   tab: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 7,
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderBottomWidth: 3,
//     borderBottomColor: 'transparent',
//     minHeight: 48,
//   },
//   activeTab: {
//     borderBottomColor: colors.accent,
//   },
//   pressedTab: {
//     opacity: 0.65,
//   },
//   tabText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: colors.muted,
//   },
//   activeTabText: {
//     fontWeight: '800',
//     color: colors.primaryText,
//   },
//   badge: {
//     minWidth: 20,
//     height: 20,
//     paddingHorizontal: 6,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   inactiveBadge: {
//     backgroundColor: '#E8ECF4',
//   },
//   activeBadge: {
//     backgroundColor: colors.accent,
//   },
//   badgeText: {
//     fontSize: 11,
//     fontWeight: '700',
//   },
//   inactiveBadgeText: {
//     color: colors.muted,
//   },
//   activeBadgeText: {
//     color: colors.white,
//   },
// });

// REDESIGN NOTES: pill-style tabs (active = filled soft pill, not just an underline) with count
// badges, on a soft strip. Badge/permission logic unchanged.
import React from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { colors } from '@/theme/colors';
import { LeadSection, sectionLabels, sectionOrder, SectionSummary } from '@/types/leadActivities';
import { leadSectionPermissions, usePermissions } from '@/hooks/usePermissions';

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
  const { canAccess } = usePermissions();
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
        {sectionOrder.filter(key => canAccess(leadSectionPermissions[key])).map((key) => {
          const active = selected === key;
          const badge = getBadgeCount(key);

          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityLabel={`${sectionLabels[key]}${badge !== null ? `, ${badge} records` : ''}`}
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(key)}
              style={({ pressed }) => [
                styles.tab,
                active && styles.activeTab,
                !active && pressed && styles.pressedTab,
              ]}
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
    backgroundColor: '#F8FAFD',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0 1px 3px rgba(15,27,61,0.08)',
  },
  pressedTab: { backgroundColor: '#EEF2F8' },
  tabText: { fontSize: 13.5, fontWeight: '600', color: colors.muted },
  activeTabText: { fontWeight: '800', color: colors.primaryText },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveBadge: { backgroundColor: '#E8ECF4' },
  activeBadge: { backgroundColor: colors.accent },
  badgeText: { fontSize: 11, fontWeight: '800' },
  inactiveBadgeText: { color: colors.muted },
  activeBadgeText: { color: colors.white },
});
