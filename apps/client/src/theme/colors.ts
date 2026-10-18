/**
 * Central project colour tokens.
 * Change this file to re-theme the application. `light` and `dark` contain
 * the complete UI palette; semantic names explain where each colour belongs.
 *
 * Logo colours: navy #0B2F7D / #0F3A8C, blue #1D5FD6, cyan #2BB5F5.
 */
export const PROJECT_COLORS = {
  light: {
    // Light theme: overall app/page background (pure white per project requirement).
    canvas: '#FFFFFF',
    // Light theme: main surface for panels and forms.
    panel: '#FFFFFF',
    // Light theme: card and dialog surface.
    card: '#FFFFFF',
    // Light theme: primary readable text.
    text: '#0E1B3D',
    // Light theme: secondary text and labels.
    muted: '#56627C',
    // Light theme: subtle separators.
    line: '#DCE3F0',
    // Light theme: component outlines.
    border: '#DCE3F0',
    // Light theme: top navigation background.
    header: '#FFFFFF',
    // Light theme: top navigation divider.
    headerBorder: '#DCE3F0',
    // Light theme: side navigation background.
    sidebar: '#FFFFFF',
    // Light theme: side navigation outline.
    sidebarBorder: '#DCE3F0',
    // Light theme: main brand action and link color.
    primary: '#0F3A8C',
    // Light theme: active and highlighted controls.
    accent: '#1D5FD6',
    // Light theme: soft selected-state background.
    accentSoft: '#E4EFFD',
    // Light theme: hover-state surface.
    hover: 'rgba(14,27,61,0.05)',
    // Light theme: high-contrast text.
    ink: '#0E1B3D',
    // Light theme: legacy pale surface alias.
    mint: '#E4EFFD',
    // Light theme: sky blue accent representing the logo.
    sky: '#2BB5F5',
    // Light theme: light-blue alias representing the logo.
    blueLight: '#2BB5F5',
    // Light theme: legacy warm highlight alias.
    sun: '#F6E7BF',
    // Light theme: legacy warm status alias.
    coral: '#F9DDD7',
    // Light theme: success-state text and icons.
    success: '#1E7F5C',
    // Light theme: warning-state text and icons.
    warning: '#9A6700',
    // Light theme: error and destructive-state text.
    danger: '#B3261E',
    // Light theme: secondary accent and category color.
    purple: '#6D4AC4',
    // Light theme: white contrast utility.
    white: '#FFFFFF',
    // Light theme: black contrast utility.
    black: '#000000',
    // Light theme: modal and drawer backdrop.
    overlay: 'rgba(11,27,69,0.45)',
    // Light theme: navigation label text.
    navText: '#0E1B3D',
    // Light theme: secondary navigation text.
    navMuted: '#56627C',
    // Light theme: navigation separators.
    navDivider: '#DCE3F0',
    // Light theme: navigation hover background.
    navHover: 'rgba(14,27,61,0.05)',
    // Light theme: active navigation background.
    navActive: '#E4EFFD',
    // Light theme: warning toast icon and text.
    toastWarning: '#fbbf24',
    // Light theme: warning toast surface.
    toastWarningBg: '#1e1a12',
    // Light theme: warning toast outline.
    toastWarningBorder: 'rgba(251,191,36,0.45)',
    // Light theme: warning toast badge background.
    toastWarningBadge: 'rgba(251,191,36,0.15)',
    // Light theme: error toast icon and text.
    toastError: '#f87171',
    // Light theme: error toast surface.
    toastErrorBg: '#201215',
    // Light theme: error toast outline.
    toastErrorBorder: 'rgba(248,113,113,0.45)',
    // Light theme: error toast badge background.
    toastErrorBadge: 'rgba(248,113,113,0.15)',
    // Light theme: success toast icon and text.
    toastSuccess: '#34d399',
    // Light theme: success toast surface.
    toastSuccessBg: '#0f2019',
    // Light theme: success toast outline.
    toastSuccessBorder: 'rgba(52,211,153,0.45)',
    // Light theme: success toast badge background.
    toastSuccessBadge: 'rgba(52,211,153,0.15)',
    // Light theme: info toast icon and text.
    toastInfo: '#60a5fa',
    // Light theme: info toast surface.
    toastInfoBg: '#101a2d',
    // Light theme: info toast outline.
    toastInfoBorder: 'rgba(96,165,250,0.45)',
    // Light theme: info toast badge background.
    toastInfoBadge: 'rgba(96,165,250,0.15)',
    // Light theme: holiday calendar cell background.
    calendarHolidayBg: 'rgba(244,63,94,0.12)',
    // Light theme: holiday calendar cell outline.
    calendarHolidayBorder: 'rgba(244,63,94,0.32)',
    // Light theme: holiday calendar label.
    calendarHolidayText: '#fda4af',
    // Light theme: holiday calendar tag background.
    calendarHolidayTag: 'rgba(244,63,94,0.22)',
    // Light theme: day-off calendar cell background.
    calendarOffBg: 'rgba(245,158,11,0.12)',
    // Light theme: day-off calendar cell outline.
    calendarOffBorder: 'rgba(245,158,11,0.32)',
    // Light theme: day-off calendar label.
    calendarOffText: '#fcd34d',
    // Light theme: day-off calendar tag background.
    calendarOffTag: 'rgba(245,158,11,0.22)',
    // Light theme: working-day calendar cell background.
    calendarWorkBg: 'rgba(16,185,129,0.12)',
    // Light theme: working-day calendar cell outline.
    calendarWorkBorder: 'rgba(16,185,129,0.32)',
    // Light theme: working-day calendar label.
    calendarWorkText: '#6ee7b7',
    // Light theme: working-day calendar tag background.
    calendarWorkTag: 'rgba(16,185,129,0.22)',
    // Light theme: default calendar cell background.
    calendarDefaultBg: 'rgba(29,95,214,0.12)',
    // Light theme: default calendar cell outline.
    calendarDefaultBorder: 'rgba(29,95,214,0.32)',
    // Light theme: default calendar label.
    calendarDefaultText: '#9DB8FF',
    // Light theme: default calendar tag background.
    calendarDefaultTag: 'rgba(29,95,214,0.22)',
    // Light theme: present attendance status.
    attendancePresent: '#1E7F5C',
    // Light theme: present attendance badge background.
    attendancePresentBg: 'rgba(52,211,153,0.18)',
    // Light theme: present attendance badge outline.
    attendancePresentBorder: 'rgba(52,211,153,0.40)',
    // Light theme: absent attendance status.
    attendanceAbsent: '#B3261E',
    // Light theme: absent attendance badge background.
    attendanceAbsentBg: 'rgba(248,113,113,0.18)',
    // Light theme: absent attendance badge outline.
    attendanceAbsentBorder: 'rgba(248,113,113,0.40)',
    // Light theme: late attendance status.
    attendanceLate: '#9A6700',
    // Light theme: late attendance badge background.
    attendanceLateBg: 'rgba(251,191,36,0.18)',
    // Light theme: late attendance badge outline.
    attendanceLateBorder: 'rgba(251,191,36,0.40)',
    // Light theme: timetable background surface.
    timetableSurface: '#EEF3FB',
    // Light theme: timetable highlighted period background.
    timetableHighlight: 'rgba(251,191,36,0.12)',
    // Light theme: timetable highlighted period outline.
    timetableHighlightBorder: 'rgba(251,191,36,0.35)',
    // Light theme: timetable holiday background.
    timetableHoliday: 'rgba(251,191,36,0.10)',
    // Light theme: timetable holiday outline.
    timetableHolidayBorder: 'rgba(251,191,36,0.30)',
    // Light theme: timetable working-day background.
    timetableWorking: 'rgba(52,211,153,0.15)',
    // Light theme: timetable working-day outline.
    timetableWorkingBorder: 'rgba(52,211,153,0.30)',
  },
  dark: {
    // Dark theme: overall app/page background.
    canvas: '#0A1020',
    // Dark theme: main surface for panels and forms.
    panel: '#111A30',
    // Dark theme: card and dialog surface.
    card: '#111A30',
    // Dark theme: primary readable text.
    text: '#EAF0FB',
    // Dark theme: secondary text and labels.
    muted: '#93A0BA',
    // Dark theme: subtle separators.
    line: '#1F2B47',
    // Dark theme: component outlines.
    border: '#1F2B47',
    // Dark theme: top navigation background.
    header: '#0E1631',
    // Dark theme: top navigation divider.
    headerBorder: '#1F2B47',
    // Dark theme: side navigation background.
    sidebar: '#071230',
    // Dark theme: side navigation outline.
    sidebarBorder: '#16213F',
    // Dark theme: main brand action and link color.
    primary: '#2563EB',
    // Dark theme: active and highlighted controls.
    accent: '#6CBDFF',
    // Dark theme: soft selected-state background.
    accentSoft: 'rgba(108,189,255,0.14)',
    // Dark theme: hover-state surface.
    hover: 'rgba(255,255,255,0.05)',
    // Dark theme: high-contrast text.
    ink: '#EAF0FB',
    // Dark theme: legacy pale surface alias.
    mint: '#14264F',
    // Dark theme: legacy blue accent alias.
    sky: '#6CBDFF',
    // Dark theme: legacy light-blue alias.
    blueLight: '#6CBDFF',
    // Dark theme: legacy warm highlight alias.
    sun: '#F1E5CA',
    // Dark theme: legacy warm status alias.
    coral: '#EEDBD3',
    // Dark theme: success-state text and icons.
    success: '#4CC79A',
    // Dark theme: warning-state text and icons.
    warning: '#E0A84B',
    // Dark theme: error and destructive-state text.
    danger: '#F08A7E',
    // Dark theme: secondary accent and category color.
    purple: '#B79BFF',
    // Dark theme: white contrast utility.
    white: '#FFFFFF',
    // Dark theme: black contrast utility.
    black: '#000000',
    // Dark theme: modal and drawer backdrop.
    overlay: 'rgba(0,0,0,0.65)',
    // Dark theme: navigation label text.
    navText: '#EEF4FF',
    // Dark theme: secondary navigation text.
    navMuted: 'rgba(238,244,255,0.62)',
    // Dark theme: navigation separators.
    navDivider: 'rgba(238,244,255,0.12)',
    // Dark theme: navigation hover background.
    navHover: 'rgba(255,255,255,0.07)',
    // Dark theme: active navigation background.
    navActive: 'rgba(255,255,255,0.13)',
    // Dark theme: warning toast icon and text.
    toastWarning: '#fbbf24',
    // Dark theme: warning toast surface.
    toastWarningBg: '#1e1a12',
    // Dark theme: warning toast outline.
    toastWarningBorder: 'rgba(251,191,36,0.45)',
    // Dark theme: warning toast badge background.
    toastWarningBadge: 'rgba(251,191,36,0.15)',
    // Dark theme: error toast icon and text.
    toastError: '#f87171',
    // Dark theme: error toast surface.
    toastErrorBg: '#201215',
    // Dark theme: error toast outline.
    toastErrorBorder: 'rgba(248,113,113,0.45)',
    // Dark theme: error toast badge background.
    toastErrorBadge: 'rgba(248,113,113,0.15)',
    // Dark theme: success toast icon and text.
    toastSuccess: '#34d399',
    // Dark theme: success toast surface.
    toastSuccessBg: '#0f2019',
    // Dark theme: success toast outline.
    toastSuccessBorder: 'rgba(52,211,153,0.45)',
    // Dark theme: success toast badge background.
    toastSuccessBadge: 'rgba(52,211,153,0.15)',
    // Dark theme: info toast icon and text.
    toastInfo: '#60a5fa',
    // Dark theme: info toast surface.
    toastInfoBg: '#101a2d',
    // Dark theme: info toast outline.
    toastInfoBorder: 'rgba(96,165,250,0.45)',
    // Dark theme: info toast badge background.
    toastInfoBadge: 'rgba(96,165,250,0.15)',
    // Dark theme: holiday calendar cell background.
    calendarHolidayBg: 'rgba(244,63,94,0.12)',
    // Dark theme: holiday calendar cell outline.
    calendarHolidayBorder: 'rgba(244,63,94,0.32)',
    // Dark theme: holiday calendar label.
    calendarHolidayText: '#fda4af',
    // Dark theme: holiday calendar tag background.
    calendarHolidayTag: 'rgba(244,63,94,0.22)',
    // Dark theme: day-off calendar cell background.
    calendarOffBg: 'rgba(245,158,11,0.12)',
    // Dark theme: day-off calendar cell outline.
    calendarOffBorder: 'rgba(245,158,11,0.32)',
    // Dark theme: day-off calendar label.
    calendarOffText: '#fcd34d',
    // Dark theme: day-off calendar tag background.
    calendarOffTag: 'rgba(245,158,11,0.22)',
    // Dark theme: working-day calendar cell background.
    calendarWorkBg: 'rgba(16,185,129,0.12)',
    // Dark theme: working-day calendar cell outline.
    calendarWorkBorder: 'rgba(16,185,129,0.32)',
    // Dark theme: working-day calendar label.
    calendarWorkText: '#6ee7b7',
    // Dark theme: working-day calendar tag background.
    calendarWorkTag: 'rgba(16,185,129,0.22)',
    // Dark theme: default calendar cell background.
    calendarDefaultBg: 'rgba(108,189,255,0.12)',
    // Dark theme: default calendar cell outline.
    calendarDefaultBorder: 'rgba(108,189,255,0.32)',
    // Dark theme: default calendar label.
    calendarDefaultText: '#9DB8FF',
    // Dark theme: default calendar tag background.
    calendarDefaultTag: 'rgba(108,189,255,0.22)',
    // Dark theme: present attendance status.
    attendancePresent: '#4CC79A',
    // Dark theme: present attendance badge background.
    attendancePresentBg: 'rgba(52,211,153,0.18)',
    // Dark theme: present attendance badge outline.
    attendancePresentBorder: 'rgba(52,211,153,0.40)',
    // Dark theme: absent attendance status.
    attendanceAbsent: '#F08A7E',
    // Dark theme: absent attendance badge background.
    attendanceAbsentBg: 'rgba(248,113,113,0.18)',
    // Dark theme: absent attendance badge outline.
    attendanceAbsentBorder: 'rgba(248,113,113,0.40)',
    // Dark theme: late attendance status.
    attendanceLate: '#E0A84B',
    // Dark theme: late attendance badge background.
    attendanceLateBg: 'rgba(251,191,36,0.18)',
    // Dark theme: late attendance badge outline.
    attendanceLateBorder: 'rgba(251,191,36,0.40)',
    // Dark theme: timetable background surface.
    timetableSurface: '#EEF3FB',
    // Dark theme: timetable highlighted period background.
    timetableHighlight: 'rgba(251,191,36,0.12)',
    // Dark theme: timetable highlighted period outline.
    timetableHighlightBorder: 'rgba(251,191,36,0.35)',
    // Dark theme: timetable holiday background.
    timetableHoliday: 'rgba(251,191,36,0.10)',
    // Dark theme: timetable holiday outline.
    timetableHolidayBorder: 'rgba(251,191,36,0.30)',
    // Dark theme: timetable working-day background.
    timetableWorking: 'rgba(52,211,153,0.15)',
    // Dark theme: timetable working-day outline.
    timetableWorkingBorder: 'rgba(52,211,153,0.30)',
  },
} as const;

