// import React, { useState } from 'react';
// import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Href, usePathname, useRouter } from 'expo-router';
// import { colors } from '@/theme/colors';
// import { useAuth } from '@/context/AuthContext';
// import Button from './Button';

// export default function Sidebar({ horizontal }: { horizontal: boolean }) {
//   const { userName, role, permissions, logout } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [invoiceExpanded, setInvoiceExpanded] = useState(true);
//   const [settingsExpanded, setSettingsExpanded] = useState(true);

//   const hasAccess = (module: 'lead' | 'reminder' | 'meeting' | 'task' | 'note' | 'calendar' | 'customer' | 'invoice' | 'staff' | 'leave') => {
//     if (role === 'admin') return true;
//     if (role === 'staff') {
//       return Boolean(permissions?.[module]);
//     }
//     return false;
//   };


//   const isDashboard = pathname === '/';
//   const isLead = pathname === '/leads' || pathname.startsWith('/lead/');
//   const isReminder = pathname === '/reminders';
//   const isMeeting = pathname === '/meetings';
//   const isTask = pathname === '/tasks';
//   const isNote = pathname === '/notes';
//   const isCalendar = pathname === '/calendar';
//   const isCustomer = pathname === '/customers' || pathname.startsWith('/customer/');
//   const isInvoiceList = pathname === '/invoice';
//   const isInvoiceAdd = pathname === '/invoice/add';
//   const isQuotation = pathname === '/invoice/quotation';
//   const isPaymentMethod = pathname === '/invoice/payment-method';
//   const isBrochure = pathname === '/invoice/brochure';
//   const isAnyInvoice = pathname.startsWith('/invoice');
//   const isStaff = pathname === '/staff';
//   const isLeave = pathname === '/leave';
//   const isWebSettings = pathname === '/settings/web' || pathname === '/settings/invoices';
//   const isLeadSettings = pathname === '/settings/leads';
//   const isAnySettings = isWebSettings || isLeadSettings;

//   const menuItems = [
//     {
//       key: 'dashboard',
//       label: 'Dashboard',
//       icon: 'business-outline' as const,
//       active: isDashboard,
//       onPress: () => router.replace('/'),
//       visible: true,
//     },
//     {
//       key: 'leads',
//       label: 'Lead',
//       icon: 'funnel-outline' as const,
//       active: isLead,
//       onPress: () => router.replace('/leads'),
//       visible: hasAccess('lead'),
//     },
//     {
//       key: 'reminders',
//       label: 'Reminder',
//       icon: 'alarm-outline' as const,
//       active: isReminder,
//       onPress: () => router.replace('/reminders'),
//       visible: hasAccess('reminder'),
//     },
//     {
//       key: 'meetings',
//       label: 'Meeting',
//       icon: 'headset-outline' as const,
//       active: isMeeting,
//       onPress: () => router.replace('/meetings'),
//       visible: hasAccess('meeting'),
//     },
//   ].filter(i => i.visible);

//   const productivityItems = [
//     {
//       key: 'tasks',
//       label: 'Task',
//       icon: 'checkbox-outline' as const,
//       active: isTask,
//       onPress: () => router.replace('/tasks'),
//       visible: hasAccess('task'),
//     },
//     {
//       key: 'notes',
//       label: 'Notes',
//       icon: 'bookmark-outline' as const,
//       active: isNote,
//       onPress: () => router.replace('/notes'),
//       visible: hasAccess('note'),
//     },
//     {
//       key: 'calendar',
//       label: 'Calendar',
//       icon: 'calendar-outline' as const,
//       active: isCalendar,
//       onPress: () => router.replace('/calendar'),
//       visible: hasAccess('calendar'),
//     },
//   ].filter(i => i.visible);

//   const showCustomer = hasAccess('customer');
//   const showInvoice = hasAccess('invoice');
//   const showBusiness = showCustomer || showInvoice;
//   const showStaff = hasAccess('staff');
//   const showLeave = hasAccess('leave');
//   const showHr = showStaff || showLeave;

