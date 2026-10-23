// // apps/client/src/components/lead/LeadHeader.tsx
// import React from 'react';
// import { StyleSheet, Text, View } from 'react-native';
// import { Lead, statusLabel } from '@/types/lead';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { formatDateTime, formatINR } from '@/utils/format';
// import { colors } from '@/theme/colors';
// import Stars from '@/components/Stars';

// export default function LeadHeader({ lead }: { lead: Lead }) {
//   const statusesQuery = useLeadStatuses();
//   const matchedStatus = statusesQuery.data?.find(
//     (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
//   );
//   const statusName = matchedStatus?.name ?? statusLabel(lead.status);
//   const statusColor = matchedStatus?.color;

//   return (
//     <View style={styles.header}>
//       <View style={styles.row}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>{(lead.name || 'L').charAt(0).toUpperCase()}</Text>
//         </View>
//         <View style={styles.titleInfo}>
//           <View style={styles.nameRow}>
//             <Text style={styles.name}>{lead.name}</Text>
//             <View style={[styles.statusBadge, statusColor && { backgroundColor: statusColor + '1A' }]}>
//               <Text style={[styles.statusText, statusColor && { color: statusColor }]}>{statusName}</Text>
//             </View>
//           </View>
//           {lead.companyName ? <Text style={styles.company}>{lead.companyName}</Text> : null}
//           <View style={styles.metaRow}>
//             <Text style={styles.metaText}>Assigned to: <Text style={styles.metaBold}>{lead.assignedTo || 'Unassigned'}</Text></Text>
//             <Text style={styles.dot}>•</Text>
//             <Text style={styles.metaText}>Phone: <Text style={styles.metaBold}>{lead.phone}</Text></Text>
//             {lead.email ? (
//               <>
//                 <Text style={styles.dot}>•</Text>
//                 <Text style={styles.metaText}>Email: <Text style={styles.metaBold}>{lead.email}</Text></Text>
//               </>
//             ) : null}
//           </View>
//         </View>
//       </View>

//       <View style={styles.summaryBar}>
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Next Follow-up</Text>
//           <Text style={[styles.summaryVal, !lead.nextFollowUpAt && styles.emptyVal]}>
//             {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'None scheduled'}
//           </Text>
//         </View>
//         <View style={styles.divider} />
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Estimated Amount</Text>
//           <Text style={styles.summaryVal}>{formatINR(Number(lead.estimatedAmount))}</Text>
//         </View>
//         <View style={styles.divider} />
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Rating</Text>
//           <Stars value={lead.rating} size={15} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     backgroundColor: colors.white,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 8,
//     padding: 16,
//     gap: 14,
//   },
//   row: {
//     flexDirection: 'row',
//     gap: 14,
//     alignItems: 'flex-start',
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: colors.primarySoft,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   avatarText: {
//     fontSize: 22,
//     fontWeight: '800',
//     color: colors.primaryText,
//   },
//   titleInfo: {
//     flex: 1,
//     gap: 4,
//   },
//   nameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     flexWrap: 'wrap',
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: '800',
//     color: colors.text,
//   },
//   statusBadge: {
//     backgroundColor: colors.primarySoft,
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
//   company: {
//     fontSize: 14,
//     color: colors.muted,
//     fontWeight: '500',
//   },
//   metaRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     alignItems: 'center',
//     gap: 8,
//     marginTop: 2,
//   },
//   metaText: {
//     fontSize: 12,
//     color: colors.muted,
//   },
//   metaBold: {
//     fontWeight: '700',
//     color: colors.text,
//   },
//   dot: {
//     fontSize: 12,
//     color: colors.muted,
//   },
//   summaryBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.primarySoft,
//     borderRadius: 6,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   summaryItem: {
//     flex: 1,
//     minWidth: 110,
//     gap: 2,
//   },
//   summaryLabel: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
//   summaryVal: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: colors.text,
//   },
//   emptyVal: {
//     color: colors.muted,
//     fontStyle: 'italic',
//     fontWeight: '400',
//   },
//   divider: {
//     width: 1,
//     height: 24,
//     backgroundColor: colors.border,
//   },
// });


// apps/client/src/components/lead/LeadHeader.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead, statusLabel } from '@/types/lead';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { formatDateTime, formatINR } from '@/utils/format';
import { colors } from '@/theme/colors';
import Stars from '@/components/Stars';

function MetaChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.muted} />
      <Text style={styles.metaText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={16} color={colors.primaryText} />
      </View>
      <View style={styles.statBody}>
        <Text style={styles.statLabel}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

export default function LeadHeader({ lead }: { lead: Lead }) {
  const statusesQuery = useLeadStatuses();
  const matchedStatus = statusesQuery.data?.find(
    (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
  );
  const statusName = matchedStatus?.name ?? statusLabel(lead.status);
  const statusColor = matchedStatus?.color;

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(lead.name || 'L').charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.titleInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>
              {lead.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                statusColor ? { backgroundColor: statusColor + '1A' } : null,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor || colors.primaryText },
                ]}
              />
              <Text style={[styles.statusText, statusColor ? { color: statusColor } : null]}>
                {statusName}
              </Text>
            </View>
          </View>

          {lead.companyName ? (
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={14} color={colors.muted} />
              <Text style={styles.company}>{lead.companyName}</Text>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <MetaChip icon="person-outline" text={lead.assignedTo || 'Unassigned'} />
            <MetaChip icon="call-outline" text={lead.phone} />
            {lead.email ? <MetaChip icon="mail-outline" text={lead.email} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.summaryBar}>
        <Stat icon="calendar-outline" label="Next Follow-up">
          <Text style={[styles.statVal, !lead.nextFollowUpAt && styles.emptyVal]} numberOfLines={1}>
            {lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'None scheduled'}
          </Text>
        </Stat>
        <View style={styles.divider} />
        <Stat icon="cash-outline" label="Estimated Amount">
          <Text style={styles.statVal}>{formatINR(Number(lead.estimatedAmount))}</Text>
        </Stat>
        <View style={styles.divider} />
        <Stat icon="star-outline" label="Rating">
          <Stars value={lead.rating} size={15} />
        </Stat>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryText,
  },
  titleInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryText,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  company: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F4F6FA',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBody: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  emptyVal: {
    color: colors.muted,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
});