export type ProjectThemeColors = typeof PROJECT_COLORS.light;

export const PDF_COLORS = {
  // PDF page and report white text/background
  white: '1 1 1',
  // muted report header copy
  headerMuted: '0.86 0.88 0.86',
  // report body text
  ink: '0.15 0.18 0.16',
  // table row numbering
  rowNumber: '0.25 0.28 0.26',
  // secondary table copy
  rowMuted: '0.30 0.33 0.31',
  // report headings and body marks
  body: '0.18 0.21 0.19',
  // high-emphasis report text
  strong: '0.12 0.15 0.13',
  // successful payment/status text
  success: '0.12 0.30 0.18',
  // reversed or failed payment text
  danger: '0.55 0.16 0.14',
  // warning/status text
  warning: '0.50 0.34 0.08',
  // neutral report labels
  neutral: '0.35 0.38 0.35',
  // low-emphasis report footnotes
  faint: '0.40 0.43 0.40',
  // marked row text
  marked: '0.20 0.23 0.21',
} as const;

/** Canonical values for UI colors that do not have a semantic palette name yet. */
export const COLOR_VALUES = {
  // Used for successLight in theme.
  color001: '#E8F2EA',
  // Used for warningLight in theme.
  color002: '#FBF2DF',
  // Used for dangerLight in theme.
  color003: '#FBECE8',
  // Used for infoLight in theme.
  color004: '#EDF1E8',
  // Used for purpleLight in theme.
  color005: '#F1EDE5',
  // Used for glowBorder in theme.
  color006: '#A8BBA9',
  // Used for glowBorderSm in theme.
  color007: '#D3DFD1',
  // Used for shadow in theme.
  color008: '#1A1B1D',
  // Used for shadow in theme; shadow in ToastContext.
  color009: '#000000',
  // Used for surface in index; textColor in index; and 72 additional uses.
  color010: '#FFFFFF',
  // Used for surface/background in admission-requests; surface/background in staff; and 42 additional uses.
  color011: 'rgba(255, 255, 255, 0.04)',
  // Used for surface/background in admission-requests; surface/background in staff; and 17 additional uses.
  color012: '#F2F3ED',
  // Used for surface/background in timetable; surface/background in StaffSalary screen.
  color013: 'rgba(251, 191, 36, 0.06)',
  // Used for surface/background in timetable; surface/background in ExamTimetable builder.
  color014: 'rgba(251, 191, 36, 0.10)',
  // Used for border/outline in staff; border/outline in students; and 7 additional uses.
  color015: 'rgba(251, 191, 36, 0.20)',
  // Used for border/outline in admission-requests; border/outline in timetable; and 6 additional uses.
  color016: 'rgba(251, 191, 36, 0.30)',
  // Used for color style in admission-requests; surface/background in admission-requests; and 13 additional uses.
  color017: 'rgba(52, 211, 153, 0.15)',
  // Used for border/outline in admission-requests; border/outline in timetable; and 6 additional uses.
  color018: 'rgba(52, 211, 153, 0.30)',
  // Used for surface/background in login; color style in admission-requests; and 32 additional uses.
  color019: 'rgba(53,99,75, 0.15)',
  // Used for surface/background in login; surface/background in staff; and 32 additional uses.
  color020: 'rgba(53,99,75, 0.12)',
  // Used for border/outline in login; border/outline in admission-requests; and 11 additional uses.
  color021: 'rgba(53,99,75, 0.30)',
  // Used for border/outline in login; surface/background in staff; and 8 additional uses.
  color022: 'rgba(53,99,75, 0.25)',
  // Used for color style in admission-requests; surface/background in admission-requests; and 11 additional uses.
  color023: 'rgba(251, 191, 36, 0.15)',
  // Used for color style in admission-requests; text or icon color in admission-requests; and 26 additional uses.
  color024: '#28704A',
  // Used for surface/background in admission-requests; tint in dashboard; and 12 additional uses.
  color025: 'rgba(52,211,153,0.12)',
  // Used for color style in admission-requests; text or icon color in staff; and 16 additional uses.
  color026: '#35634B',
  // Used for text or icon color in staff; text/icon color in staff; and 22 additional uses.
  color027: '#536B54',
  // Used for color style in admission-requests; text or icon color in admission-requests; and 36 additional uses.
  color028: '#936522',
  // Used for tint in dashboard; surface/background in marks; and 9 additional uses.
  color029: 'rgba(251,191,36,0.12)',
  // Used for color style in admission-requests; text or icon color in admission-requests; and 40 additional uses.
  color030: '#B4493F',
  // Used for surface/background in admission-requests; surface/background in staff; and 22 additional uses.
  color031: 'rgba(248,113,113,0.12)',
  // Used for text or icon color in staff; text or icon color in dashboard; and 40 additional uses.
  color032: '#706451',
  // Used for color style in staff; text/icon color in dashboard; and 3 additional uses.
  color033: 'rgba(255,255,255,0.20)',
  // Used for color style in students; color style in marks; and 6 additional uses.
  color034: 'rgba(255,255,255,0.25)',
  // Used for surface/background in login; surface/background in dashboard; and 8 additional uses.
  color035: 'rgba(53,99,75,0.10)',
  // Used for surface/background in dashboard; surface/background in timetable; and 3 additional uses.
  color036: 'rgba(53,99,75,0.06)',
  // Used for surface/background in login; surface/background in staff; and 8 additional uses.
  color037: 'rgba(53,99,75,0.08)',
  // Used for border/outline in dashboard; surface/background in timetable; and 7 additional uses.
  color038: 'rgba(53,99,75,0.20)',
  // Used for surface/background in dashboard.
  color039: 'rgba(112,100,81,0.09)',
  // Used for surface/background in dashboard.
  color040: 'rgba(112,100,81,0.05)',
  // Used for surface/background in dashboard.
  color041: 'rgba(112,100,81,0.12)',
  // Used for border/outline in dashboard.
  color042: 'rgba(112,100,81,0.25)',
  // Used for surface/background in staff; surface/background in dashboard; and 1 additional uses.
  color043: 'rgba(53,99,75,0.05)',
  // Used for text or icon color in DailyTimetable builder; text/icon color in ToastContext.
  color044: 'rgba(255, 255, 255, 0.75)',
  // Used for text or icon color in ToastContext.
  color045: '#e2e8f0',
  // Used for surface/background in index; surface/background in admission-requests; and 54 additional uses.
  color046: 'rgba(255, 255, 255, 0.08)',
  // Used for ink in index; light-theme ink theme token.
  color047: '#0E1B3D',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color048: '#E4EFFD',
  // Used for link in index.
  color049: '#1553C7',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color050: '#F6E7BF',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color051: '#F9DDD7',
  // Used for action in index.
  color052: '#1D5FD6',
  // Used for danger in index; danger in dashboard.
  color053: '#B3261E',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color054: '#1E7F5C',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color055: '#9A6700',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color056: '#6D4AC4',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color057: '#1E6FE0',
  // Used for canvas in index; canvas in dashboard.
  color058: '#0A1020',
  // Used for surface in index; panel in dashboard.
  color059: '#111A30',
  // Used for ink in index; text in dashboard.
  color060: '#EAF0FB',
  // Used for muted in index.
  color061: '#93A0BA',
  // Used for line in index; line in dashboard.
  color062: '#1F2B47',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color063: '#0E1631',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color064: '#071230',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color065: '#16213F',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color066: '#14264F',
  // Used for link in index.
  color067: '#6CBDFF',
  // Used for primary in dashboard.
  color068: '#2563EB',
  // Used for danger in index; danger in dashboard.
  color069: '#F08A7E',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color070: '#4CC79A',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color071: '#E0A84B',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color072: '#B79BFF',
  // Used for canvas in dashboard.
  color073: '#F4F7FC',
  // Used for text in dashboard.
  color074: '#14213D',
  // Used for muted in dashboard.
  color075: '#5B6781',
  // Used for line in index; line in dashboard.
  color076: '#DCE3F0',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color077: 'rgba(255, 255, 255, 0.92)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color078: '#18191B',
  // Used for primary in dashboard.
  color079: '#0F3A8C',
  // Used for light-theme mint theme token.
  color080: '#E3E9F3',
  // Used for text/icon color in Header; light-theme sun theme token.
  color081: '#F1E5CA',
  // Used for light-theme coral theme token.
  color082: '#EEDBD3',
  // Used for light-theme page background; light-theme header background.
  color083: '#0F1320',
  // Used for light-theme panel surface; light-theme card surface.
  color084: '#171C2B',
  // Used for light-theme main text.
  color085: '#EDF0F7',
  // Used for light-theme secondary text.
  color086: '#98A1B6',
  // Used for light-theme separators; light-theme header divider; and 1 additional uses.
  color087: '#262D42',
  // Used for light-theme sidebar background.
  color088: '#0C101C',
  // Used for light-theme sidebar outline.
  color089: '#212839',
  // Used for light-theme brand action color.
  color090: '#3D6FE6',
  // Used for light-theme sky theme token; light-theme blueLight theme token.
  color091: '#9DB8FF',
  // Used for light-theme active accent.
  color092: '#7EA4FF',
  // Used for light-theme selected-state background.
  color093: 'rgba(126,164,255,0.13)',
  // Used for surface/background in staff; surface/background in students; and 33 additional uses.
  color094: 'rgba(255,255,255,0.05)',
  // Used for light-theme page background; light-theme header background.
  color095: '#F4F6FA',
  // Used for light-theme main text.
  color096: '#0F1A33',
  // Used for light-theme secondary text.
  color097: '#5A6478',
  // Used for light-theme separators; light-theme header divider; and 2 additional uses.
  color098: '#E1E5EC',
  // Used for light-theme sidebar background.
  color099: '#FAFBFD',
  // Used for light-theme brand action color.
  color100: '#14306E',
  // Used for light-theme sky theme token; light-theme blueLight theme token.
  color101: '#2F4F9A',
  // Used for light-theme active accent.
  color102: '#1D56D8',
  // Used for light-theme selected-state background.
  color103: '#E8EFFD',
  // Used for light-theme hover surface.
  color104: 'rgba(15,26,51,0.05)',
  // Used for text or icon color in admission-requests; text or icon color in staff; and 12 additional uses.
  color105: '#fff',
  // Used for surface/background in staff; surface/background in students; and 4 additional uses.
  color106: 'rgba(251, 191, 36, 0.08)',
  // Used for border/outline in timetable; border/outline in AcademicCalendar screen; and 6 additional uses.
  color107: 'rgba(251, 191, 36, 0.25)',
  // Used for border/outline in staff; border/outline in students; and 8 additional uses.
  color108: 'rgba(251, 191, 36, 0.35)',
  // Used for border/outline in timetable.
  color109: 'rgba(53,99,75, 0.40)',
  // Used for border/outline in timetable.
  color110: 'rgba(53,99,75, 0.45)',
  // Used for surface/background in timetable; surface/background in Attendance screen.
  color111: 'rgba(52, 211, 153, 0.18)',
  // Used for border/outline in timetable; border/outline in AdminOperations screen; and 4 additional uses.
  color112: 'rgba(52, 211, 153, 0.35)',
  // Used for border/outline in staff; surface/background in staff; and 34 additional uses.
  color113: 'rgba(255, 255, 255, 0.06)',
  // Used for text or icon color in timetable; text or icon color in AdminOperations screen.
  color114: '#B42318',
  // Used for text/icon color in marks; color030 in marks; and 3 additional uses.
  color115: 'rgba(255,255,255,0.4)',
  // Used for text or icon color in fees; text/icon color in marks.
  color116: 'rgba(255,255,255,0.7)',
  // Used for text/icon color in students; text/icon color in marks; and 43 additional uses.
  color117: '#252C27',
  // Used for tint in dashboard; surface/background in marks; and 5 additional uses.
  color118: 'rgba(245, 158, 11, 0.12)',
  // Used for surface/background in marks.
  color119: 'rgba(245, 158, 11, 0.15)',
  // Used for border/outline in marks; border/outline in AcademicCalendar screen; and 2 additional uses.
  color120: 'rgba(245, 158, 11, 0.25)',
  // Used for border/outline in marks.
  color121: 'rgba(245, 158, 11, 0.35)',
  // Used for surface/background in marks.
  color122: 'rgba(245, 158, 11, 0.18)',
  // Used for border/outline in marks.
  color123: 'rgba(245, 158, 11, 0.45)',
  // Used for text or icon color in marks; text or icon color in DailyTimetable builder.
  color124: '#b45309',
  // Used for surface/background in staff; surface/background in students; and 33 additional uses.
  color125: 'rgba(255,255,255,0.03)',
  // Used for surface/background in marks; surface/background in DailyTimetable builder; and 13 additional uses.
  color126: '#F6F7F2',
  // Used for surface/background in staff; surface/background in students; and 16 additional uses.
  color127: 'rgba(255,255,255,0.02)',
  // Used for color style in admission-requests; surface/background in admission-requests; and 12 additional uses.
  color128: 'rgba(248, 113, 113, 0.15)',
  // Used for border/outline in marks; border/outline in AdminOperations screen; and 4 additional uses.
  color129: 'rgba(248, 113, 113, 0.3)',
  // Used for surface/background in admission-requests; surface/background in marks.
  color130: 'rgba(248, 113, 113, 0.10)',
  // Used for border/outline in admission-requests; border/outline in staff; and 11 additional uses.
  color131: 'rgba(248, 113, 113, 0.25)',
  // Used for text/icon color in staff; text or icon color in marks; and 7 additional uses.
  color132: '#fca5a5',
  // Used for text or icon color in marks; text or icon color in AcademicCalendar screen; and 13 additional uses.
  color133: '#dc2626',
  // Used for surface/background in marks.
  color134: '#EEF0E9',
  // Used for border/outline in admission-requests; border/outline in marks; and 2 additional uses.
  color135: 'rgba(52, 211, 153, 0.25)',
  // Used for border/outline in marks.
  color136: 'rgba(245, 158, 11, 0.4)',
  // Used for surface/background in marks.
  color137: 'rgba(245, 158, 11, 0.04)',
  // Used for surface/background in marks; surface/background in PayrollManager.
  color138: 'rgba(245, 158, 11, 0.08)',
  // Used for surface/background in marks.
  color139: '#E4E9DF',
  // Used for border/outline in marks.
  color140: 'rgba(248, 113, 113, 0.4)',
  // Used for surface/background in marks.
  color141: 'rgba(245, 158, 11, 0.1)',
  // Used for tint in dashboard; surface/background in ClassSubjectManager; and 4 additional uses.
  color142: 'rgba(16,185,129,0.12)',
  // Used for surface/background in login; surface/background in dashboard; and 1 additional uses.
  color143: 'rgba(53,99,75,0.14)',
  // Used for panel in index.
  color144: '#10388F',
  // Used for field in index.
  color145: '#0D1527',
  // Used for action in index.
  color146: '#2F7BEA',
  // Used for actionHover in index.
  color147: '#4A8EF0',
  // Used for canvas in index.
  color148: '#F3F6FC',
  // Used for muted in index.
  color149: '#56627C',
  // Used for panel in index.
  color150: '#0B2F7D',
  // Used for field in index.
  color151: '#F8FAFD',
  // Used for actionHover in index.
  color152: '#1650BC',
  // Used for ACCENT in index.
  color153: '#2BB5F5',
  // Used for ON_PANEL in index.
  color154: '#EEF4FF',
  // Used for ON_PANEL_MUTED in index.
  color155: 'rgba(238,244,255,0.76)',
  // Used for ON_PANEL_LINE in index.
  color156: 'rgba(238,244,255,0.18)',
  // Used for INK_ON_LIGHT in index.
  color157: '#0B1B45',
  // Used for text or icon color in index.
  color158: '#06214F',
  // Used for surface/background in index.
  color159: 'rgba(4,8,20,0.8)',
  // Used for surface/background in index.
  color160: 'rgba(11,27,69,0.5)',
  // Used for border/outline in AcademicCalendar screen; surface/background in AdminOperations screen; and 14 additional uses.
  color161: 'rgba(255, 255, 255, 0.10)',
  // Used for surface/background in StaffSalary screen; surface/background in StudentResults screen.
  color162: 'rgba(91, 140, 255, 0.1)',
  // Used for border/outline in StudentResults screen.
  color163: 'rgba(52, 211, 153, 0.4)',
  // Used for text or icon color in ClassSubjectManager; text or icon color in PayrollManager; and 6 additional uses.
  color164: '#059669',
  // Used for surface/background in ClassStudentsFee modal; surface/background in StudentResults screen.
  color165: 'rgba(0,0,0,0.18)',
  // Used for surface/background in AcademicCalendar screen; surface/background in Attendance screen; and 12 additional uses.
  color166: 'rgba(0,0,0,0.03)',
  // Used for surface/background in StudentResults screen.
  color167: 'rgba(0, 0, 0, 0.78)',
  // Used for surface/background in Attendance screen; surface/background in ClassStudentsFee modal; and 2 additional uses.
  color168: 'rgba(0, 0, 0, 0.5)',
  // Used for surface/background in ClassStudentsFee modal; surface/background in StaffSalary screen; and 1 additional uses.
  color169: '#0c121e',
  // Used for text/icon color in staff; border/outline in AdminOperations screen; and 12 additional uses.
  color170: 'rgba(255, 255, 255, 0.15)',
  // Used for surface/background in AcademicCalendar screen; surface/background in ClassStudentsFee modal; and 21 additional uses.
  color171: 'rgba(0,0,0,0.02)',
  // Used for surface/background in AcademicCalendar screen; surface/background in AcademicDetails modal; and 6 additional uses.
  color172: 'rgba(0, 0, 0, 0.06)',
  // Used for surface/background in StudentResults screen.
  color173: 'rgba(91, 140, 255, 0.08)',
  // Used for border/outline in AcademicCalendar screen; border/outline in Attendance screen; and 9 additional uses.
  color174: 'rgba(255, 255, 255, 0.12)',
  // Used for surface/background in ClassStudentsFee modal; surface/background in StudentResults screen.
  color175: 'rgba(0,0,0,0.2)',
  // Used for border/outline in AcademicCalendar screen; surface/background in AcademicDetails modal; and 1 additional uses.
  color176: 'rgba(255, 255, 255, 0.07)',
  // Used for surface/background in AcademicDetails modal; surface/background in Attendance screen; and 16 additional uses.
  color177: 'rgba(0, 0, 0, 0.04)',
  // Used for surface/background in AcademicCalendar screen; surface/background in AcademicDetails modal; and 13 additional uses.
  color178: 'rgba(0, 0, 0, 0.05)',
  // Used for color033 in staff; color034 in students; and 6 additional uses.
  color179: 'rgba(37,44,39,0.35)',
  // Used for border/outline in AcademicCalendar screen; border/outline in Attendance screen; and 7 additional uses.
  color180: 'rgba(255, 255, 255, 0.09)',
  // Used for text or icon color in StudentFees screen.
  color181: '#C7CDC7',
  // Used for text or icon color in AdminOperations screen; text or icon color in StudentFees screen.
  color182: '#F1F2EC',
  // Used for text or icon color in StudentFees screen.
  color183: '#8BC79B',
  // Used for text or icon color in StudentFees screen.
  color184: '#F29A91',
  // Used for text or icon color in StudentFees screen.
  color185: '#E8C77A',
  // Used for surface/background in AdminOperations screen; surface/background in StudentFees screen.
  color186: 'rgba(37,44,39, 0.08)',
  // Used for border/outline in AdminOperations screen; border/outline in StudentAttendance screen; and 2 additional uses.
  color187: 'rgba(37,44,39, 0.15)',
  // Used for text or icon color in AdminOperations screen; text or icon color in EmployeeAttendance screen; and 9 additional uses.
  color188: '#F5F5EE',
  // Used for surface/background in StudentFees screen.
  color189: 'rgba(25,33,27, 0.70)',
  // Used for surface/background in AdminOperations screen; surface/background in Header; and 3 additional uses.
  color190: 'rgba(37,44,39, 0.06)',
  // Used for text/icon color in AdminOperations screen; text/icon color in Attendance screen; and 2 additional uses.
  color191: '#C88728',
  // Used for border/outline in login; border/outline in admission-requests; and 7 additional uses.
  color192: 'rgba(248,113,113,0.30)',
  // Used for surface/background in students; surface/background in StudentAttendance screen.
  color193: 'rgba(37,44,39, 0.04)',
  // Used for surface/background in EmployeeAttendance screen; surface/background in StudentAttendance screen.
  color194: 'rgba(52, 211, 153, 0.20)',
  // Used for border/outline in staff; border/outline in students; and 2 additional uses.
  color195: 'rgba(248, 113, 113, 0.20)',
  // Used for border/outline in admission-requests; border/outline in staff; and 8 additional uses.
  color196: 'rgba(248, 113, 113, 0.35)',
  // Used for text or icon color in staff; color style in staff; and 5 additional uses.
  color197: 'rgba(255, 255, 255, 0.35)',
  // Used for color197 in staff; color197 in students; and 2 additional uses.
  color198: 'rgba(37,44,39, 0.40)',
  // Used for surface/background in staff; surface/background in students; and 2 additional uses.
  color199: 'rgba(248, 113, 113, 0.08)',
  // Used for surface/background in Attendance screen; surface/background in ClassStudentsFee modal; and 1 additional uses.
  color200: 'rgba(91, 140, 255, 0.15)',
  // Used for text or icon color in ClassStudentsFee modal; text or icon color in PayrollManager; and 6 additional uses.
  color201: '#d97706',
  // Used for surface/background in login; surface/background in ClassStudentsFee modal; and 4 additional uses.
  color202: 'rgba(53,99,75, 0.18)',
  // Used for surface/background in ClassSubjectManager; surface/background in PayrollManager; and 1 additional uses.
  color203: 'rgba(0, 0, 0, 0.75)',
  // Used for surface/background in AcademicCalendar screen; surface/background in ClassSubjectManager; and 3 additional uses.
  color204: 'rgba(53,99,75, 0.2)',
  // Used for surface/background in AcademicCalendar screen; surface/background in ClassSubjectManager; and 2 additional uses.
  color205: 'rgba(53,99,75, 0.1)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color206: 'rgba(6,14,40,0.65)',
  // Used for surface/background in PortalLayout.
  color207: 'rgba(8,12,24,0.55)',
  // Used for surface/background in ClassSubjectManager; surface/background in PayrollManager.
  color208: 'rgba(53,99,75, 0.16)',
  // Used for surface/background in AcademicDetails modal; surface/background in ClassSubjectManager; and 5 additional uses.
  color209: 'rgba(14, 165, 233, 0.12)',
  // Used for surface/background in PayrollManager.
  color210: 'rgba(255, 255, 255, 0.015)',
  // Used for surface/background in PayrollManager.
  color211: 'rgba(0, 0, 0, 0.015)',
  // Used for border/outline in PayrollManager.
  color212: 'rgba(16, 185, 129, 0.25)',
  // Used for surface/background in AdminOperations screen; surface/background in ClassSubjectManager; and 4 additional uses.
  color213: 'rgba(239, 68, 68, 0.12)',
  // Used for border/outline in AcademicDetails modal; border/outline in AdminOperations screen; and 3 additional uses.
  color214: 'rgba(239, 68, 68, 0.25)',
  // Used for surface/background in AcademicDetails modal; surface/background in ClassSubjectManager; and 3 additional uses.
  color215: 'rgba(124, 58, 237, 0.12)',
  // Used for border/outline in AcademicCalendar screen; border/outline in AdminOperations screen; and 5 additional uses.
  color216: 'rgba(53,99,75, 0.3)',
  // Used for border/outline in ClassSubjectManager; border/outline in PayrollManager.
  color217: 'rgba(124, 58, 237, 0.25)',
  // Used for surface/background in AcademicDetails modal; surface/background in ClassSubjectManager; and 1 additional uses.
  color218: 'rgba(14, 165, 233, 0.15)',
  // Used for surface/background in ClassSubjectManager; surface/background in PayrollManager.
  color219: 'rgba(14, 165, 233, 0.08)',
  // Used for surface/background in Header.
  color220: 'rgba(25,33,27,0.95)',
  // Used for surface/background in Header.
  color221: 'rgba(255,255,255,0.96)',
  // Used for text or icon color in Header.
  color222: 'rgba(255, 255, 255, 0.65)',
  // Used for border/outline in staff; border/outline in AcademicDetails modal; and 7 additional uses.
  color223: 'rgba(53,99,75, 0.35)',
  // Used for text or icon color in AdminOperations screen; color style in ClassSubjectManager; and 8 additional uses.
  color224: 'rgba(255,255,255,0.3)',
  // Used for color197 in AcademicDetails modal; color197 in AdminOperations screen; and 5 additional uses.
  color225: 'rgba(37,44,39,0.4)',
  // Used for false in ClassSubjectManager.
  color226: 'rgba(0,0,0,0.15)',
  // Used for surface/background in ClassSubjectManager.
  color227: 'rgba(124, 58, 237, 0.15)',
  // Used for border/outline in ClassSubjectManager.
  color228: 'rgba(14, 165, 233, 0.25)',
  // Used for surface/background in ClassSubjectManager.
  color229: 'rgba(124, 58, 237, 0.08)',
  // Used for border/outline in AdminOperations screen; surface/background in ClassSubjectManager.
  color230: 'rgba(255, 255, 255, 0.1)',
  // Used for border/outline in AcademicDetails modal; border/outline in ClassSubjectManager.
  color231: 'rgba(14, 165, 233, 0.3)',
  // Used for surface/background in ClassSubjectManager.
  color232: 'rgba(248, 113, 113, 0.18)',
  // Used for surface/background in AcademicDetails modal; surface/background in ClassSubjectManager.
  color233: 'rgba(14, 165, 233, 0.1)',
  // Used for border/outline in AdminOperations screen; border/outline in ClassSubjectManager.
  color234: 'rgba(52, 211, 153, 0.3)',
  // Used for border/outline in ClassSubjectManager.
  color235: 'rgba(16, 185, 129, 0.3)',
  // Used for surface/background in AcademicDetails modal; surface/background in ClassSubjectManager.
  color236: 'rgba(239, 68, 68, 0.1)',
  // Used for border/outline in AdminOperations screen; border/outline in ClassSubjectManager.
  color237: 'rgba(239, 68, 68, 0.3)',
  // Used for surface/background in ClassSubjectManager.
  color238: 'rgba(124, 58, 237, 0.06)',
  // Used for border/outline in ClassSubjectManager.
  color239: 'rgba(124, 58, 237, 0.2)',
  // Used for surface/background in ClassStudentsFee modal.
  color240: 'rgba(3, 7, 18, 0.85)',
  // Used for shadow in ClassStudentsFee modal.
  color241: '#000',
  // Used for surface/background in ClassStudentsFee modal.
  color242: 'rgba(91, 140, 255, 0.06)',
  // Used for surface/background in ClassStudentsFee modal.
  color243: 'rgba(91, 140, 255, 0.12)',
  // Used for border/outline in ClassStudentsFee modal.
  color244: 'rgba(251, 191, 36, 0.3)',
  // Used for border/outline in ClassStudentsFee modal.
  color245: 'rgba(251, 191, 36, 0.4)',
  // Used for surface/background in ClassStudentsFee modal.
  color246: 'rgba(91, 140, 255, 0.14)',
  // Used for surface/background in ClassStudentsFee modal.
  color247: 'rgba(12, 18, 30, 0.95)',
  // Used for surface/background in ClassStudentsFee modal.
  color248: 'rgba(240, 244, 255, 0.95)',
  // Used for border/outline in Attendance screen.
  color249: 'rgba(0,0,0,0.1)',
  // Used for surface/background in admission-requests; surface/background in staff; and 4 additional uses.
  color250: 'rgba(25,33,27, 0.80)',
  // Used for surface/background in Attendance screen.
  color251: '#0e1525',
  // Used for text or icon color in Attendance screen.
  color252: 'rgba(0, 0, 0, 0.3)',
  // Used for border/outline in Attendance screen.
  color253: 'rgba(91, 140, 255, 0.35)',
  // Used for text or icon color in AdminOperations screen.
  color254: 'rgba(255,255,255,0.6)',
  // Used for surface/background in AdminOperations screen.
  color255: 'rgba(248, 113, 113, 0.1)',
  // Used for text or icon color in AdminOperations screen.
  color256: 'rgba(255,255,255,0.5)',
  // Used for text or icon color in staff; text or icon color in AdminOperations screen.
  color257: 'rgba(255,255,255,0.45)',
  // Used for color313 in staff; color115 in AdminOperations screen.
  color258: 'rgba(37,44,39, 0.45)',
  // Used for text or icon color in students; text/icon color in AdminOperations screen.
  color259: 'rgba(255, 255, 255, 0.55)',
  // Used for color259 in AdminOperations screen.
  color260: 'rgba(37,44,39, 0.55)',
  // Used for border/outline in login; text or icon color in AdminOperations screen.
  color261: '#DADFD6',
  // Used for text or icon color in AdminOperations screen.
  color262: '#475569',
  // Used for text or icon color in AdminOperations screen.
  color263: '#7B847B',
  // Used for border/outline in AdminOperations screen.
  color264: 'rgba(255,255,255,0.16)',
  // Used for text or icon color in AdminOperations screen.
  color265: '#D8DED7',
  // Used for surface/background in AdminOperations screen.
  color266: 'rgba(200,135,40,0.18)',
  // Used for border/outline in AdminOperations screen.
  color267: 'rgba(200,135,40,0.4)',
  // Used for surface/background in AdminOperations screen.
  color268: 'rgba(239, 68, 68, 0.08)',
  // Used for border/outline in AdminOperations screen.
  color269: '#b91c1c',
  // Used for text or icon color in AdminOperations screen.
  color270: '#fde68a',
  // Used for text or icon color in AdminOperations screen.
  color271: '#ef4444',
  // Used for text or icon color in AdminOperations screen.
  color272: '#fecaca',
  // Used for surface/background in admission-requests; surface/background in staff; and 12 additional uses.
  color273: '#F1F2ED',
  // Used for surface/background in admission-requests; surface/background in staff; and 4 additional uses.
  color274: '#F6F5F1',
  // Used for text or icon color in staff; text/icon color in staff; and 1 additional uses.
  color275: 'rgba(255, 255, 255, 0.60)',
  // Used for text or icon color in staff; text or icon color in students; and 3 additional uses.
  color276: 'rgba(37,44,39, 0.70)',
  // Used for surface/background in AdminOperations screen.
  color277: 'rgba(239, 68, 68, 0.15)',
  // Used for border/outline in AdminOperations screen.
  color278: 'rgba(239, 68, 68, 0.35)',
  // Used for surface/background in AdminOperations screen.
  color279: 'rgba(0, 0, 0, 0.28)',
  // Used for surface/background in AdminOperations screen.
  color280: 'rgba(251, 191, 36, 0.18)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color281: 'rgba(238,244,255,0.62)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color282: 'rgba(238,244,255,0.12)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color283: 'rgba(255,255,255,0.13)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color284: 'rgba(43,181,245,0.16)',
  // Legacy palette value; retained as a shared theme or compatibility token.
  color285: 'rgba(255,255,255,0.14)',
  // Used for surface/background in AcademicDetails modal.
  color286: 'rgba(0, 0, 0, 0.35)',
  // Used for text or icon color in AcademicDetails modal.
  color287: '#E7EAE4',
  // Used for text or icon color in AcademicDetails modal.
  color288: '#D7DED6',
  // Used for surface/background in AcademicCalendar screen.
  color289: '#f43f5e',
  // Used for text or icon color in AcademicCalendar screen.
  color290: '#fda4af',
  // Used for text or icon color in AcademicCalendar screen.
  color291: '#fcd34d',
  // Used for surface/background in AcademicCalendar screen.
  color292: 'rgba(244, 63, 94, 0.12)',
  // Used for surface/background in AcademicCalendar screen.
  color293: 'rgba(244, 63, 94, 0.10)',
  // Used for border/outline in AcademicCalendar screen.
  color294: 'rgba(244, 63, 94, 0.3)',
  // Used for border/outline in AcademicCalendar screen.
  color295: 'rgba(244, 63, 94, 0.25)',
  // Used for surface/background in AcademicCalendar screen.
  color296: 'rgba(245, 158, 11, 0.10)',
  // Used for border/outline in AcademicCalendar screen.
  color297: 'rgba(245, 158, 11, 0.3)',
  // Used for border/outline in AcademicCalendar screen.
  color298: 'rgba(53,99,75, 0.4 fears)',
  // Used for surface/background in AcademicCalendar screen.
  color299: 'rgba(255, 255, 255, 0.025)',
  // Used for surface/background in AcademicCalendar screen.
  color300: 'rgba(251, 191, 36, 0.025)',
  // Used for surface/background in AcademicCalendar screen.
  color301: 'rgba(251, 191, 36, 0.05)',
  // Used for surface/background in AcademicCalendar screen.
  color302: 'rgba(53,99,75, 0.07)',
  // Used for surface/background in AcademicCalendar screen.
  color303: 'rgba(129, 140, 248, 0.12)',
  // Used for surface/background in AcademicCalendar screen.
  color304: 'rgba(129, 140, 248, 0.1)',
  // Used for text or icon color in AcademicCalendar screen.
  color305: '#fb7185',
  // Used for surface/background in AcademicCalendar screen.
  color306: 'rgba(255, 255, 255, 0.035)',
  // Used for color010 in login; blueLight in login; and 11 additional uses.
  color307: '#646D65',
  // Used for color style in admission-requests.
  color308: '#98A4B6',
  // Used for text or icon color in admission-requests.
  color309: 'rgba(255,255,255,0.70)',
  // Used for text or icon color in admission-requests.
  color310: 'rgba(37,44,39,0.75)',
  // Used for surface/background in staff; surface/background in students.
  color311: '#294D3B',
  // Used for text/icon color in students.
  color312: '#e8aa43',
  // Used for text or icon color in staff; text/icon color in staff.
  color313: 'rgba(255,255,255,0.40)',
  // Used for text or icon color in staff.
  color314: '#a5b4fc',
  // Used for text/icon color in staff.
  color315: 'rgba(255,255,255,0.30)',
  // Used for surface/background in staff.
  color316: 'rgba(53,99,75,0.09)',
  // Used for surface/background in staff.
  color317: 'rgba(53,99,75,0.04)',
  // Used for surface/background in staff.
  color318: 'rgba(37,44,39,0.03)',
  // Used for text or icon color in staff.
  color319: 'rgba(255,255,255,0.50)',
  // Used for muted in dashboard.
  color320: '#8F9DB8',
} as const;

