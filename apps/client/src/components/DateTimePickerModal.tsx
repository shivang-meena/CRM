import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import Button from './Button';
import { formatDateTime } from '@/utils/format';

type Props = {
  visible: boolean;
  value: string; // "DD-MM-YYYY HH:mm", or "DD-MM-YYYY" when dateOnly is true
  onSelect: (val: string) => void;
  onClose: () => void;
  title?: string;
  dateOnly?: boolean;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const pad = (n: number) => String(n).padStart(2, '0');

// Round Watch Dial Dimensions
const DIAL_SIZE = 250;
const DIAL_CENTER = DIAL_SIZE / 2; // 125
const NUMBER_RADIUS = 90;
const NUMBER_SIZE = 36;

export default function DateTimePickerModal({ visible, value, onSelect, onClose, title = 'Choose Follow Up Date', dateOnly = false }: Props) {
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [timeMode, setTimeMode] = useState<'hour' | 'minute'>('hour');

  // Date state
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [day, setDay] = useState(new Date().getDate());

  // Time state
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');

  useEffect(() => {
    if (visible) {
      setStep('date');
      setTimeMode('hour');
      const pickerValue = dateOnly ? `${value.trim()} 00:00` : value?.trim() ?? '';
      const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(pickerValue);
      if (m) {
        const d = Number(m[1]);
        const mo = Number(m[2]) - 1;
        const y = Number(m[3]);
        const h24 = Number(m[4]);
        const min = Number(m[5]);

        setYear(y);
        setMonth(mo);
        setDay(d);
        setHour(h24 % 12 || 12);
        setMinute(min);
        setAmpm(h24 >= 12 ? 'PM' : 'AM');
      } else {
        const current = formatDateTime(new Date().toISOString());
        const parts = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/.exec(current)!;
        setYear(Number(parts[3]));
        setMonth(Number(parts[2]) - 1);
        setDay(Number(parts[1]));
        const curH = Number(parts[4]);
        setHour(curH % 12 || 12);
        setMinute(Number(parts[5]));
        setAmpm(curH >= 12 ? 'PM' : 'AM');
      }
    }
  }, [visible, value, dateOnly]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  useEffect(() => { setDay(d => Math.min(d, daysInMonth)); }, [daysInMonth]);

  const handleHourSelect = (selectedHour: number) => {
    setHour(selectedHour);
    // Automatically transition to minute watch after selecting hour
    setTimeout(() => {
      setTimeMode('minute');
    }, 200);
  };

  const handleMinuteSelect = (selectedMinute: number) => {
    setMinute(selectedMinute);
  };

  const handleConfirm = () => {
    const h24 = ampm === 'PM' ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const selectedDate = `${pad(Math.min(day, daysInMonth))}-${pad(month + 1)}-${year}`;
    const result = dateOnly ? selectedDate : `${selectedDate} ${pad(h24)}:${pad(minute)}`;
    onSelect(result);
    onClose();
  };

  const handleClear = () => {
    onSelect('');
    onClose();
  };

  // Clock Hand Angle calculations
  const hourAngle = (hour % 12) * 30;
  const minuteAngle = minute * 6;
  const activeHandAngle = timeMode === 'hour' ? hourAngle : minuteAngle;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.titleBar}>
            <View style={styles.titleRow}>
              <Ionicons
                name={step === 'date' ? 'calendar-outline' : 'time-outline'}
                size={18}
                color={colors.primaryText}
              />
              <Text style={styles.titleText}>
                {step === 'date'
                  ? title
                  : timeMode === 'hour'
                  ? 'Choose Hour (Round Watch)'
                  : 'Choose Minute (Round Watch)'}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {step === 'date' ? (
              <View style={styles.calendarContainer}>
                {/* Month/Year Navigation */}
                <View style={styles.monthNav}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={prevMonth} hitSlop={10} style={styles.navBtn}>
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                  </Pressable>
                  <Text style={styles.monthTitle}>
                    {MONTH_NAMES[month]} {year}
                  </Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={nextMonth} hitSlop={10} style={styles.navBtn}>
                    <Ionicons name="chevron-forward" size={20} color={colors.text} />
                  </Pressable>
                </View>

                {/* Day Names Header */}
                <View style={styles.weekHeader}>
                  {DAY_NAMES.map((d, i) => (
                    <Text key={i} style={styles.weekDayText}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.daySlot} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d = i + 1;
                    const isSelected = d === day;
                    return (
                      <Pressable
                        key={`day-${d}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${d} ${MONTH_NAMES[month]} ${year}`}
                        accessibilityState={{ selected: isSelected }}
                        style={[styles.daySlot, isSelected && styles.daySelected]}
                        onPress={() => setDay(d)}
                      >
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                          {d}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Selected Date Summary */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>Selected Date:</Text>
                  <Text style={styles.summaryValue}>
                    {pad(day)}-{pad(month + 1)}-{year}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.timeContainer}>
                {/* Interactive Time Header Banner */}
                <View style={styles.watchHeader}>
                  <View style={styles.digitalRow}>
                    <Pressable
                      style={[styles.timePart, timeMode === 'hour' && styles.timePartActive]}
                      onPress={() => setTimeMode('hour')}
                    >
                      <Text
                        style={[
                          styles.timePartText,
                          timeMode === 'hour' && styles.timePartTextActive,
                        ]}
                      >
                        {pad(hour)}
                      </Text>
                    </Pressable>

                    <Text style={styles.colonText}>:</Text>

                    <Pressable
                      style={[styles.timePart, timeMode === 'minute' && styles.timePartActive]}
                      onPress={() => setTimeMode('minute')}
                    >
                      <Text
                        style={[
                          styles.timePartText,
                          timeMode === 'minute' && styles.timePartTextActive,
                        ]}
                      >
                        {pad(minute)}
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.ampmRow}>
                    {(['AM', 'PM'] as const).map((period) => {
                      const isSel = ampm === period;
                      return (
                        <Pressable
                          key={period}
                          onPress={() => setAmpm(period)}
                          style={[styles.ampmBtn, isSel && styles.ampmBtnActive]}
                        >
                          <Text style={[styles.ampmText, isSel && styles.ampmTextActive]}>
                            {period}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Subtitle helper */}
                <View style={styles.modeIndicatorRow}>
                  <Text style={styles.modeIndicatorText}>
                    {timeMode === 'hour'
                      ? '1. Select Hour from clock dial'
                      : '2. Select Minute from clock dial'}
                  </Text>
                  {timeMode === 'minute' && (
                    <View style={styles.microStepperRow}>
                      <Pressable
                        style={styles.stepBtn}
                        hitSlop={6}
                        onPress={() => setMinute((m) => (m > 0 ? m - 1 : 59))}
                      >
                        <Text style={styles.stepText}>-1</Text>
                      </Pressable>
                      <Pressable
                        style={styles.stepBtn}
                        hitSlop={6}
                        onPress={() => setMinute((m) => (m < 59 ? m + 1 : 0))}
                      >
                        <Text style={styles.stepText}>+1</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Round Watch Dial */}
                <View style={styles.dialWrapper}>
                  <View style={styles.dial}>
                    {/* Clock Hand Pointer */}
                    <View
                      style={[
                        styles.handContainer,
                        { transform: [{ rotate: `${activeHandAngle}deg` }] },
                      ]}
                      pointerEvents="none"
                    >
                      <View style={styles.handPointer} />
                      <View style={styles.handInvisibleBottom} />
                    </View>

                    {/* Clock Center Pin */}
                    <View style={styles.centerPin} pointerEvents="none" />

                    {/* Numbers on the Clock Face */}
                    {timeMode === 'hour'
                      ? HOURS.map((h) => {
                          const isSel = h === hour;
                          const hAngle = (h % 12) * 30;
                          const rad = ((hAngle - 90) * Math.PI) / 180;
                          const left = DIAL_CENTER + NUMBER_RADIUS * Math.cos(rad) - NUMBER_SIZE / 2;
                          const top = DIAL_CENTER + NUMBER_RADIUS * Math.sin(rad) - NUMBER_SIZE / 2;

                          return (
                            <Pressable
                              key={`hour-${h}`}
                              style={[
                                styles.clockNum,
                                { left, top },
                                isSel && styles.clockNumSelected,
                              ]}
                              onPress={() => handleHourSelect(h)}
                            >
                              <Text
                                style={[
                                  styles.clockNumText,
                                  isSel && styles.clockNumTextSelected,
                                ]}
                              >
                                {h}
                              </Text>
                            </Pressable>
                          );
                        })
                      : MINUTES.map((m) => {
                          const isSel = m === minute || (minute % 5 !== 0 && Math.abs(m - minute) < 3);
                          const mAngle = (m / 60) * 360;
                          const rad = ((mAngle - 90) * Math.PI) / 180;
                          const left = DIAL_CENTER + NUMBER_RADIUS * Math.cos(rad) - NUMBER_SIZE / 2;
                          const top = DIAL_CENTER + NUMBER_RADIUS * Math.sin(rad) - NUMBER_SIZE / 2;

                          return (
                            <Pressable
                              key={`min-${m}`}
                              style={[
                                styles.clockNum,
                                { left, top },
                                isSel && styles.clockNumSelected,
                              ]}
                              onPress={() => handleMinuteSelect(m)}
                            >
                              <Text
                                style={[
                                  styles.clockNumText,
                                  isSel && styles.clockNumTextSelected,
                                ]}
                              >
                                {pad(m)}
                              </Text>
                            </Pressable>
                          );
                        })}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Controls */}
          <View style={styles.footer}>
            {step === 'date' ? (
              <View style={styles.footerRow}>
                <Button title="Clear" variant="danger" onPress={handleClear} />
                <View style={{ flex: 1 }} />
                <Button title="Cancel" variant="outline" onPress={onClose} />
                <Button
                  title={dateOnly ? 'Done' : 'Next: Select Time'}
                  onPress={() => {
                    if (dateOnly) {
                      handleConfirm();
                      return;
                    }
                    setStep('time');
                    setTimeMode('hour');
                  }}
                />
              </View>
            ) : (
              <View style={styles.footerRow}>
                <Button
                  title="Back"
                  variant="outline"
                  onPress={() => {
                    if (timeMode === 'minute') {
                      setTimeMode('hour');
                    } else {
                      setStep('date');
                    }
                  }}
                />
                <View style={{ flex: 1 }} />
                <Button title="Cancel" variant="outline" onPress={onClose} />
                <Button title="Done" onPress={handleConfirm} />
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  box: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '94%',
    backgroundColor: colors.white,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    color: colors.primaryText,
    fontWeight: '800',
    fontSize: 16,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  calendarContainer: {
    gap: 12,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
  },
  navBtn: {
    padding: 4,
    borderRadius: 4,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 6,
  },
  daySlot: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  daySelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 13,
    color: colors.text,
  },
  dayTextSelected: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryText,
  },
  timeContainer: {
    alignItems: 'center',
    gap: 12,
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  digitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timePart: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timePartActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timePartText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  timePartTextActive: {
    color: colors.primaryText,
  },
  colonText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  ampmRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  ampmBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ampmText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  ampmTextActive: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  modeIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  modeIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
  },
  microStepperRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.white,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  dialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPin: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    position: 'absolute',
    left: DIAL_CENTER - 4,
    top: DIAL_CENTER - 4,
    zIndex: 10,
  },
  handContainer: {
    width: 2,
    height: NUMBER_RADIUS * 2,
    position: 'absolute',
    left: DIAL_CENTER - 1,
    top: DIAL_CENTER - NUMBER_RADIUS,
    zIndex: 5,
  },
  handPointer: {
    width: 2,
    height: NUMBER_RADIUS,
    backgroundColor: colors.primary,
  },
  handInvisibleBottom: {
    width: 2,
    height: NUMBER_RADIUS,
    backgroundColor: 'transparent',
  },
  clockNum: {
    position: 'absolute',
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    zIndex: 6,
  },
  clockNumSelected: {
    backgroundColor: colors.primary,
  },
  clockNumText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  clockNumTextSelected: {
    color: colors.primaryText,
    fontWeight: '800',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
