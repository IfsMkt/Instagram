import type { Metadata } from "next";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { requireOnboarded } from "@/lib/auth";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { profile } = await requireOnboarded();
  const zones = Intl.supportedValuesOf("timeZone");
  return <SettingsForm profile={profile} zones={zones} />;
}