/** Legacy CSS theme colors, injected as custom properties by the app shell. */
export const CSS_COLORS = {
  // Tailwind primary-50 utility shade, referenced by global.css.
  cssColor321: '#F2F5EF',
  // Tailwind primary-100 utility shade, referenced by global.css.
  cssColor322: '#E8EFE8',
  // Tailwind primary-500 utility shade, referenced by global.css.
  cssColor323: '#59615B',
  // Tailwind primary-600 utility shade, referenced by global.css.
  cssColor324: '#303631',
  // Tailwind primary-700 and primary-900 utility shades, referenced by global.css.
  cssColor325: '#202520',
  // School gold Tailwind utility color, referenced by global.css.
  cssColor326: '#f59e0b',
  // School emerald Tailwind utility color, referenced by global.css.
  cssColor327: '#10b981',
} as const;

/** Additional PDF RGB values used by report and receipt templates. */
export const PDF_COLOR_VALUES = {
  // PDF drawing/text color used by attendanceReportPdf.
  pdfColor001: '0.95 0.96 0.95',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor002: '0.08 0.16 0.35',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor003: '0.80 0.85 0.92',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor004: '0.06 0.15 0.32',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor005: '0.82 0.89 0.98',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor006: '0.70 0.80 0.95',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor007: '0.80 0.15 0.15',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor008: '0.95 0.40 0.40',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor009: '1 0.90 0.90',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor010: '0.12 0.28 0.58',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor011: '0.35 0.55 0.85',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor012: '0.85 0.93 1',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor013: '0.96 0.98 1.0',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor014: '0.82 0.87 0.94',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor015: '0.12 0.22 0.42',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor016: '0.35 0.40 0.50',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor017: '0.06 0.15 0.35',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor018: '0.10 0.15 0.25',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor019: '0.20 0.25 0.35',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor020: '0.85 0.15 0.15',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor021: '0.05 0.50 0.25',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor022: '0.08 0.18 0.36',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor023: '0.85 0.89 0.94',
  // PDF drawing/text color used by staff, students, feeReceiptPdf.
  pdfColor024: '0.2 0.25 0.35',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor025: '0.05 0.12 0.30',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor026: '0.45 0.50 0.60',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor027: '0.92 0.95 0.99',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor028: '0.15 0.30 0.65',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor029: '0.05 0.18 0.55',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor030: '0.98 0.98 0.99',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor031: '0.97 0.98 1.0',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor032: '0.40 0.45 0.55',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor033: '0.95 0.99 0.96',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor034: '0.70 0.88 0.75',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor035: '0.20 0.50 0.30',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor036: '0.05 0.55 0.20',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor037: '0.99 0.96 0.96',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor038: '0.92 0.78 0.78',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor039: '0.60 0.25 0.25',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor040: '0.75 0.15 0.15',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor041: '0.99 0.98 0.93',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor042: '0.92 0.85 0.65',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor043: '0.60 0.45 0.10',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor044: '0.65 0.45 0.05',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor045: '0.10 0.20 0.40',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor046: '0.30 0.35 0.45',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor047: '0.08 0.18 0.38',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor048: '0.99 0.94 0.94',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor049: '0.80 0.20 0.20',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor050: '0.85 0.10 0.10',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor051: '0.50 0.20 0.20',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor052: '0.94 0.97 1.0',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor053: '0.20 0.40 0.70',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor054: '0.08 0.18 0.40',
  // PDF drawing/text color used by feeReceiptPdf.
  pdfColor055: '0.05 0.50 0.20',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor056: '0.70 0.75 0.85',
  // PDF drawing/text color used by feeReceiptPdf, feeReportPdf.
  pdfColor057: '0.45 0.50 0.55',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor058: '0.30 0.38 0.50',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor059: '0.88 0.91 0.95',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor060: '0.35 0.40 0.48',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor061: '0.15 0.20 0.30',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor062: '0.05 0.45 0.20',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor063: '0.12 0.38 0.75',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor064: '0.10 0.22 0.45',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor065: '0.65 0.95 0.75',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor066: '1 0.80 0.80',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor067: '0.80 0.90 1.0',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor068: '0.35 0.42 0.55',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor069: '0.94 0.99 0.96',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor070: '0.70 0.90 0.78',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor071: '0.15 0.50 0.28',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor072: '1.0 0.96 0.96',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor073: '0.95 0.75 0.75',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor074: '0.70 0.20 0.20',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor075: '0.95 0.97 1.0',
  // PDF drawing/text color used by feeReportPdf.
  pdfColor076: '0.75 0.85 0.95',
  // PDF drawing/text color used by staff, students.
  pdfColor77: '0.04 0.11 0.22',
  // PDF drawing/text color used by staff, students.
  pdfColor78: '0.8 0.88 1',
  // PDF drawing/text color used by staff, students.
  pdfColor79: '0.12 0.22 0.38',
  // PDF drawing/text color used by staff, students.
  pdfColor80: '0.96 0.97 0.99',
  // PDF drawing/text color used by staff, students.
  pdfColor81: '0.85 0.88 0.92',
  // PDF drawing/text color used by staff, students.
  pdfColor82: '0.05 0.08 0.15',
  // PDF drawing/text color used by staff, students.
  pdfColor83: '0.75 0.8 0.88',
  // PDF drawing/text color used by staff, students.
  pdfColor84: '0.45 0.5 0.55',
  // PDF drawing/text color used by staff, students.
  pdfColor85: '0.86 0.89 0.93',
  // PDF drawing/text color used by staff, students.
  pdfColor86: '0.1 0.12 0.18',
} as const;

