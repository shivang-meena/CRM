import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { COMPANY_BRANDING_KEY, fetchCompanyProfile, saveCompanyProfile } from "@/api/companyProfile";
import { errorMessage } from "@/api/client";
import { CompanyProfile, EMPTY_COMPANY_PROFILE } from "@/types/companyProfile";
import CompanyLogo from "./CompanyLogo";
import { INVOICE_COMPANY_PROFILE_KEY } from '@/hooks/useInvoiceCompanyProfile';
import ProfileColorPicker from "./ProfileColorPicker";
import {
  FieldLabel,
  ProfileField,
  ProfileSelect,
  ProfileTimeField,
  fieldStyles,
} from "./ProfileFields";
import {
  BUSINESS_CATEGORIES,
  COUNTRIES,
  DIAL_CODES,
  INDIA_STATES,
} from "./profileOptions";

const PROFILE_KEY = ["settings", "company-profile"] as const;
const NO_OPTIONS: readonly string[] = [];
type Errors = Partial<Record<keyof CompanyProfile, string>>;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

function SectionHeading({
  title,
  subtitle,
  icon,
  badge,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  badge?: boolean;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={badge ? styles.sectionBadge : undefined}>
        <Ionicons
          name={icon}
          size={badge ? 18 : 19}
          color={badge ? "#FFFFFF" : "#1D5FD6"}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}



function validate(profile: CompanyProfile): Errors {
  const errors: Errors = {};
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    errors.email = "Enter a valid email address.";
  if (
    profile.contactNumber &&
    (!/^[0-9 ()-]{4,25}$/.test(profile.contactNumber.trim()) ||
      profile.contactNumber.replace(/\D/g, "").length < 4)
  )
    errors.contactNumber = "Enter a valid contact number.";
  if (profile.dialCode && !/^\+\d{1,4}$/.test(profile.dialCode))
    errors.dialCode = "Choose a valid country calling code.";
  if (profile.themeColor && !/^#[\da-f]{6}$/i.test(profile.themeColor))
    errors.themeColor = "Enter a six-digit hex color, e.g. #1966A6.";
  if (profile.fontColor && !/^#[\da-f]{6}$/i.test(profile.fontColor))
    errors.fontColor = "Enter a six-digit hex color, e.g. #1966A6.";
  if (Boolean(profile.openingTime) !== Boolean(profile.closingTime))
    errors.openingTime =
      "Set both opening and closing times, or leave both empty.";
  for (const key of ["openingTime", "closingTime"] as const) {
    if (profile[key] && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(profile[key]))
      errors[key] = "Use a valid time in HH:mm format.";
  }
  return errors;
}

export default function CompanyProfileScreen() {
  const profileQuery = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: fetchCompanyProfile,
    refetchOnWindowFocus: false,
  });

  if (profileQuery.isPending)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0B2F7D" />
        <Text style={styles.subtitle}>Loading company profile...</Text>
      </View>
    );
  if (profileQuery.isError)
    return (
      <View style={styles.loading}>
        <Ionicons name="cloud-offline-outline" size={30} color="#84749F" />
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage(profileQuery.error)}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.save}
          onPress={() => {
            void profileQuery.refetch();
          }}
        >
          <Text style={styles.saveText}>Retry</Text>
        </Pressable>
      </View>
    );
  return (
    <CompanyProfileForm
      initialProfile={profileQuery.data ?? EMPTY_COMPANY_PROFILE}
    />
  );
}

