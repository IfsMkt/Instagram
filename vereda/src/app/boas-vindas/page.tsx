import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { getProfile, requireUser } from "@/lib/auth";
import { getTrackCards } from "@/lib/data/progress";

export const metadata: Metadata = { title: "Boas-vindas" };

export default async function OnboardingPage() {
  const user = await requireUser("/boas-vindas");
  const profile = await getProfile(user.id);
  if (!profile) redirect("/entrar");
  if (profile.onboarding_completed_at) redirect("/inicio");
  const cards = await getTrackCards(user.id);
  return <Onboarding profile={profile} cards={cards} />;
}