/** RGB triplets for jsPDF APIs, kept here with the rest of the color system. */
export const PDF_RGB_COLORS = {
  // Salary slip banner/background fill.
  darkNavy: [15, 23, 42],
  // White text and page surfaces in salary slips and marksheets.
  white: [255, 255, 255],
  // Salary slip secondary header text and divider color.
  lightSlate: [203, 213, 225],
  // Salary slip highlighted amount/accent.
  amber: [251, 191, 36],
  // Salary slip information-card background.
  nearWhite: [248, 250, 252],
  // Salary slip card outline.
  border: [226, 232, 240],
  // Salary slip field labels and secondary copy.
  muted: [71, 85, 105],
  // Salary slip primary detail text.
  ink: [30, 41, 59],
  // Salary slip footer metadata.
  gray: [148, 163, 184],
  // Marksheet main frame outline.
  deepBorder: [45, 55, 75],
  // Marksheet table and section outlines.
  borderMuted: [180, 190, 205],
  // Marksheet school heading and important labels.
  navy: [20, 32, 58],
  // Marksheet secondary headings.
  slate: [90, 100, 115],
  // Marksheet section dividers.
  borderLight: [215, 220, 230],
  // Marksheet student and subject detail text.
  inkAlt: [25, 38, 65],
  // Marksheet supporting copy.
  mutedAlt: [60, 75, 100],
  // Marksheet result-table row separators.
  rowBorder: [210, 218, 230],
  // Marksheet result-table cell background.
  paper: [248, 250, 253],
  // Marksheet table labels and explanatory text.
  textMuted: [70, 80, 95],
  // Marksheet low-priority notes.
  grayMuted: [110, 120, 135],
  // Marksheet footer metadata.
  grayLight: [150, 160, 175],
  // Marksheet overall passing result.
  pass: [22, 130, 80],
  // Marksheet overall failing result.
  fail: [220, 38, 38],
} as const;

