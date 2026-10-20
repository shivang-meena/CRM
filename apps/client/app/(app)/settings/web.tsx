import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import CompanyProfileScreen from "@/settings/CompanyProfileScreen";

export default function WebSettingsRoute() {
  const { role } = useAuth();
  if (role !== "admin") return <Redirect href="/" />;
  return <CompanyProfileScreen />;
}
