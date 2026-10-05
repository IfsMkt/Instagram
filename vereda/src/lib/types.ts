export type Profile = {
  id: string;
  display_name: string;
  avatar: string;
  timezone: string;
  daily_goal_minutes: number;
  bible_knowledge: string | null;
  learning_goal: string | null;
  tradition: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
  active_track_id: string | null;
  sound_enabled: boolean;
  reduced_motion: boolean;
  created_at: string;
};

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };
