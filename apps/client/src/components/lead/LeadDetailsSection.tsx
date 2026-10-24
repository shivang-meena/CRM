// ORIGINAL IMPLEMENTATION PRESERVED BELOW AS COMMENTS.
// // // apps/client/src/components/lead/LeadDetailsSection.tsx
// // import React from 'react';
// // import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
// // import { Lead, sourceLabel, statusLabel } from '@/types/lead';
// // import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// // import { formatDateTime, formatINR } from '@/utils/format';
// // import { colors } from '@/theme/colors';
// // import Button from '@/components/Button';
// // import Stars from '@/components/Stars';
//
// // function Card({ title, wide, children }: { title: string; wide: boolean; children: React.ReactNode }) {
// //   return (
// //     <View style={[styles.card, wide && { flex: 1 }]}>
// //       <View style={styles.cardHead}>
// //         <Text style={styles.cardTitle}>{title}</Text>
// //       </View>
// //       <View style={styles.cardBody}>{children}</View>
// //     </View>
// //   );
// // }
//
// // function Item({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
// //   return (
// //     <View style={styles.item}>
// //       <Text style={styles.label}>{label} :</Text>
// //       {children ?? <Text style={styles.value}>{value || '-'}</Text>}
// //     </View>
// //   );
// // }
//
// // type Props = {
// //   lead: Lead;
// //   onEdit: () => void;
// //   onDelete: () => void;
// //   onCancel: () => void;
// // };
//
// // export default function LeadDetailsSection({ lead, onEdit, onDelete, onCancel }: Props) {
// //   const { width } = useWindowDimensions();
// //   const wide = width >= 900;
// //   const statusesQuery = useLeadStatuses();
// //   const matchedStatus = statusesQuery.data?.find(
// //     (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
// //   );
// //   const statusName = matchedStatus?.name ?? statusLabel(lead.status);
//
// //   return (
// //     <View style={styles.container}>
// //       <View style={[styles.cards, wide && { flexDirection: 'row' }]}>
// //         <Card title="Lead Information" wide={wide}>
// //           <Item label="Name" value={lead.name} />
// //           <Item label="Company Name" value={lead.companyName} />
// //           <Item label="Service" value={lead.service?.name} />
// //           <Item label="Phone" value={lead.phone} />
// //           <Item label="Email Address" value={lead.email} />
// //           <Item label="Address" value={lead.address} />
// //           <Item label="Comment" value={lead.comment} />
// //           <Item label="Reference" value={lead.reference} />
// //         </Card>
//
// //         <Card title="General Information" wide={wide}>
// //           <Item label="Date" value={formatDateTime(lead.createdAt)} />
// //           <Item label="Follow Up Date" value={formatDateTime(lead.nextFollowUpAt)} />
// //           <Item label="Status" value={statusName} />
// //           <Item label="Source" value={sourceLabel(lead.source)} />
// //           <Item label="Labels">
// //             {lead.label ? (
// //               <View style={styles.chip}>
// //                 <Text style={styles.chipText}>{lead.label}</Text>
// //               </View>
// //             ) : (
// //               <Text style={styles.value}>-</Text>
// //             )}
// //           </Item>
// //           <Item label="Estimated Amount" value={formatINR(Number(lead.estimatedAmount))} />
// //           <Item label="Rating">
// //             <Stars value={lead.rating} size={18} />
// //           </Item>
// //           <Item label="Created By" value={lead.createdBy} />
// //           <Item label="Assign To" value={lead.assignedTo} />
// //         </Card>
// //       </View>
//
// //       <View style={styles.btnRow}>
// //         <Button title="Edit Lead" onPress={onEdit} />
// //         <Button title="Delete Lead" variant="danger" onPress={onDelete} />
// //         <Button title="Back to Leads" variant="outline" onPress={onCancel} />
// //       </View>
// //     </View>
// //   );
// // }
//
// // const styles = StyleSheet.create({
// //   container: {
// //     gap: 16,
// //   },
// //   cards: {
// //     gap: 16,
// //   },
// //   card: {
// //     backgroundColor: colors.white,
// //     borderWidth: 1,
// //     borderColor: colors.border,
// //     borderRadius: 8,
// //     overflow: 'hidden',
// //   },
// //   cardHead: {
// //     backgroundColor: colors.navy,
// //     paddingVertical: 12,
// //     alignItems: 'center',
// //   },
// //   cardTitle: {
// //     color: colors.white,
// //     fontWeight: '800',
// //     fontSize: 15,
// //   },
// //   cardBody: {
// //     paddingHorizontal: 16,
// //     paddingVertical: 8,
// //   },
// //   item: {
// //     paddingVertical: 10,
// //     gap: 4,
// //     borderBottomWidth: 1,
// //     borderBottomColor: colors.border,
// //   },
// //   label: {
// //     fontSize: 12,
// //     fontWeight: '800',
// //     color: colors.text,
// //   },
// //   value: {
// //     fontSize: 13,
// //     color: colors.muted,
// //   },
// //   chip: {
// //     alignSelf: 'flex-start',
// //     backgroundColor: colors.primarySoft,
// //     borderRadius: 10,
// //     paddingHorizontal: 8,
// //     paddingVertical: 2,
// //   },
// //   chipText: {
// //     fontSize: 11,
// //     fontWeight: '700',
// //     color: colors.primaryText,
// //   },
// //   btnRow: {
// //     flexDirection: 'row',
// //     justifyContent: 'flex-end',
// //     gap: 10,
// //     flexWrap: 'wrap',
// //   },
// // });
//
//
// // apps/client/src/components/lead/LeadDetailsSection.tsx
// import React from 'react';
// import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Lead, sourceLabel, statusLabel } from '@/types/lead';
// import { useLeadStatuses } from '@/hooks/useLeadStatuses';
// import { formatDateTime, formatINR } from '@/utils/format';
// import { colors } from '@/theme/colors';
// import Button from '@/components/Button';
// import Stars from '@/components/Stars';
//
// function Card({
//   title,
//   icon,
//   wide,
//   children,
// }: {
//   title: string;
//   icon: keyof typeof Ionicons.glyphMap;
//   wide: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <View style={[styles.card, wide && { flex: 1 }]}>
//       <View style={styles.cardHead}>
//         <View style={styles.cardIcon}>
//           <Ionicons name={icon} size={16} color={colors.primaryText} />
//         </View>
//         <Text style={styles.cardTitle}>{title}</Text>
//       </View>
//       <View style={styles.cardBody}>{children}</View>
//     </View>
//   );
// }
//
// function Item({
//   label,
//   value,
//   last,
//   children,
// }: {
//   label: string;
//   value?: string | null;
//   last?: boolean;
//   children?: React.ReactNode;
// }) {
//   return (
//     <View style={[styles.item, last && styles.itemLast]}>
//       <Text style={styles.label}>{label}</Text>
//       {children ?? (
//         <Text style={[styles.value, !value && styles.valueEmpty]}>{value || '—'}</Text>
//       )}
//     </View>
//   );
// }
//
// type Props = {
//   lead: Lead;
//   onEdit: () => void;
//   onDelete: () => void;
//   onCancel: () => void;
// };
//
// export default function LeadDetailsSection({ lead, onEdit, onDelete, onCancel }: Props) {
//   const { width } = useWindowDimensions();
//   const wide = width >= 900;
//   const statusesQuery = useLeadStatuses();
//   const matchedStatus = statusesQuery.data?.find(
//     (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
//   );
//   const statusName = matchedStatus?.name ?? statusLabel(lead.status);
//
//   return (
//     <View style={styles.container}>
//       <View style={[styles.cards, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
//         <Card title="Lead Information" icon="person-outline" wide={wide}>
//           <Item label="Name" value={lead.name} />
//           <Item label="Company Name" value={lead.companyName} />
//           <Item label="Service" value={lead.service?.name} />
//           <Item label="Phone" value={lead.phone} />
//           <Item label="Email Address" value={lead.email} />
//           <Item label="Address" value={lead.address} />
//           <Item label="Comment" value={lead.comment} />
//           <Item label="Reference" value={lead.reference} last />
//         </Card>
//
//         <Card title="General Information" icon="information-circle-outline" wide={wide}>
//           <Item label="Date" value={formatDateTime(lead.createdAt)} />
//           <Item label="Follow Up Date" value={formatDateTime(lead.nextFollowUpAt)} />
//           <Item label="Status" value={statusName} />
//           <Item label="Source" value={sourceLabel(lead.source)} />
//           <Item label="Labels">
//             {lead.label ? (
//               <View style={styles.chip}>
//                 <Text style={styles.chipText}>{lead.label}</Text>
//               </View>
//             ) : (
//               <Text style={[styles.value, styles.valueEmpty]}>—</Text>
//             )}
//           </Item>
//           <Item label="Estimated Amount" value={formatINR(Number(lead.estimatedAmount))} />
//           <Item label="Rating">
//             <Stars value={lead.rating} size={18} />
//           </Item>
//           <Item label="Created By" value={lead.createdBy} />
//           <Item label="Assign To" value={lead.assignedTo} last />
//         </Card>
//       </View>
//
//       <View style={styles.btnRow}>
//         <Button title="Back to Leads" variant="outline" onPress={onCancel} />
//         <Button title="Delete Lead" variant="danger" onPress={onDelete} />
//         <Button title="Edit Lead" onPress={onEdit} />
//       </View>
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: {
//     gap: 16,
//   },
//   cards: {
//     gap: 14,
//   },
//   card: {
//     backgroundColor: colors.white,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   cardHead: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     backgroundColor: '#F8FAFD',
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//   },
//   cardIcon: {
//     width: 28,
//     height: 28,
//     borderRadius: 8,
//     backgroundColor: colors.primarySoft,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cardTitle: {
//     color: colors.text,
//     fontWeight: '800',
//     fontSize: 14,
//   },
//   cardBody: {
//     paddingHorizontal: 16,
//     paddingVertical: 4,
//   },
//   item: {
//     paddingVertical: 11,
//     gap: 3,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEF1F6',
//   },
//   itemLast: {
//     borderBottomWidth: 0,
//   },
//   label: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: colors.muted,
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   value: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: colors.text,
//   },
//   valueEmpty: {
//     color: colors.muted,
//     fontWeight: '400',
//   },
//   chip: {
//     alignSelf: 'flex-start',
//     backgroundColor: colors.primarySoft,
//     borderRadius: 999,
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//   },
//   chipText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
//   btnRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 10,
//     flexWrap: 'wrap',
//   },
// });

// REDESIGN NOTES: compact definition-list rows (label left, value right) instead of tall stacked
// fields, icon card headers, soft empty values, and footer actions ordered by importance
// (primary on the right). Fields and callbacks are unchanged.
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead, sourceLabel, statusLabel } from '@/types/lead';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { formatDateTime, formatINR } from '@/utils/format';
import { colors } from '@/theme/colors';
import Button from '@/components/Button';
import Stars from '@/components/Stars';