//   return (
//     <View style={[styles.base, horizontal ? styles.bar : styles.side]}>
//       <View style={styles.logoRow}>
//         <View style={styles.logoBox}>
//           <Image
//             source={require('../../assets/images/image.png')}
//             style={styles.logoImg}
//             resizeMode="contain"
//           />
//         </View>
//         <Text style={styles.brand} numberOfLines={1}>Shivora Technologies</Text>
//       </View>

//       <ScrollView
//         style={horizontal ? undefined : styles.menuScroll}
//         contentContainerStyle={horizontal ? styles.menuH : styles.menuV}
//         scrollEnabled={!horizontal}
//         showsVerticalScrollIndicator={false}
//       >
//         {!horizontal && menuItems.length > 0 && <Text style={styles.sectionHeading}>MAIN</Text>}
//         {menuItems.map((item) => (
//           <Pressable
//             key={item.key}
//             accessibilityRole="button"
//             accessibilityLabel={item.label}
//             style={[
//               styles.item,
//               item.active ? styles.activeItem : styles.inactiveItem,
//             ]}
//             onPress={item.onPress}
//           >
//             <Ionicons
//               name={item.icon}
//               size={19}
//               color={item.active ? colors.white : '#432D40'}
//             />
//             <Text
//               style={[
//                 styles.itemText,
//                 item.active ? styles.activeItemText : styles.inactiveItemText,
//               ]}
//             >
//               {item.label}
//             </Text>
//           </Pressable>
//         ))}

//         {!horizontal && productivityItems.length > 0 && (
//           <Text style={[styles.sectionHeading, styles.productivityHeading]}>PRODUCTIVITY</Text>
//         )}
//         {productivityItems.map((item) => (
//           <Pressable
//             key={item.key}
//             accessibilityRole="button"
//             accessibilityLabel={item.label}
//             style={[styles.item, item.active ? styles.activeItem : styles.inactiveItem]}
//             onPress={item.onPress}
//           >
//             <Ionicons name={item.icon} size={19} color={item.active ? colors.white : '#432D40'} />
//             <Text style={[styles.itemText, item.active ? styles.activeItemText : styles.inactiveItemText]}>{item.label}</Text>
//           </Pressable>
//         ))}

//         {!horizontal && showBusiness && (
//           <Text style={[styles.sectionHeading, styles.productivityHeading]}>BUSINESS</Text>
//         )}
//         {showCustomer && (
//           <Pressable
//             accessibilityRole="button"
//             accessibilityLabel="Customer"
//             accessibilityState={{ selected: isCustomer }}
//             style={[styles.item, isCustomer ? styles.activeItem : styles.inactiveItem]}
//             onPress={() => router.replace('/customers' as Href)}
//           >
//             <Ionicons name="people-outline" size={19} color={isCustomer ? colors.white : '#432D40'} />
//             <Text style={[styles.itemText, isCustomer ? styles.activeItemText : styles.inactiveItemText]}>
//               Customer
//             </Text>
//           </Pressable>
//         )}

//         {/* Invoice Accordion */}
//         {showInvoice && (
//           <Pressable
//             accessibilityRole="button"
//             accessibilityLabel="Invoice"
//             accessibilityState={{ selected: isAnyInvoice, expanded: invoiceExpanded }}
//             style={[styles.item, isAnyInvoice && !invoiceExpanded ? styles.activeItem : styles.inactiveItem]}
//             onPress={() => {
//               if (horizontal) {
//                 router.replace('/invoice' as Href);
//               } else {
//                 setInvoiceExpanded(!invoiceExpanded);
//               }
//             }}
//           >
//             <Ionicons
//               name="receipt-outline"
//               size={19}
//               color={isAnyInvoice && !invoiceExpanded ? colors.white : '#432D40'}
//             />
//             <Text
//               style={[
//                 styles.itemText,
//                 { flex: 1 },
//                 isAnyInvoice && !invoiceExpanded ? styles.activeItemText : styles.inactiveItemText,
//               ]}
//             >
//               Invoice
//             </Text>
//             {!horizontal && (
//               <Ionicons
//                 name={invoiceExpanded ? 'chevron-up' : 'chevron-down'}
//                 size={16}
//                 color={isAnyInvoice && !invoiceExpanded ? colors.white : '#56627C'}
//               />
//             )}
//           </Pressable>
//         )}

