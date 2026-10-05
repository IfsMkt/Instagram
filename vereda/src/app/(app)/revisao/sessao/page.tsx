import type { Metadata } from "next";
import { ReviewSession } from "@/components/review/ReviewSession";
import { requireOnboarded } from "@/lib/auth";
import { localDate, safeTimeZone } from "@/lib/domain/dates";
import { RULES } from "@/lib/domain/rules";
import { getReviewSession } from "@/lib/data/review";

export const metadata: Metadata = { title: "Revisão" };

export default async function ReviewSessionPage() {
  const { user, profile } = await requireOnboarded();
  const today = localDate(new Date(), safeTimeZone(profile.timezone));
  const items = await getReviewSession(user.id, today, RULES.reviewSessionSize);
  return <ReviewSession items={items} soundEnabled={profile.sound_enabled} />;
}