function CompanyProfileForm({
  initialProfile,
}: {
  initialProfile: CompanyProfile;
}) {
  const { width } = useWindowDimensions();
  const wide = width >= 1050;
  const locationColumns = width >= 1280 ? 4 : width >= 850 ? 2 : 1;
  const [profile, setProfile] = useState<CompanyProfile>(() => ({
    ...EMPTY_COMPANY_PROFILE,
    ...initialProfile,
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [logoError, setLogoError] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: saveCompanyProfile });
  const busy = mutation.isPending || logoBusy;
  const locationStyle =
    locationColumns === 4
      ? styles.quarter
      : locationColumns === 2
        ? styles.half
        : styles.full;

  function update<K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K],
  ) {
    if (mutation.isPending) return;
    setProfile((current) => ({
      ...current,
      [key]: value,
      ...(key === "country" && value !== current.country
        ? { state: "", city: "" }
        : key === "state" && value !== current.state
          ? { city: "" }
          : {}),
    }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setMessage("");
    mutation.reset();
  }

  async function save() {
    if (busy) return;
    setMessage("");
    const nextErrors = validate(profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || logoError) {
      setMessage("Please check the highlighted fields before saving.");
      return;
    }
    const payload = Object.fromEntries(
      Object.entries(EMPTY_COMPANY_PROFILE).map(([key]) => {
        const value = profile[key as keyof CompanyProfile];
        return [key, typeof value === "string" ? value.trim() : value];
      }),
    ) as CompanyProfile;
    try {
      const saved = await mutation.mutateAsync(payload);
      queryClient.setQueryData(PROFILE_KEY, saved);
      queryClient.setQueryData(COMPANY_BRANDING_KEY, {
        companyName: saved.companyName,
        logo: saved.logo,
      });
      await queryClient.invalidateQueries({ queryKey: INVOICE_COMPANY_PROFILE_KEY });
      setProfile({ ...EMPTY_COMPANY_PROFILE, ...saved });
      setMessage("Company profile saved successfully.");
    } catch {
      /* The mutation error is displayed below; keep the entered values. */
    }
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.toolbar}>
        <View
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
          style={styles.profileTab}
        >
          <Ionicons name="home-outline" size={13} color="#FFFFFF" />
          <Text style={styles.profileTabText}>Company Profile</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save company profile"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => {
            void save();
          }}
          style={[styles.save, busy && styles.disabled]}
        >
          {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <Text style={styles.saveText}>
            {mutation.isPending
              ? "Saving..."
              : logoBusy
                ? "Uploading..."
                : "Save"}
          </Text>
        </Pressable>
      </View>
      {message ? (
        <Text
          accessibilityRole="alert"
          style={
            message === "Company profile saved successfully."
              ? styles.success
              : styles.error
          }
        >
          {message}
        </Text>
      ) : null}
      {mutation.isError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errorMessage(mutation.error)}
        </Text>
      ) : null}

      <View pointerEvents={busy ? "none" : "auto"} style={styles.form}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <SectionHeading
              title="Company details"
              subtitle="Identity, location, and operating hours that appear across the platform."
              icon="business-outline"
              badge
            />
          </View>
          <View style={styles.cardBody}>
            <View style={[styles.companyRow, !wide && styles.stack]}>
              <View style={!wide ? styles.centerLogo : undefined}>
                <CompanyLogo
                  value={profile.logo}
                  onChange={(value) => update("logo", value)}
                  onError={setLogoError}
                  onBusyChange={setLogoBusy}
                />
                {logoError ? (
                  <Text style={styles.error}>{logoError}</Text>
                ) : null}
              </View>
              <View style={styles.companyFields}>
                <View style={[styles.row, !wide && styles.stack]}>
                  <ProfileField
                    label="Company Name"
                    value={profile.companyName}
                    onChange={(value) => update("companyName", value)}
                    error={errors.companyName}
                    maxLength={200}
                  />
                  <View style={fieldStyles.field}>
                    <FieldLabel label="Company Contact Number" />
                    <View style={styles.phoneRow}>
                      <View style={{ width: 82 }}>
                        <ProfileSelect
                          label=""
                          value={profile.dialCode}
                          onChange={(value) => update("dialCode", value)}
                          options={DIAL_CODES}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInputPhone
                          value={profile.contactNumber}
                          onChange={(value) => update("contactNumber", value)}
                          invalid={Boolean(errors.contactNumber)}
                        />
                      </View>
                    </View>
                    {errors.contactNumber || errors.dialCode ? (
                      <Text style={fieldStyles.error}>
                        {errors.contactNumber || errors.dialCode}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={[styles.row, !wide && styles.stack]}>
                  <ProfileField
                    label="Company GST Number"
                    value={profile.gstNumber}
                    onChange={(value) => update("gstNumber", value)}
                    maxLength={30}
                  />
                  <ProfileField
                    label="Company Email"
                    value={profile.email}
                    onChange={(value) => update("email", value)}
                    keyboardType="email-address"
                    error={errors.email}
                    maxLength={254}
                  />
                </View>
                <ProfileField
                  label="Company Address"
                  multiline
                  value={profile.address}
                  onChange={(value) => update("address", value)}
                  error={errors.address}
                  maxLength={2000}
                />
              </View>
            </View>
            <View style={styles.divider} />
            <SectionHeading
              title="Location & Business Details"
              subtitle="Where your business operates and what you do."
              icon="location-outline"
            />
            <View style={styles.locationRow}>
              <View style={locationStyle}>
                <ProfileSelect
                  label="Country"
                  value={profile.country}
                  onChange={(value) => update("country", value)}
                  options={COUNTRIES}
                  error={errors.country}
                />
              </View>
              <View style={locationStyle}>
                <ProfileSelect
                  label="State"
                  value={profile.state}
                  onChange={(value) => update("state", value)}
                  options={
                    profile.country === "India" ? INDIA_STATES : NO_OPTIONS
                  }
                  error={errors.state}
                />
              </View>
              <View style={locationStyle}>
                <ProfileSelect
                  label="City"
                  value={profile.city}
                  onChange={(value) => update("city", value)}
                  options={NO_OPTIONS}
                  error={errors.city}
                />
              </View>
              <View style={locationStyle}>
                <ProfileSelect
                  label="Business Category"
                  value={profile.businessCategory}
                  onChange={(value) => update("businessCategory", value)}
                  options={BUSINESS_CATEGORIES}
                  error={errors.businessCategory}
                />
              </View>
            </View>
            <View style={styles.divider} />
            <SectionHeading
              title="Operating Company Hours"
              subtitle="Define when your store is open and how overtime is handled."
              icon="time-outline"
            />
            <View style={[styles.hoursRow, !wide && styles.stack]}>
              <ProfileTimeField
                label="Store Opening Time"
                value={profile.openingTime}
                onChange={(value) => update("openingTime", value)}
              />
              <ProfileTimeField
                label="Store Closing Time"
                value={profile.closingTime}
                onChange={(value) => update("closingTime", value)}
              />
              <View style={styles.overtime}>
                <FieldLabel label="Consider Overtime" />
                <Switch
                  accessibilityLabel="Consider Overtime"
                  value={profile.considerOvertime}
                  onValueChange={(value) => update("considerOvertime", value)}
                  trackColor={{ false: "#DFDFE2", true: "#6655AC" }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            {errors.openingTime || errors.closingTime ? (
              <Text style={fieldStyles.error}>
                {errors.openingTime || errors.closingTime}
              </Text>
            ) : null}
            <View style={styles.divider} />
            <SectionHeading
              title="Set Brand Colors"
              subtitle="Define your brand colors for invoices and other documents."
              icon="color-palette-outline"
            />
            <View style={styles.colorRow}>
              <View style={{ gap: 6, maxWidth: "100%" }}>
                <ProfileColorPicker
                  label="Theme Color"
                  value={profile.themeColor}
                  onChange={(value) => update("themeColor", value)}
                />
                {errors.themeColor ? (
                  <Text style={fieldStyles.error}>{errors.themeColor}</Text>
                ) : null}
              </View>
              <View style={{ gap: 6, maxWidth: "100%" }}>
                <ProfileColorPicker
                  label="Font Color"
                  value={profile.fontColor}
                  onChange={(value) => update("fontColor", value)}
                />
                {errors.fontColor ? (
                  <Text style={fieldStyles.error}>{errors.fontColor}</Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

function TextInputPhone({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}) {
  return (
    <TextInput
      accessibilityLabel="Company Contact Number"
      value={value}
      onChangeText={onChange}
      keyboardType="phone-pad"
      maxLength={25}
      style={[fieldStyles.input, invalid && fieldStyles.invalid]}
    />
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F9FC" },
  pageContent: { padding: 14, paddingBottom: 30, gap: 14 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
    backgroundColor: "#F7F9FC",
  },
  topTabs: {
    minHeight: 58,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EFEDF3",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "stretch",
  },
  activeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#1D5FD6",
    paddingHorizontal: 5,
  },
  tabText: { fontSize: 14, color: "#514059", fontWeight: "600" },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 5,
  },
  profileTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0B2F7D",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  profileTabText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  save: {
    minHeight: 36,
    minWidth: 66,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#0B2F7D",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },
  disabled: { opacity: 0.6 },
  form: { gap: 14 },
  card: {
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#EEEBF2",
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 4px rgba(45, 29, 65, 0.04)",
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEDF3",
  },
  cardBody: { padding: 16, gap: 18 },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F3A8C",
  },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#514059" },
  subtitle: { fontSize: 11, color: "#777079", lineHeight: 16 },
  companyRow: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
  companyFields: { flex: 1, alignSelf: "stretch", gap: 16 },
  centerLogo: { alignSelf: "center" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  phoneRow: { flexDirection: "row", gap: 6 },
  stack: { flexDirection: "column", alignItems: "stretch" },
  divider: { height: 1, backgroundColor: "#F0EDF4", marginVertical: 2 },
  locationRow: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  quarter: { width: "23%", flexGrow: 1 },
  half: { width: "47%", flexGrow: 1 },
  full: { width: "100%" },
  hoursRow: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
  overtime: { flex: 0.8, gap: 10, alignItems: "flex-start" },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 28,
    paddingBottom: 8,
  },
  notificationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 14,
  },
  notification: {
    flex: 1,
    minWidth: 250,
    maxWidth: 520,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEEAF7",
    borderRadius: 4,
    alignItems: "center",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAE6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: { flex: 1, gap: 3 },
  notificationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  notificationTitle: {
    flex: 1,
    color: "#635C66",
    fontSize: 12,
    fontWeight: "600",
  },
  error: { fontSize: 12, color: "#B3261E", lineHeight: 18 },
  success: {
    fontSize: 12,
    color: "#1E7F5C",
    backgroundColor: "#EEF8F1",
    padding: 12,
    borderRadius: 4,
  },
});
