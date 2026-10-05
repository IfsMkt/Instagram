"use client";

import { useState } from "react";
import type { TrackCard } from "@/lib/data/progress";
import { Character } from "../art/Character";
import { Icon } from "../art/Icon";
import { Scene } from "../art/Scene";
import { Sheep } from "../art/Sheep";
import { colorClasses } from "../art/palette";
import { Button, Chip, cx, Notice, ProgressBar } from "../ui";

type Props = {
  cards: TrackCard[];
  activeTrackId: string | null;
  onChoose: (card: TrackCard) => Promise<string | null>;
  mode: "onboarding" | "explore";
};

/** Escolha de jornada: personagem, descrição, cenário e prévia da trilha. */
export function TrackPicker({ cards, activeTrackId, onChoose, mode }: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  async function choose(card: TrackCard) {
    if (pending) return;
    setPending(card.id);
    setError("");
    const err = await onChoose(card);
    if (err) {
      setError(err);
      setPending(null);
    }
  }

  const characterCards = cards.filter((c) => c.kind === "character");
  const general = cards.find((c) => c.kind === "general");

  return (
    <div className="flex flex-col gap-5">
      {error && <Notice tone="error">{error}</Notice>}
      <ul className="grid gap-5 md:grid-cols-2">
        {characterCards.map((card) => {
          const c = colorClasses(card.color);
          const isActive = card.id === activeTrackId;
          const expanded = open === card.id;
          return (
            <li key={card.id} className="flex flex-col overflow-hidden rounded-[28px] border-2 border-line bg-paper shadow-[0_4px_0_0_var(--color-line)]">
              <div className="relative h-36">
                <Scene kind={card.scene} className="absolute inset-0 h-full w-full" />
                <div className="absolute -bottom-3 left-3">
                  {card.character && <Character slug={card.character.slug} size={112} label={`${card.character.name}, ${card.character.title.toLowerCase()} (representação artística)`} />}
                </div>
                {isActive && (
                  <span className="absolute right-3 top-3">
                    <Chip color={card.color}>Jornada ativa</Chip>
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                <div>
                  <h3 className="text-2xl font-extrabold">{card.character?.name}</h3>
                  <p className={cx("text-sm font-extrabold uppercase tracking-wide", c.text)}>{card.character?.title}</p>
                </div>
                <p className="font-bold text-ink">{card.character?.tagline}</p>
                <p className="text-sm font-semibold text-ink-soft">{card.description}</p>
                {card.started && card.total > 0 && (
                  <div className="flex items-center gap-2">
                    <ProgressBar value={card.completed / card.total} color={card.color} label={`Progresso na jornada com ${card.character?.name}`} />
                    <span className="shrink-0 text-xs font-extrabold text-ink-soft">
                      {card.completed}/{card.total}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : card.id)}
                  aria-expanded={expanded}
                  aria-controls={`previa-${card.id}`}
                  className="flex items-center gap-1 self-start text-sm font-extrabold text-ink-soft underline decoration-2 underline-offset-4"
                >
                  <Icon name={expanded ? "up" : "down"} size={16} /> Prévia da trilha
                </button>
                {expanded && (
                  <ol id={`previa-${card.id}`} className={cx("flex flex-col gap-2 rounded-2xl p-3 animate-rise", c.soft)}>
                    {card.units.map((u, i) => (
                      <li key={u.title}>
                        <p className="text-sm font-extrabold">
                          Unidade {i + 1}: {u.title}
                        </p>
                        <p className="text-xs font-semibold text-ink-soft">{u.lessons.join(" · ")}</p>
                      </li>
                    ))}
                  </ol>
                )}
                <div className="mt-auto pt-1">
                  <Button
                    variant="color"
                    color={card.color}
                    block
                    size="lg"
                    onClick={() => void choose(card)}
                    disabled={!!pending || (mode === "explore" && isActive)}
                    aria-busy={pending === card.id}
                  >
                    {pending === card.id
                      ? "Abrindo…"
                      : mode === "explore" && isActive
                        ? "Jornada atual"
                        : card.started && mode === "explore"
                          ? `Continuar com ${card.character?.name}`
                          : `Começar com ${card.character?.name}`}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {general && (
        <div className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-green/40 bg-green-soft/50 p-5 text-center md:flex-row md:text-left">
          <Sheep size={90} label="" />
          <div className="flex-1">
            <h3 className="text-xl font-extrabold">{general.title}</h3>
            <p className="text-sm font-semibold text-ink-soft">{general.description} Guiada pela Mel.</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void choose(general)}
            disabled={!!pending || (mode === "explore" && general.id === activeTrackId)}
            aria-busy={pending === general.id}
          >
            {pending === general.id
              ? "Abrindo…"
              : mode === "explore" && general.id === activeTrackId
                ? "Jornada atual"
                : mode === "onboarding"
                  ? "Prefiro começar pela jornada geral"
                  : general.started
                    ? "Continuar a jornada geral"
                    : "Começar a jornada geral"}
          </Button>
        </div>
      )}
    </div>
  );
}
