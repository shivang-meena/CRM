import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Href, usePathname, useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import Button from './Button';

export default function Sidebar({ horizontal }: { horizontal: boolean }) {
  const { userName, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [invoiceExpanded, setInvoiceExpanded] = useState(true);

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

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'business-outline' as const,
      active: isDashboard,
      onPress: () => router.replace('/'),
    },
    {
      key: 'leads',
      label: 'Lead',
      icon: 'funnel-outline' as const,
      active: isLead,
      onPress: () => router.replace('/leads'),
    },
    {
      key: 'reminders',
      label: 'Reminder',
      icon: 'alarm-outline' as const,
      active: isReminder,
      onPress: () => router.replace('/reminders'),
    },
    {
      key: 'meetings',
      label: 'Meeting',
      icon: 'headset-outline' as const,
      active: isMeeting,
      onPress: () => router.replace('/meetings'),
    },
  ];
  const productivityItems = [
    {
      key: 'tasks',
      label: 'Task',
      icon: 'checkbox-outline' as const,
      active: isTask,
      onPress: () => router.replace('/tasks'),
    },
    {
      key: 'notes',
      label: 'Notes',
      icon: 'bookmark-outline' as const,
      active: isNote,
      onPress: () => router.replace('/notes'),
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: 'calendar-outline' as const,
      active: isCalendar,
      onPress: () => router.replace('/calendar'),
    },
  ];

  return (
    <View style={[styles.base, horizontal ? styles.bar : styles.side]}>
      <View style={styles.logoRow}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/images/image.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brand} numberOfLines={1}>Shivora Technologies</Text>
      </View>

      <ScrollView
        style={horizontal ? undefined : styles.menuScroll}
        contentContainerStyle={horizontal ? styles.menuH : styles.menuV}
        scrollEnabled={!horizontal}
        showsVerticalScrollIndicator={false}
      >
        {!horizontal && <Text style={styles.sectionHeading}>MAIN</Text>}
        {menuItems.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={[
              styles.item,
              item.active ? styles.activeItem : styles.inactiveItem,
            ]}
            onPress={item.onPress}
          >
            <Ionicons
              name={item.icon}
              size={19}
              color={item.active ? colors.white : '#432D40'}
            />
            <Text
              style={[
                styles.itemText,
                item.active ? styles.activeItemText : styles.inactiveItemText,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
        {!horizontal && <Text style={[styles.sectionHeading, styles.productivityHeading]}>PRODUCTIVITY</Text>}
        {productivityItems.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={[styles.item, item.active ? styles.activeItem : styles.inactiveItem]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={19} color={item.active ? colors.white : '#432D40'} />
            <Text style={[styles.itemText, item.active ? styles.activeItemText : styles.inactiveItemText]}>{item.label}</Text>
          </Pressable>
        ))}
        {!horizontal && (
          <Text style={[styles.sectionHeading, styles.productivityHeading]}>BUSINESS</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Customer"
          accessibilityState={{ selected: isCustomer }}
          style={[styles.item, isCustomer ? styles.activeItem : styles.inactiveItem]}
          onPress={() => router.replace('/customers' as Href)}
        >
          <Ionicons name="people-outline" size={19} color={isCustomer ? colors.white : '#432D40'} />
          <Text style={[styles.itemText, isCustomer ? styles.activeItemText : styles.inactiveItemText]}>
            Customer
          </Text>
        </Pressable>

        {/* Invoice Accordion */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Invoice"
          accessibilityState={{ selected: isAnyInvoice, expanded: invoiceExpanded }}
          style={[styles.item, isAnyInvoice && !invoiceExpanded ? styles.activeItem : styles.inactiveItem]}
          onPress={() => {
            if (horizontal) {
              router.replace('/invoice' as Href);
            } else {
              setInvoiceExpanded(!invoiceExpanded);
            }
          }}
        >
          <Ionicons
            name="receipt-outline"
            size={19}
            color={isAnyInvoice && !invoiceExpanded ? colors.white : '#432D40'}
          />
          <Text
            style={[
              styles.itemText,
              { flex: 1 },
              isAnyInvoice && !invoiceExpanded ? styles.activeItemText : styles.inactiveItemText,
            ]}
          >
            Invoice
          </Text>
          {!horizontal && (
            <Ionicons
              name={invoiceExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={isAnyInvoice && !invoiceExpanded ? colors.white : '#56627C'}
            />
          )}
        </Pressable>

        {/* Invoice Sub-Items */}
        {!horizontal && invoiceExpanded && (
          <View style={styles.subItemContainer}>
            {[
              { key: 'list', label: 'List', path: '/invoice' as Href, active: isInvoiceList },
              { key: 'add', label: 'Add', path: '/invoice/add' as Href, active: isInvoiceAdd },
              { key: 'quotation', label: 'Quotation', path: '/invoice/quotation' as Href, active: isQuotation },
              { key: 'payment-method', label: 'Payment Method', path: '/invoice/payment-method' as Href, active: isPaymentMethod },
              { key: 'brochure', label: 'Brochure', path: '/invoice/brochure' as Href, active: isBrochure },
            ].map((sub) => (
              <Pressable
                key={sub.key}
                accessibilityRole="button"
                accessibilityLabel={sub.label}
                style={[styles.subItem, sub.active ? styles.activeSubItem : null]}
                onPress={() => router.replace(sub.path)}
              >
                <View style={[styles.subItemDot, sub.active ? styles.activeSubItemDot : null]} />
                <Text
                  style={[
                    styles.subItemText,
                    sub.active ? styles.activeSubItemText : styles.inactiveSubItemText,
                  ]}
                >
                  {sub.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {!horizontal && (
          <Text style={[styles.sectionHeading, styles.productivityHeading]}>HR</Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Staff"
          accessibilityState={{ selected: isStaff }}
          style={[styles.item, isStaff ? styles.activeItem : styles.inactiveItem]}
          onPress={() => router.replace('/staff' as Href)}
        >
          <Ionicons name="people-outline" size={19} color={isStaff ? colors.white : '#432D40'} />
          <Text style={[styles.itemText, isStaff ? styles.activeItemText : styles.inactiveItemText]}>
            Staff
          </Text>
        </Pressable>
      </ScrollView>

      <View style={horizontal ? styles.userH : styles.userV}>
        {!horizontal && <Text style={styles.userName}>{userName}</Text>}
        <Button title="Sign Out" variant="outline" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.white, borderColor: colors.border },
  side: { width: 220, borderRightWidth: 1, padding: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logoBox: {
    width: 40, height: 40, borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  logoImg: { width: 40, height: 40 },
  brand: { fontSize: 14, fontWeight: '800', color: colors.text, flexShrink: 1 },
  menuScroll: { flex: 1 },
  menuV: { marginTop: 24, gap: 6, paddingBottom: 12 },
  menuH: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3E2D8E',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  productivityHeading: { marginTop: 14 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  inactiveItem: {
    backgroundColor: 'transparent',
  },
  activeItem: {
    backgroundColor: '#372A8B',
    ...({
      backgroundImage: 'linear-gradient(90deg, #372A8B 0%, #C72588 100%)',
    } as any),
    boxShadow: '0 2px 6px rgba(55, 42, 139, 0.25)',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inactiveItemText: {
    color: '#432D40',
  },
  activeItemText: {
    color: colors.white,
    fontWeight: '700',
  },
  userV: { gap: 10 },
  userH: {},
  userName: { color: colors.muted, fontSize: 13 },
  subItemContainer: {
    paddingLeft: 20,
    gap: 3,
    marginTop: 2,
    marginBottom: 6,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeSubItem: {
    backgroundColor: '#E4EFFD',
  },
  subItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8C98A9',
  },
  activeSubItemDot: {
    backgroundColor: '#0B2F7D',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  subItemText: {
    fontSize: 13,
  },
  inactiveSubItemText: {
    color: '#56627C',
    fontWeight: '500',
  },
  activeSubItemText: {
    color: '#0B2F7D',
    fontWeight: '700',
  },
});
