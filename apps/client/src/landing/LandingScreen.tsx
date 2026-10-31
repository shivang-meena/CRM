import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { useResponsiveLayout } from '@/layout/responsive';

/* ---------- Config: change brand / routes here ---------- */
const BRAND = 'Shivora Technologies';
const LOGIN = '/login';
const STAFF_LOGIN = '/staff-login';
const HEADER_H = 68;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'funnel-outline', title: 'Lead management', text: 'Track leads on a visual pipeline, tag the services and products they want, and move them stage by stage.' },
  { icon: 'notifications-outline', title: 'Follow-ups & reminders', text: 'Schedule the next step on every lead and get notified, so no opportunity goes cold.' },
  { icon: 'people-outline', title: 'Meetings', text: 'Plan calls and visits, record outcomes, and keep a full history against each lead.' },
  { icon: 'calendar-outline', title: 'Calendar', text: 'See meetings, reminders and events together in day and month views.' },
  { icon: 'person-outline', title: 'Customers', text: 'Convert a won lead into a customer in one click and keep every conversation attached.' },
  { icon: 'receipt-outline', title: 'Quotations & invoices', text: 'Create professional quotations and invoices, GST or non-GST, and record payments.' },
  { icon: 'document-text-outline', title: 'Notes', text: 'Capture quick notes and ideas right where you work, searchable whenever you need them.' },
  { icon: 'shield-checkmark-outline', title: 'Team & permissions', text: 'Add staff with their own logins and decide exactly which modules each person can use.' },
  { icon: 'airplane-outline', title: 'Leave management', text: 'Let your team request leave and keep approvals organised without extra tools.' },
];

const STEPS = [
  { title: 'Capture the lead', text: 'Add enquiries in seconds and see them land on your pipeline with source, services and owner.' },
  { title: 'Follow up on time', text: 'Set reminders and meetings. Your dashboard and calendar show what needs attention today.' },
  { title: 'Quote, invoice, convert', text: 'Send a quotation, turn it into an invoice, collect payment, and convert the lead to a customer.' },
];

const BOARD = [
  { name: 'New', cards: [['Sharma Traders', 'Website enquiry', 'Hot lead', 'p'], ['Patel Interiors', 'Referral', 'New', 'p']] },
  { name: 'Follow-up', cards: [['Nova Clinic', 'Call at 4:30 PM', 'Today', 'w'], ['Rao & Sons', 'Quotation sent', 'Waiting', 'p']] },
  { name: 'Won', cards: [['Mehta Foods', '₹ 48,500', 'Converted', 'g']] },
];

/* ---------- Small pieces ---------- */
function Cta({ href, label, kind = 'primary', arrow }: { href: string; label: string; kind?: 'primary' | 'ghost'; arrow?: boolean }) {
  const router = useRouter();
  const primary = kind === 'primary';
  const fg = primary ? colors.white : colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(href as any)}
      style={({ pressed }) => [
        s.btn,
        primary ? s.btnPrimary : s.btnGhost,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[s.btnText, { color: fg }]}>{label}</Text>
      {arrow ? <Ionicons name="arrow-forward" size={16} color={fg} /> : null}
    </Pressable>
  );
}

function Tag({ kind, children }: { kind: string; children: string }) {
  const bg = kind === 'g' ? colors.successSoft : kind === 'w' ? colors.warningSoft : colors.primarySoft;
  const fg = kind === 'g' ? colors.success : kind === 'w' ? colors.warning : colors.primaryText;
  return (
    <View style={[s.tag, { backgroundColor: bg }]}>
      <Text style={[s.tagText, { color: fg }]}>{children}</Text>
    </View>
  );
}

function Float({ duration, style, children }: { duration: number; style: object; children: React.ReactNode }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const native = Platform.OS !== 'web';
    const ease = Easing.inOut(Easing.quad);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -8, duration, easing: ease, useNativeDriver: native }),
      Animated.timing(y, { toValue: 0, duration, easing: ease, useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [y, duration]);
  return <Animated.View style={[s.float, style, { transform: [{ translateY: y }] }]}>{children}</Animated.View>;
}

