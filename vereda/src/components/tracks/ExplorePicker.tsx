"use client";

import { useRouter } from "next/navigation";
import { chooseTrack } from "@/app/actions/profile";
import type { TrackCard } from "@/lib/data/progress";
import { TrackPicker } from "./TrackPicker";

export function ExplorePicker({ cards, activeTrackId }: { cards: TrackCard[]; activeTrackId: string | null }) {
  const router = useRouter();
  return (
    <TrackPicker
      cards={cards}
      activeTrackId={activeTrackId}
      mode="explore"
      onChoose={async (card) => {
        const res = await chooseTrack({ trackId: card.id });
        if (!res.ok) return res.error;
        router.push("/jornada");
        router.refresh();
        return null;
      }}
    />
  );
}