//         {/* Invoice Sub-Items */}
//         {!horizontal && showInvoice && invoiceExpanded && (
//           <View style={styles.subItemContainer}>
//             {[
//               { key: 'list', label: 'List', path: '/invoice' as Href, active: isInvoiceList },
//               { key: 'add', label: 'Add', path: '/invoice/add' as Href, active: isInvoiceAdd },
//               { key: 'quotation', label: 'Quotation', path: '/invoice/quotation' as Href, active: isQuotation },
//               { key: 'payment-method', label: 'Payment Method', path: '/invoice/payment-method' as Href, active: isPaymentMethod },
//               { key: 'brochure', label: 'Brochure', path: '/invoice/brochure' as Href, active: isBrochure },
//             ].map((sub) => (
//               <Pressable
//                 key={sub.key}
//                 accessibilityRole="button"
//                 accessibilityLabel={sub.label}
//                 style={[styles.subItem, sub.active ? styles.activeSubItem : null]}
//                 onPress={() => router.replace(sub.path)}
//               >
//                 <View style={[styles.subItemDot, sub.active ? styles.activeSubItemDot : null]} />
//                 <Text
//                   style={[
//                     styles.subItemText,
//                     sub.active ? styles.activeSubItemText : styles.inactiveSubItemText,
//                   ]}
//                 >
//                   {sub.label}
//                 </Text>
//               </Pressable>
//             ))}
//           </View>
//         )}