function Brand() {
  return (
    <View style={s.brand}>
      <View style={s.logo}>
        <Image
          source={require('../assets/images/image.png')}
          style={s.logoImg}
          resizeMode="contain"
        />
      </View>
      <Text style={s.brandText}>{BRAND}</Text>
    </View>
  );
}

function Check({ text, color = colors.success, textColor = colors.muted }: { text: string; color?: string; textColor?: string }) {
  return (
    <View style={s.checkRow}>
      <Ionicons name="checkmark-circle" size={18} color={color} />
      <Text style={[s.checkText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

/* ---------- Screen ---------- */
export default function LandingScreen() {
  const { token, role } = useAuth();
  const { width: winW } = useWindowDimensions();
  const { width: measured, onLayout } = useResponsiveLayout();
  const scrollRef = useRef<ScrollView>(null);
  const ys = useRef<Record<string, number>>({});
  const [menu, setMenu] = useState(false);

  const w = measured || winW;
  const wide = w >= 960;
  const mid = w >= 640;
  const pad = mid ? 28 : 20;
  const inner = Math.max(0, Math.min(w, 1160) - pad * 2);
  const cols = wide ? 3 : mid ? 2 : 1;
  const gap = 18;
  const cardW = Math.floor((inner - gap * (cols - 1)) / cols) - 1;

  const dashboard = role === 'super_admin' ? '/super-admin' : '/';
  const primaryHref = token ? dashboard : LOGIN;
  const primaryLabel = token ? 'Open dashboard' : 'Login to your CRM';

  const go = (key: string) => {
    setMenu(false);
    scrollRef.current?.scrollTo({ y: Math.max(0, (ys.current[key] ?? 0) - 4), animated: true });
  };
  const mark = (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => { ys.current[key] = e.nativeEvent.layout.y; };
  const wrap = { width: '100%' as const, maxWidth: 1160, alignSelf: 'center' as const, paddingHorizontal: pad };

  const navLinks = () => (
    <>
      {([['features', 'Features'], ['how', 'How it works'], ['invoicing', 'Invoicing']] as const).map(([k, label]) => (
        <Pressable key={k} onPress={() => go(k)} style={wide ? undefined : s.menuItem} accessibilityRole="link">
          <Text style={s.navLink}>{label}</Text>
        </Pressable>
      ))}
    </>
  );

  return (
    <ScrollView ref={scrollRef} style={{ flex: 1, backgroundColor: colors.canvas }} stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
      {/* Sticky header (must be first child) */}
      <View style={s.header}>
        <View style={[wrap, s.nav]}>
          <Brand />
          {wide ? <View style={s.links}>{navLinks()}</View> : null}
          <View style={s.navCta}>
            {wide && !token ? <Cta href={STAFF_LOGIN} label="Staff login" kind="ghost" /> : null}
            <Cta href={primaryHref} label={token ? 'Dashboard' : 'Login'} />
            {!wide ? (
              <Pressable onPress={() => setMenu(m => !m)} style={s.burger} accessibilityLabel="Menu">
                <Ionicons name={menu ? 'close' : 'menu'} size={22} color={colors.text} />
              </Pressable>
            ) : null}
          </View>
        </View>
        {!wide && menu ? (
          <View style={[wrap, s.menu]}>
            {navLinks()}
            {!token ? (
              <Link href={STAFF_LOGIN as any} asChild>
                <Pressable style={s.menuItem} accessibilityRole="link"><Text style={s.navLink}>Staff login</Text></Pressable>
              </Link>
            ) : null}
          </View>
        ) : null}
      </View>

      <View onLayout={onLayout}>
        {/* HERO */}
        <View style={s.hero}>
          <View style={s.blobA} /><View style={s.blobB} />
          <View style={[wrap, { flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', gap: wide ? 56 : 48 }]}>
            <View style={{ flex: wide ? 1 : undefined, alignItems: 'flex-start' }}>
              <View style={s.pill}><View style={s.pillDot} /><Text style={s.pillText}>Built for growing sales teams</Text></View>
              <Text style={[s.h1, { fontSize: wide ? 56 : mid ? 46 : 34, lineHeight: wide ? 62 : mid ? 52 : 40 }]}>
                Turn every lead into a <Text style={{ color: colors.primary }}>paying customer</Text>
              </Text>
              <Text style={s.lead}>One CRM to capture leads, never miss a follow-up, send quotations and GST invoices, and keep your whole team on the same page.</Text>
              <View style={s.ctaRow}>
                <Cta href={primaryHref} label={primaryLabel} arrow />
                <Pressable onPress={() => go('features')} style={[s.btn, s.btnGhost]}><Text style={[s.btnText, { color: colors.primaryText }]}>Explore features</Text></Pressable>
              </View>
              <View style={s.checks}>
                <Check text="GST-ready invoices" /><Check text="Staff permissions" /><Check text="Web & mobile" />
              </View>
            </View>

            {/* Product mock */}
            <View style={{ flex: wide ? 1 : undefined, paddingTop: 22, paddingBottom: 26 }}>
              <View style={s.win}>
                <View style={s.winBar}>
                  <View style={s.winDot} /><View style={s.winDot} /><View style={s.winDot} />
                  <Text style={s.winTitle}>Leads pipeline</Text>
                </View>
                <View style={s.board}>
                  {BOARD.filter((_, i) => mid || i < 2).map(col => (
                    <View key={col.name} style={{ flex: 1 }}>
                      <Text style={s.colHead}>{col.name.toUpperCase()}  {col.cards.length}</Text>
                      {col.cards.map(([name, sub, tag, kind]) => (
                        <View key={name} style={s.card}>
                          <Text style={s.cardName} numberOfLines={1}>{name}</Text>
                          <Text style={s.cardSub} numberOfLines={1}>{sub}</Text>
                          <Tag kind={kind}>{tag}</Tag>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
              <Float duration={3000} style={{ left: mid ? -20 : 0, bottom: 0 }}>
                <View style={[s.floatIcon, { backgroundColor: colors.successSoft }]}><Ionicons name="receipt-outline" size={16} color={colors.success} /></View>
                <View><Text style={s.floatTitle}>Invoice paid</Text><Text style={s.floatSub}>₹ 48,500 · Mehta Foods</Text></View>
              </Float>
              <Float duration={3600} style={{ right: mid ? -10 : 0, top: 0 }}>
                <View style={[s.floatIcon, { backgroundColor: colors.warningSoft }]}><Ionicons name="notifications-outline" size={16} color={colors.warning} /></View>
                <View><Text style={s.floatTitle}>Reminder</Text><Text style={s.floatSub}>Call Nova Clinic · 4:30 PM</Text></View>
              </Float>
            </View>
          </View>
        </View>

        {/* FEATURES */}
        <View style={s.section} onLayout={mark('features')}>
          <View style={wrap}>
            <View style={s.center}>
              <Text style={s.eyebrow}>EVERYTHING IN ONE PLACE</Text>
              <Text style={[s.h2, { fontSize: mid ? 38 : 28, lineHeight: mid ? 44 : 34 }]}>All the tools your sales team needs</Text>
              <Text style={[s.sub, { textAlign: 'center' }]}>Stop juggling spreadsheets, sticky notes and chat groups. Nine connected modules, one clean workspace.</Text>
            </View>
            <View style={[s.grid, { gap }]}>
              {FEATURES.map(f => (
                <View key={f.title} style={[s.feat, { width: cardW }]}>
                  <View style={s.featIc}><Ionicons name={f.icon} size={22} color={colors.primary} /></View>
                  <Text style={s.featTitle}>{f.title}</Text>
                  <Text style={s.featText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={[s.section, { paddingTop: 20 }]} onLayout={mark('how')}>
          <View style={wrap}>
            <View style={s.center}>
              <Text style={s.eyebrow}>HOW IT WORKS</Text>
              <Text style={[s.h2, { fontSize: mid ? 38 : 28, lineHeight: mid ? 44 : 34 }]}>From first enquiry to final payment</Text>
              <Text style={[s.sub, { textAlign: 'center' }]}>A simple flow your whole team can pick up in minutes.</Text>
            </View>
            <View style={[s.grid, { gap }]}>
              {STEPS.map((st, i) => (
                <View key={st.title} style={[s.feat, { width: cardW }]}>
                  <Text style={s.stepNo}>{`0${i + 1}`}</Text>
                  <Text style={s.featTitle}>{st.title}</Text>
                  <Text style={s.featText}>{st.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* INVOICING SPOTLIGHT */}
        <View style={[s.section, { paddingTop: 20 }]} onLayout={mark('invoicing')}>
          <View style={wrap}>
            <View style={[s.spot, { flexDirection: wide ? 'row' : 'column', padding: mid ? 48 : 26, gap: wide ? 48 : 32 }]}>
              <View style={{ flex: wide ? 1 : undefined }}>
                <Text style={[s.eyebrow, { color: colors.sky, textAlign: 'left' }]}>INVOICING</Text>
                <Text style={[s.h2, { color: colors.white, textAlign: 'left', fontSize: mid ? 36 : 28, lineHeight: mid ? 42 : 34 }]}>Get paid faster with GST-ready invoices</Text>
                <Text style={[s.sub, { color: '#C9D8F5' }]}>Build quotations and invoices from the same lead, using your own company profile, HSN codes and service & product catalogue.</Text>
                <View style={{ gap: 12, marginTop: 24 }}>
                  <Check text="GST and non-GST invoice settings" color={colors.sky} textColor={colors.white} />
                  <Check text="HSN master with your services and products" color={colors.sky} textColor={colors.white} />
                  <Check text="Payment tracking against every invoice" color={colors.sky} textColor={colors.white} />
                </View>
              </View>
              <View style={[s.inv, { flex: wide ? 1 : undefined }]}>
                <View style={s.invHead}>
                  <View><Text style={s.invTitle}>Invoice #INV-0042</Text><Text style={s.cardSub}>Mehta Foods</Text></View>
                  <Tag kind="g">Paid</Tag>
                </View>
                {[['Website redesign', '₹ 35,000'], ['Monthly support', '₹ 6,100'], ['GST (18%)', '₹ 7,400']].map(([a, b]) => (
                  <View key={a} style={s.row}><Text style={s.rowL}>{a}</Text><Text style={s.rowR}>{b}</Text></View>
                ))}
                <View style={[s.row, s.rowTotal]}><Text style={[s.rowR, { color: colors.primaryText, fontWeight: '800' }]}>Total</Text><Text style={[s.rowR, { color: colors.primaryText, fontWeight: '800', fontSize: 16 }]}>₹ 48,500</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* FINAL CTA */}
        <View style={[s.section, { paddingTop: 20, paddingBottom: 40 }]}>
          <View style={wrap}>
            <View style={[s.ctaCard, { paddingVertical: mid ? 60 : 40 }]}>
              <Text style={s.eyebrow}>READY WHEN YOU ARE</Text>
              <Text style={[s.h2, { textAlign: 'center', fontSize: mid ? 38 : 28, lineHeight: mid ? 44 : 34 }]}>Run your sales from one place</Text>
              <Text style={[s.sub, { textAlign: 'center', marginBottom: 26 }]}>Sign in to your workspace and pick up right where your team left off.</Text>
              <View style={[s.ctaRow, { justifyContent: 'center', marginVertical: 0 }]}>
                <Cta href={primaryHref} label={primaryLabel} arrow />
                {!token ? <Cta href={STAFF_LOGIN} label="Staff login" kind="ghost" /> : null}
              </View>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <View style={[wrap, { flexDirection: mid ? 'row' : 'column', justifyContent: 'space-between', alignItems: mid ? 'center' : 'flex-start', gap: 14 }]}>
            <Brand />
            <Text style={s.footText}>© {new Date().getFullYear()} {BRAND}. All rights reserved.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ---------- Styles ---------- */
const s = StyleSheet.create({
  // header
  header: { backgroundColor: 'rgba(247,249,252,0.96)', borderBottomWidth: 1, borderBottomColor: colors.border },
  nav: { height: HEADER_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 32, height: 32 },
  brandText: { fontSize: 19, fontWeight: '800', color: colors.navy },
  links: { flexDirection: 'row', gap: 28 },
  navLink: { fontSize: 14.5, fontWeight: '600', color: colors.muted },
  navCta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  burger: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  menu: { paddingBottom: 10 },
  menuItem: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.canvas },

  // buttons
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1 },
  btnPrimary: {
    backgroundColor: '#1D5FD6',
    borderColor: '#1D5FD6',
    shadowColor: '#1D5FD6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
    boxShadow: '0 10px 24px -10px rgba(29,95,214,0.7)',
  },
  btnGhost: { backgroundColor: colors.white, borderColor: colors.border },
  btnText: { fontSize: 15, fontWeight: '700' },

  // hero
  hero: { paddingTop: 64, paddingBottom: 80, overflow: 'hidden', backgroundColor: colors.canvas },
  blobA: { position: 'absolute', width: 520, height: 520, borderRadius: 260, right: -160, top: -220, backgroundColor: 'rgba(43,181,245,0.16)' },
  blobB: { position: 'absolute', width: 460, height: 460, borderRadius: 230, left: -200, top: -120, backgroundColor: colors.primarySoft },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  pillDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  pillText: { fontSize: 13, fontWeight: '700', color: colors.primaryText },
  h1: { fontWeight: '800', color: colors.text, letterSpacing: -1, marginTop: 20, marginBottom: 18 },
  lead: { fontSize: 17, lineHeight: 26, color: colors.muted, maxWidth: 520 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 30, marginBottom: 26 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 22, rowGap: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  checkText: { fontSize: 13.5, fontWeight: '600' },

  // mock
  win: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: 'hidden', boxShadow: '0 18px 50px -20px rgba(11,47,125,0.35)' },
  winBar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.canvas },
  winDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  winTitle: { marginLeft: 10, fontSize: 12, fontWeight: '600', color: colors.muted },
  board: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: colors.canvas },
  colHead: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.muted, marginBottom: 8 },
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, marginBottom: 8 },
  cardName: { fontSize: 13, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 11.5, color: colors.muted },
  tag: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 99 },
  tagText: { fontSize: 10.5, fontWeight: '700' },
  float: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, boxShadow: '0 18px 40px -18px rgba(11,47,125,0.4)' },
  floatIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  floatTitle: { fontSize: 12.5, fontWeight: '700', color: colors.text },
  floatSub: { fontSize: 11.5, color: colors.muted },

  // sections
  section: { paddingVertical: 76 },
  center: { alignItems: 'center' },
  eyebrow: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2, color: colors.primary, textAlign: 'center' },
  h2: { fontWeight: '800', color: colors.text, letterSpacing: -0.5, marginTop: 10, marginBottom: 14, textAlign: 'center' },
  sub: { fontSize: 16.5, lineHeight: 25, color: colors.muted, maxWidth: 600 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 44 },
  feat: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 24 },
  featIc: { width: 46, height: 46, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featTitle: { fontSize: 17.5, fontWeight: '700', color: colors.text, marginBottom: 6 },
  featText: { fontSize: 14.8, lineHeight: 22, color: colors.muted },
  stepNo: { fontSize: 42, fontWeight: '800', color: colors.primary, marginBottom: 10, lineHeight: 46 },

  // spotlight
  spot: { backgroundColor: colors.navy, borderRadius: 26, overflow: 'hidden' },
  inv: { backgroundColor: colors.white, borderRadius: 14, padding: 22, justifyContent: 'center' },
  invHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 14, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  invTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowL: { fontSize: 14, color: colors.muted },
  rowR: { fontSize: 14, fontWeight: '600', color: colors.text },
  rowTotal: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 12 },

  // cta + footer
  ctaCard: { alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 26, paddingHorizontal: 20 },
  footer: { paddingVertical: 32, borderTopWidth: 1, borderTopColor: colors.border },
  footText: { fontSize: 14, color: colors.muted },
});
