// // apps/client/src/components/lead/LeadActionBar.tsx
// import React from 'react';
// import { StyleSheet, Text, View, Pressable } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { colors } from '@/theme/colors';
// import ConvertLeadAction from './ConvertLeadAction';
// import { usePermissions } from '@/hooks/usePermissions';
// import type { ModulePermission } from '@/hooks/usePermissions';

// type Props = {
//   leadId: string;
//   onCustomerOpen?: () => void;
//   onAddFollowUp: () => void;
//   onAddReminder: () => void;
//   onAddMeeting: () => void;
//   onCreateQuotation: () => void;
//   onCreateInvoice: () => void;
// };

// interface ActionItem {
//   key: string;
//   permission: ModulePermission;
//   label: string;
//   icon: keyof typeof Ionicons.glyphMap;
//   onPress: () => void;
//   primary?: boolean;
// }

// export default function LeadActionBar({
//   leadId, onCustomerOpen, onAddFollowUp, onAddReminder,
//   onAddMeeting, onCreateQuotation, onCreateInvoice,
// }: Props) {
//   const { canAccess } = usePermissions();
//   const actions: ActionItem[] = [
//     { key: 'followup', permission: 'lead', label: 'Add FollowUp', icon: 'call-outline', onPress: onAddFollowUp },
//     { key: 'reminder', permission: 'reminder', label: 'Add Reminder', icon: 'alarm-outline', onPress: onAddReminder },
//     { key: 'meeting', permission: 'meeting', label: 'Add Meeting', icon: 'calendar-outline', onPress: onAddMeeting },
//     { key: 'quotation', permission: 'invoice', label: 'Create Quotation', icon: 'document-text-outline', onPress: onCreateQuotation },
//     { key: 'invoice', permission: 'invoice', label: 'Create Invoice', icon: 'receipt-outline', onPress: onCreateInvoice, primary: true },
//   ];

//   return (
//     <View style={styles.container}>
//       <Text style={styles.sectionHeading}>Quick Actions</Text>
//       <View style={styles.actionsRow}>
//         {canAccess('customer') ? <ConvertLeadAction key={leadId} leadId={leadId} onCustomerOpen={onCustomerOpen} /> : null}
//         {actions.filter(item => canAccess(item.permission)).map(item => (
//           <React.Fragment key={item.key}>
//             <Pressable
//               accessibilityRole="button"
//               accessibilityLabel={item.label}
//               onPress={item.onPress}
//               style={({ pressed }) => [
//                 styles.actionBtn,
//                 item.primary ? styles.primaryBtn : styles.outlineBtn,
//                 pressed && styles.pressedBtn,
//               ]}
//             >
//               <Ionicons name={item.icon} size={16} color={item.primary ? colors.white : colors.primaryText} />
//               <Text style={[styles.actionText, item.primary ? styles.primaryText : styles.outlineText]}>
//                 {item.label}
//               </Text>
//             </Pressable>
//           </React.Fragment>
//         ))}
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
//     borderRadius: 8, padding: 12, gap: 8,
//   },
//   sectionHeading: {
//     fontSize: 12, fontWeight: '700', color: colors.muted,
//     textTransform: 'uppercase', letterSpacing: 0.5,
//   },
//   actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
//   actionBtn: {
//     flexDirection: 'row', alignItems: 'center', gap: 6,
//     paddingHorizontal: 12, paddingVertical: 9, borderRadius: 6, minHeight: 38,
//   },
//   outlineBtn: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
//   primaryBtn: { backgroundColor: colors.accent },
//   pressedBtn: { opacity: 0.8 },
//   actionText: { fontSize: 13, fontWeight: '700' },
//   outlineText: { color: colors.primaryText },
//   primaryText: { color: colors.white },
// });


// apps/client/src/components/lead/LeadActionBar.tsx
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import ConvertLeadAction from './ConvertLeadAction';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModulePermission } from '@/hooks/usePermissions';

type Props = {
  leadId: string;
  onCustomerOpen?: () => void;
  onAddFollowUp: () => void;
  onAddReminder: () => void;
  onAddMeeting: () => void;
  onCreateQuotation: () => void;
  onCreateInvoice: () => void;
};

interface ActionItem {
  key: string;
  permission: ModulePermission;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  primary?: boolean;
}

export default function LeadActionBar({
  leadId, onCustomerOpen, onAddFollowUp, onAddReminder,
  onAddMeeting, onCreateQuotation, onCreateInvoice,
}: Props) {
  const { canAccess } = usePermissions();
  const actions: ActionItem[] = [
    { key: 'followup', permission: 'lead', label: 'Add FollowUp', icon: 'call-outline', onPress: onAddFollowUp },
    { key: 'reminder', permission: 'reminder', label: 'Add Reminder', icon: 'alarm-outline', onPress: onAddReminder },
    { key: 'meeting', permission: 'meeting', label: 'Add Meeting', icon: 'calendar-outline', onPress: onAddMeeting },
    { key: 'quotation', permission: 'invoice', label: 'Create Quotation', icon: 'document-text-outline', onPress: onCreateQuotation },
    { key: 'invoice', permission: 'invoice', label: 'Create Invoice', icon: 'receipt-outline', onPress: onCreateInvoice, primary: true },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Ionicons name="flash-outline" size={14} color={colors.muted} />
        <Text style={styles.sectionHeading}>Quick Actions</Text>
      </View>
      <View style={styles.actionsRow}>
        {canAccess('customer') ? <ConvertLeadAction key={leadId} leadId={leadId} onCustomerOpen={onCustomerOpen} /> : null}
        {actions.filter(item => canAccess(item.permission)).map(item => (
          <React.Fragment key={item.key}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.actionBtn,
                item.primary ? styles.primaryBtn : styles.outlineBtn,
                pressed && styles.pressedBtn,
              ]}
            >
              <Ionicons name={item.icon} size={16} color={item.primary ? colors.white : colors.primaryText} />
              <Text style={[styles.actionText, item.primary ? styles.primaryText : styles.outlineText]}>
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeading: {
    fontSize: 11, fontWeight: '800', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, minHeight: 40,
  },
  outlineBtn: { backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.accent },
  pressedBtn: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  actionText: { fontSize: 13, fontWeight: '700' },
  outlineText: { color: colors.primaryText },
  primaryText: { color: colors.white },
});