//         {!horizontal && showHr && (
//           <Text style={[styles.sectionHeading, styles.productivityHeading]}>HR</Text>
//         )}
//         {showStaff && (
//           <Pressable
//             accessibilityRole="button"
//             accessibilityLabel="Staff"
//             accessibilityState={{ selected: isStaff }}
//             style={[styles.item, isStaff ? styles.activeItem : styles.inactiveItem]}
//             onPress={() => router.replace('/staff' as Href)}
//           >
//             <Ionicons name="people-outline" size={19} color={isStaff ? colors.white : '#432D40'} />
//             <Text style={[styles.itemText, isStaff ? styles.activeItemText : styles.inactiveItemText]}>
//               Staff
//             </Text>
//           </Pressable>
//         )}
//         {showLeave && (
//           <Pressable
//             accessibilityRole="button"
//             accessibilityLabel="Leave"
//             accessibilityState={{ selected: isLeave }}
//             style={[styles.item, isLeave ? styles.activeItem : styles.inactiveItem]}
//             onPress={() => router.replace('/leave' as Href)}
//           >
//             <Ionicons name="calendar-outline" size={19} color={isLeave ? colors.white : '#432D40'} />
//             <Text style={[styles.itemText, isLeave ? styles.activeItemText : styles.inactiveItemText]}>
//               Leave
//             </Text>
//           </Pressable>
//         )}
//         {role === 'admin' && (
//           <>
//             {!horizontal && <Text style={[styles.sectionHeading, styles.productivityHeading]}>TOOLS & SETTINGS</Text>}
//             <Pressable
//               accessibilityRole="button"
//               accessibilityLabel="General Settings"
//               accessibilityState={{ expanded: settingsExpanded, selected: isAnySettings }}
//               style={[styles.item, isAnySettings && (horizontal || !settingsExpanded) ? styles.activeItem : styles.inactiveItem]}
//               onPress={() => horizontal ? router.replace('/settings/web' as Href) : setSettingsExpanded(value => !value)}
//             >
//               <Ionicons name="settings-outline" size={19} color={isAnySettings && (horizontal || !settingsExpanded) ? colors.white : '#432D40'} />
//               <Text style={[styles.itemText, { flex: 1 }, isAnySettings && (horizontal || !settingsExpanded) ? styles.activeItemText : styles.inactiveItemText]}>General Settings</Text>
//               {!horizontal && <Ionicons name={settingsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#56627C" />}
//             </Pressable>
//             {!horizontal && settingsExpanded && (
//               <View style={styles.subItemContainer}>
//                 <Pressable
//                   accessibilityRole="button"
//                   accessibilityLabel="Web Settings"
//                   accessibilityState={{ selected: isWebSettings }}
//                   style={[styles.subItem, isWebSettings && styles.activeItem]}
//                   onPress={() => router.replace('/settings/web' as Href)}
//                 >
//                   <Ionicons name="globe-outline" size={16} color={isWebSettings ? colors.white : '#56627C'} />
//                   <Text style={[styles.subItemText, isWebSettings ? styles.activeItemText : styles.inactiveSubItemText]}>Web Settings</Text>
//                 </Pressable>
//                 <Pressable
//                   accessibilityRole="button"
//                   accessibilityLabel="Lead Settings"
//                   accessibilityState={{ selected: isLeadSettings }}
//                   style={[styles.subItem, isLeadSettings && styles.activeItem]}
//                   onPress={() => router.replace('/settings/leads' as Href)}
//                 >
//                   <Ionicons name="funnel-outline" size={16} color={isLeadSettings ? colors.white : '#56627C'} />
//                   <Text style={[styles.subItemText, isLeadSettings ? styles.activeItemText : styles.inactiveSubItemText]}>Lead Settings</Text>
//                 </Pressable>
//               </View>
//             )}
//           </>
//         )}
//       </ScrollView>