function Card({
  title,
  icon,
  wide,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  wide: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, wide && { flex: 1 }]}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={16} color={colors.primaryText} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Item({
  label,
  value,
  last,
  stacked,
  children,
}: {
  label: string;
  value?: string | null;
  last?: boolean;
  stacked: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.item, stacked && styles.itemStacked, last && styles.itemLast]}>
      <Text style={[styles.label, !stacked && styles.labelInline]}>{label}</Text>
      <View style={styles.valueWrap}>
        {children ?? (
          <Text style={[styles.value, !value && styles.valueEmpty]}>{value || '—'}</Text>
        )}
      </View>
    </View>
  );
}

type Props = {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

export default function LeadDetailsSection({ lead, onEdit, onDelete, onCancel }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const stacked = width < 520;
  const statusesQuery = useLeadStatuses();
  const matchedStatus = statusesQuery.data?.find(
    (s) => s.code === lead.status || s.name.toLowerCase() === (lead.status || '').toLowerCase()
  );
  const statusName = matchedStatus?.name ?? statusLabel(lead.status);

  return (
    <View style={styles.container}>
      <View style={[styles.cards, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        <Card title="Lead information" icon="person-outline" wide={wide}>
          <Item stacked={stacked} label="Name" value={lead.name} />
          <Item stacked={stacked} label="Company name" value={lead.companyName} />
          <Item stacked={stacked} label="Service" value={lead.service?.name} />
          <Item stacked={stacked} label="Phone" value={lead.phone} />
          <Item stacked={stacked} label="Email address" value={lead.email} />
          <Item stacked={stacked} label="Address" value={lead.address} />
          <Item stacked={stacked} label="Comment" value={lead.comment} />
          <Item stacked={stacked} label="Reference" value={lead.reference} last />
        </Card>

        <Card title="General information" icon="information-circle-outline" wide={wide}>
          <Item stacked={stacked} label="Date" value={formatDateTime(lead.createdAt)} />
          <Item stacked={stacked} label="Follow up date" value={formatDateTime(lead.nextFollowUpAt)} />
          <Item stacked={stacked} label="Status" value={statusName} />
          <Item stacked={stacked} label="Source" value={sourceLabel(lead.source)} />
          <Item stacked={stacked} label="Labels">
            {lead.label ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{lead.label}</Text>
              </View>
            ) : (
              <Text style={[styles.value, styles.valueEmpty]}>—</Text>
            )}
          </Item>
          <Item stacked={stacked} label="Estimated amount" value={formatINR(Number(lead.estimatedAmount))} />
          <Item stacked={stacked} label="Rating">
            <Stars value={lead.rating} size={18} />
          </Item>
          <Item stacked={stacked} label="Created by" value={lead.createdBy} />
          <Item stacked={stacked} label="Assign to" value={lead.assignedTo} last />
        </Card>
      </View>

      <View style={styles.btnRow}>
        <Button title="Back to Leads" variant="outline" onPress={onCancel} />
        <Button title="Delete Lead" variant="danger" onPress={onDelete} />
        <Button title="Edit Lead" onPress={onEdit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  cards: { gap: 14 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFD',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 14.5 },
  cardBody: { paddingHorizontal: 16, paddingVertical: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F6',
  },
  itemStacked: { flexDirection: 'column', gap: 3 },
  itemLast: { borderBottomWidth: 0 },
  label: { fontSize: 12.5, fontWeight: '600', color: colors.muted },
  labelInline: { width: 128, flexShrink: 0, paddingTop: 1 },
  valueWrap: { flex: 1, minWidth: 0 },
  value: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20 },
  valueEmpty: { color: colors.muted, fontWeight: '400' },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.primaryText },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
    paddingTop: 4,
  },
});