/**
 * Standard semantic UI colors used by CRM client components.
 * Pure white background, sky blue (#2BB5F5) representing logo cyan,
 * navy text (#0B2F7D / #0E1B3D), and accent soft tones.
 */
export const colors = {
  // Primary brand / logo cyan & sky blue
  primary: '#2BB5F5',
  primaryText: '#0B2F7D',
  primarySoft: '#E4EFFD',

  // Surfaces & Backgrounds (Pure White per project requirement)
  white: '#FFFFFF',
  canvas: '#FFFFFF',
  panel: '#FFFFFF',
  card: '#FFFFFF',

  // Typography & Dividers
  text: '#0E1B3D',
  muted: '#56627C',
  textMuted: '#56627C',
  border: '#DCE3F0',
  line: '#DCE3F0',

  // Status & Feedback
  success: '#1E7F5C',
  successSoft: '#E8F2EA',
  warning: '#9A6700',
  warningSoft: '#FBF2DF',
  danger: '#B3261E',
  dangerSoft: '#FBECE8',
  dangerBorder: 'rgba(248,113,113,0.40)',
  purple: '#6D4AC4',
  purpleSoft: '#F1EDE5',
  star: '#FBBF24',
  starEmpty: '#DCE3F0',
  green: '#1E7F5C',
  taskNew: '#16A6A0',
  taskFeedback: '#7B61C9',
  taskCompleted: '#2F9E62',
  taskRejected: '#D04A55',
  taskProcessing: '#8A63D2',
  taskBadge: '#F7B7C9',
  overlay: 'rgba(11,27,69,0.45)',

  // Navigation tokens
  headerBorder: '#DCE3F0',
  navHover: 'rgba(14,27,61,0.05)',

  // Logo & Palette aliases
  navy: '#0B2F7D',
  navyDeep: '#0F3A8C',
  blue: '#1D5FD6',
  sky: '#2BB5F5',
  cyan: '#2BB5F5',
  accent: '#1D5FD6',
  accentSoft: '#E4EFFD',
};
