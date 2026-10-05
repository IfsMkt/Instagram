import { Character } from "../art/Character";
import { Sheep } from "../art/Sheep";

export const AVATARS = ["ovelha", "joao", "pedro", "paulo", "moises", "elias", "isaias", "daniel"] as const;

export function Avatar({ avatar, size = 96, label }: { avatar: string; size?: number; label?: string }) {
  if (avatar !== "ovelha" && (AVATARS as readonly string[]).includes(avatar)) return <Character slug={avatar} size={size} label={label ?? ""} />;
  return <Sheep size={size} label={label ?? ""} />;
}