//       <View style={horizontal ? styles.userH : styles.userV}>
//         {!horizontal && (
//           <View style={{ gap: 2 }}>
//             <Text style={styles.userName}>{userName}</Text>
//             <Text style={styles.userRoleBadge}>{role === 'staff' ? 'Staff' : 'Admin'}</Text>
//           </View>
//         )}
//         <Button title="Sign Out" variant="outline" onPress={logout} />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   base: { backgroundColor: colors.white, borderColor: colors.border },
//   side: { width: 220, borderRightWidth: 1, padding: 16 },
//   bar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     borderBottomWidth: 1,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     gap: 8,
//   },
//   logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
//   logoBox: {
//     width: 40, height: 40, borderRadius: 6,
//     overflow: 'hidden',
//     backgroundColor: colors.white,
//     alignItems: 'center', justifyContent: 'center',
//   },
//   logoImg: { width: 40, height: 40 },
//   brand: { fontSize: 14, fontWeight: '800', color: colors.text, flexShrink: 1 },
//   menuScroll: { flex: 1 },
//   menuV: { marginTop: 24, gap: 6, paddingBottom: 12 },
//   menuH: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
//   sectionHeading: {
//     fontSize: 11,
//     fontWeight: '800',
//     color: '#3E2D8E',
//     letterSpacing: 0.8,
//     marginBottom: 6,
//     marginLeft: 4,
//   },
//   productivityHeading: { marginTop: 14 },
//   item: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//   },
//   inactiveItem: {
//     backgroundColor: 'transparent',
//   },
//   activeItem: {
//     backgroundColor: '#372A8B',
//     ...({
//       backgroundImage: 'linear-gradient(90deg, #372A8B 0%, #C72588 100%)',
//     } as any),
//     boxShadow: '0 2px 6px rgba(55, 42, 139, 0.25)',
//   },
//   itemText: {
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   inactiveItemText: {
//     color: '#432D40',
//   },
//   activeItemText: {
//     color: colors.white,
//     fontWeight: '700',
//   },
//   userV: { gap: 10 },
//   userH: {},
//   userName: { color: colors.muted, fontSize: 13, fontWeight: '700' },
//   userRoleBadge: {
//     color: '#372A8B',
//     fontSize: 10,
//     fontWeight: '800',
//     textTransform: 'uppercase',
//     letterSpacing: 0.6,
//   },
//   subItemContainer: {
//     paddingLeft: 20,
//     gap: 3,
//     marginTop: 2,
//     marginBottom: 6,
//   },
//   subItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     paddingVertical: 7,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//   },
//   activeSubItem: {
//     backgroundColor: '#E4EFFD',
//   },
//   subItemDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#8C98A9',
//   },
//   activeSubItemDot: {
//     backgroundColor: '#0B2F7D',
//     width: 7,
//     height: 7,
//     borderRadius: 3.5,
//   },
//   subItemText: {
//     fontSize: 13,
//   },
//   inactiveSubItemText: {
//     color: '#56627C',
//     fontWeight: '500',
//   },
//   activeSubItemText: {
//     color: '#0B2F7D',
//     fontWeight: '700',
//   },
// });


import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import Button from './Button';

type Module =
  | 'lead' | 'reminder' | 'meeting' | 'task'
  | 'note' | 'calendar' | 'customer' | 'invoice'
  | 'staff' | 'leave';

export default function Sidebar({ horizontal }: { horizontal: boolean }) {
  const { userName, role, permissions, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [invoiceExpanded, setInvoiceExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  const hasAccess = (module: Module) => {
    if (role === 'admin') return true;
    if (role === 'staff') return Boolean(permissions?.[module]);
    return false;
  };

  const isDashboard = pathname === '/';
  const isLead = pathname === '/leads' || pathname.startsWith('/lead/');
  const isReminder = pathname === '/reminders';
  const isMeeting = pathname === '/meetings';
  const isTask = pathname === '/tasks';
  const isNote = pathname === '/notes';
  const isCalendar = pathname === '/calendar';
  const isCustomer = pathname === '/customers' || pathname.startsWith('/customer/');
  const isInvoiceList = pathname === '/invoice';
  const isInvoiceAdd = pathname === '/invoice/add';
  const isQuotation = pathname === '/invoice/quotation';
  const isPaymentMethod = pathname === '/invoice/payment-method';
  const isBrochure = pathname === '/invoice/brochure';
  const isAnyInvoice = pathname.startsWith('/invoice');
  const isStaff = pathname === '/staff';
  const isLeave = pathname === '/leave';
  const isWebSettings = pathname === '/settings/web' || pathname === '/settings/invoices';
  const isLeadSettings = pathname === '/settings/leads';
  const isAnySettings = isWebSettings || isLeadSettings;

  type NavEntry = {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    active: boolean;
    onPress: () => void;
    visible: boolean;
  };

  const mainItems: NavEntry[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', active: isDashboard, onPress: () => router.replace('/'), visible: true },
    { key: 'leads', label: 'Lead', icon: 'funnel-outline', active: isLead, onPress: () => router.replace('/leads'), visible: hasAccess('lead') },
    { key: 'reminders', label: 'Reminder', icon: 'alarm-outline', active: isReminder, onPress: () => router.replace('/reminders'), visible: hasAccess('reminder') },
    { key: 'meetings', label: 'Meeting', icon: 'headset-outline', active: isMeeting, onPress: () => router.replace('/meetings'), visible: hasAccess('meeting') },
  ].filter(i => i.visible);

  const productivityItems: NavEntry[] = [
    { key: 'tasks', label: 'Task', icon: 'checkbox-outline', active: isTask, onPress: () => router.replace('/tasks'), visible: hasAccess('task') },
    { key: 'notes', label: 'Notes', icon: 'bookmark-outline', active: isNote, onPress: () => router.replace('/notes'), visible: hasAccess('note') },
    { key: 'calendar', label: 'Calendar', icon: 'calendar-outline', active: isCalendar, onPress: () => router.replace('/calendar'), visible: hasAccess('calendar') },
  ].filter(i => i.visible);

  const showCustomer = hasAccess('customer');
  const showInvoice = hasAccess('invoice');
  const showBusiness = showCustomer || showInvoice;
  const showStaff = hasAccess('staff');
  const showLeave = hasAccess('leave');
  const showHr = showStaff || showLeave;

  const renderNav = (item: NavEntry) => (
    <Pressable
      key={item.key}
      accessibilityRole="link"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: item.active }}
      onPress={item.onPress}
      style={(state) => {
        const hovered = (state as any).hovered === true;
        return [
          s.link,
          { minHeight: horizontal ? 40 : 38 },
          item.active ? s.linkActive : (hovered || state.pressed) && s.linkHover,
        ];
      }}
    >
      <View style={[s.rail, item.active && s.railActive]} />
      <Ionicons name={item.icon} size={19} color={item.active ? C.accent : C.icon} />
      <Text
        numberOfLines={1}
        style={[s.linkLabel, { color: item.active ? C.accent : C.text, fontWeight: item.active ? '700' : '600' }]}
      >
        {item.label}
      </Text>
    </Pressable>
  );

  const groupLabel = (text: string, top: boolean) =>
    !horizontal ? (
      <Text style={[s.groupLabel, top && s.groupGap]}>{text}</Text>
    ) : null;

  return (
    <View style={[s.base, horizontal ? s.bar : styles.side]}>
      {/* Brand lockup — serif wordmark like ERP, CRM colors */}
      <View style={s.brand}>
        <View style={s.logoTile}>
          <Image
            source={require('../../assets/images/image.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>
        <View style={s.brandText}>
          <Text numberOfLines={1} style={s.wordmark}>SHIVORA</Text>
          <Text numberOfLines={1} style={s.wordmarkSub}>TECHNOLOGIES</Text>
        </View>
      </View>

      <ScrollView
        style={horizontal ? undefined : styles.menuScroll}
        contentContainerStyle={horizontal ? styles.menuH : styles.menuV}
        scrollEnabled={!horizontal}
        showsVerticalScrollIndicator={false}
      >
        {mainItems.length > 0 && groupLabel('Main', false)}
        {mainItems.map(renderNav)}

        {productivityItems.length > 0 && groupLabel('Productivity', true)}
        {productivityItems.map(renderNav)}

        {showBusiness && groupLabel('Business', true)}

        {showCustomer && renderNav({
          key: 'customer',
          label: 'Customer',
          icon: 'people-outline',
          active: isCustomer,
          onPress: () => router.replace('/customers' as Href),
          visible: true,
        })}

        {/* Invoice accordion */}
        {showInvoice && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Invoice"
            accessibilityState={{ selected: isAnyInvoice, expanded: invoiceExpanded }}
            onPress={() => (horizontal ? router.replace('/invoice' as Href) : setInvoiceExpanded(v => !v))}
            style={(state) => {
              const hovered = (state as any).hovered === true;
              return [
                s.link,
                { minHeight: 38 },
                isAnyInvoice && !invoiceExpanded ? s.linkActive : (hovered || state.pressed) && s.linkHover,
              ];
            }}
          >
            <View style={[s.rail, isAnyInvoice && !invoiceExpanded && s.railActive]} />
            <Ionicons name="receipt-outline" size={19} color={isAnyInvoice && !invoiceExpanded ? C.accent : C.icon} />
            <Text
              numberOfLines={1}
              style={[
                s.linkLabel,
                { flex: 1, color: isAnyInvoice && !invoiceExpanded ? C.accent : C.text, fontWeight: isAnyInvoice && !invoiceExpanded ? '700' : '600' },
              ]}
            >
              Invoice
            </Text>
            {!horizontal && (
              <Ionicons
                name={invoiceExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={C.muted}
              />
            )}
          </Pressable>
        )}

        {/* Invoice sub-items — ERP nav style, CRM soft purple */}
        {!horizontal && showInvoice && invoiceExpanded && (
          <View style={s.subWrap}>
            {([
              { key: 'list', label: 'List', path: '/invoice' as Href, active: isInvoiceList },
              { key: 'add', label: 'Add', path: '/invoice/add' as Href, active: isInvoiceAdd },
              { key: 'quotation', label: 'Quotation', path: '/invoice/quotation' as Href, active: isQuotation },
              { key: 'payment-method', label: 'Payment Method', path: '/invoice/payment-method' as Href, active: isPaymentMethod },
              { key: 'brochure', label: 'Brochure', path: '/invoice/brochure' as Href, active: isBrochure },
            ] as const).map(sub => (
              <Pressable
                key={sub.key}
                accessibilityRole="link"
                accessibilityLabel={sub.label}
                accessibilityState={{ selected: sub.active }}
                onPress={() => router.replace(sub.path)}
                style={(state) => {
                  const hovered = (state as any).hovered === true;
                  return [
                    s.link,
                    s.subLink,
                    { minHeight: 34 },
                    sub.active ? s.subLinkActive : (hovered || state.pressed) && s.linkHover,
                  ];
                }}
              >
                <View style={[s.rail, sub.active && s.railActive]} />
                <View style={[s.subDot, sub.active && s.subDotActive]} />
                <Text
                  numberOfLines={1}
                  style={[s.subLabel, { color: sub.active ? C.accent : C.muted, fontWeight: sub.active ? '700' : '500' }]}
                >
                  {sub.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {showHr && groupLabel('HR', true)}

        {showStaff && renderNav({
          key: 'staff',
          label: 'Staff',
          icon: 'people-outline',
          active: isStaff,
          onPress: () => router.replace('/staff' as Href),
          visible: true,
        })}

        {showLeave && renderNav({
          key: 'leave',
          label: 'Leave',
          icon: 'calendar-outline',
          active: isLeave,
          onPress: () => router.replace('/leave' as Href),
          visible: true,
        })}

        {role === 'admin' && (
          <>
            {groupLabel('Tools & Settings', true)}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="General Settings"
              accessibilityState={{ expanded: settingsExpanded, selected: isAnySettings }}
              onPress={() => (horizontal ? router.replace('/settings/web' as Href) : setSettingsExpanded(v => !v))}
              style={(state) => {
                const hovered = (state as any).hovered === true;
                return [
                  s.link,
                  { minHeight: 38 },
                  isAnySettings && (horizontal || !settingsExpanded) ? s.linkActive : (hovered || state.pressed) && s.linkHover,
                ];
              }}
            >
              <View style={[s.rail, isAnySettings && (horizontal || !settingsExpanded) && s.railActive]} />
              <Ionicons name="settings-outline" size={19} color={isAnySettings && (horizontal || !settingsExpanded) ? C.accent : C.icon} />
              <Text
                numberOfLines={1}
                style={[
                  s.linkLabel,
                  { flex: 1, color: isAnySettings && (horizontal || !settingsExpanded) ? C.accent : C.text, fontWeight: isAnySettings && (horizontal || !settingsExpanded) ? '700' : '600' },
                ]}
              >
                General Settings
              </Text>
              {!horizontal && <Ionicons name={settingsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />}
            </Pressable>

            {!horizontal && settingsExpanded && (
              <View style={s.subWrap}>
                {([
                  { key: 'web', label: 'Web Settings', icon: 'globe-outline' as const, path: '/settings/web' as Href, active: isWebSettings },
                  { key: 'leads', label: 'Lead Settings', icon: 'funnel-outline' as const, path: '/settings/leads' as Href, active: isLeadSettings },
                ] as const).map(sub => (
                  <Pressable
                    key={sub.key}
                    accessibilityRole="link"
                    accessibilityLabel={sub.label}
                    accessibilityState={{ selected: sub.active }}
                    onPress={() => router.replace(sub.path)}
                    style={(state) => {
                      const hovered = (state as any).hovered === true;
                      return [
                        s.link,
                        s.subLink,
                        { minHeight: 34 },
                        sub.active ? s.subLinkActive : (hovered || state.pressed) && s.linkHover,
                      ];
                    }}
                  >
                    <View style={[s.rail, sub.active && s.railActive]} />
                    <Ionicons name={sub.icon} size={16} color={sub.active ? C.accent : C.muted} />
                    <Text
                      numberOfLines={1}
                      style={[s.subLabel, { color: sub.active ? C.accent : C.muted, fontWeight: sub.active ? '700' : '500' }]}
                    >
                      {sub.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer — ERP style: avatar + name + role + sign out */}
      <View style={styles.footer}>
        <View style={s.avatar}>
          <Text style={s.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={s.profileText}>
          <Text numberOfLines={1} style={s.userName}>{userName}</Text>
          <Text numberOfLines={1} style={s.userRole}>{role === 'staff' ? 'Staff' : 'Admin'}</Text>
        </View>
        <Button title="Sign Out" variant="outline" onPress={logout} />
      </View>
    </View>
  );
}

// CRM color tokens kept as-is
const C = {
  accent: '#372A8B',       // active icon / text
  accentSoft: '#ECE9F7',   // soft active background (CRM-tinted)
  text: '#432D40',         // inactive label
  icon: '#432D40',         // inactive icon
  muted: '#56627C',        // chevrons / sub text
  heading: '#3E2D8E',      // section headings
  sidebar: '#FAFBFD',      // sidebar bg (your color099)
  border: '#242424',       // outline (your color089)
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  side: {
    width: 228,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 228,
    borderRightWidth: 1,
    paddingVertical: 18,
  },
  menuScroll: { flex: 1 },
  menuV: { paddingHorizontal: 10, paddingBottom: 16, marginTop: 8 },
  menuH: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECE9F7',
  },
});

const s = StyleSheet.create({
  base: { backgroundColor: C.sidebar, borderColor: C.border, flex: 1 },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },

  // Brand
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  logoTile: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECE9F7',
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 32, height: 32 },
  brandText: { flex: 1, minWidth: 0 },
  wordmark: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.6,
    lineHeight: 20,
    color: C.accent,
  },
  wordmarkSub: {
    fontSize: 8.5,
    letterSpacing: 2.6,
    lineHeight: 11,
    marginTop: 1,
    color: C.muted,
  },

  // Group
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.heading,
    marginBottom: 4,
    paddingLeft: 12,
  },
  groupGap: { marginTop: 18 },

  // Nav item
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
    paddingRight: 10,
    marginBottom: 1,
    borderRadius: 8,
  },
  linkActive: { backgroundColor: C.accentSoft },
  linkHover: { backgroundColor: '#F4F2FA' },

  // Left rail — ERP signature
  rail: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  railActive: { backgroundColor: C.accent },

  linkLabel: { flex: 1, fontSize: 13.5 },

  // Sub-items
  subWrap: { paddingLeft: 16, marginTop: 2, marginBottom: 6 },
  subLink: { gap: 10, paddingLeft: 16 },
  subLinkActive: { backgroundColor: C.accentSoft },
  subDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8C98A9',
  },
  subDotActive: { backgroundColor: C.accent },
  subLabel: { fontSize: 13 },

  // Footer
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: C.white, fontWeight: '700', fontSize: 13 },
  profileText: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: '600', color: C.text },
  userRole: { fontSize: 12, marginTop: 1, color: C.muted },
});

