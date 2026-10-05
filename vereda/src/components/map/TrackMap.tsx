import Link from "next/link";
import type { ItemWithStatus, NextAction, TrackState } from "@/lib/domain/progress";
import type { UnitMeta } from "@/lib/data/content";
import { lessonHref } from "@/lib/data/progress";
import { Character } from "../art/Character";
import { Icon } from "../art/Icon";
import { Scene } from "../art/Scene";
import { Sheep } from "../art/Sheep";
import { colorClasses } from "../art/palette";
import { cx, ProgressBar } from "../ui";

const OFFSETS = [0, 56, 84, 56, 0, -56, -84, -56];
const GAP = 104;
const WIDTH = 320;

type Props = {
  trackSlug: string;
  color: string;
  characterSlug: string | null;
  units: UnitMeta[];
  state: TrackState;
  action: NextAction;
  mode?: "public" | "preview";
};

/** Mapa vertical com caminho sinuoso. Estados indicados por ícone + texto, não só cor. */
export function TrackMap({ trackSlug, color, characterSlug, units, state, action, mode = "public" }: Props) {
  const c = colorClasses(color);
  const targetId = action.type === "resume" || action.type === "start" ? action.item.lessonId : null;
  const starts = state.units.map((_, ui) => state.units.slice(0, ui).reduce((n, u) => n + u.items.length, 0));

  return (
    <div className="flex flex-col gap-8">
      {state.units.map((unit, ui) => {
        const meta = units.find((u) => u.id === unit.id);
        const startIndex = starts[ui];
        const points = unit.items.map((_, i) => ({ x: WIDTH / 2 + OFFSETS[(startIndex + i) % OFFSETS.length], y: 48 + i * GAP }));
        const path = points.reduce((d, p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const midY = (prev.y + p.y) / 2;
          return `${d} C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
        }, "");
        const height = 48 + (unit.items.length - 1) * GAP + 64;

        return (
          <section key={unit.id} aria-labelledby={`unidade-${unit.id}`} className="flex flex-col items-center gap-4">
            <header className={cx("relative w-full overflow-hidden rounded-[28px] text-left", c.bg)}>
              <Scene kind={meta?.scene ?? "garden"} className="absolute inset-0 h-full w-full opacity-35" />
              <div className="relative flex items-center gap-3 p-5 text-white">
                <div className="flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-white/90">Unidade {ui + 1}</p>
                  <h2 id={`unidade-${unit.id}`} className="text-xl font-extrabold leading-tight drop-shadow-sm">
                    {unit.title}
                  </h2>
                  {meta?.description && <p className="mt-1 text-sm font-bold text-white/95">{meta.description}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <ProgressBar value={unit.completedCount / unit.total} color="yellow" label={`Progresso da unidade ${unit.title}`} className="bg-white/30" />
                    <span className="shrink-0 text-xs font-extrabold">
                      {unit.completedCount}/{unit.total}
                    </span>
                  </div>
                </div>
                {unit.done && (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow text-ink" aria-label="Unidade concluída">
                    <Icon name="flag" size={24} />
                  </span>
                )}
              </div>
            </header>

            <div className="relative" style={{ width: WIDTH, height, maxWidth: "100%" }}>
              <svg className="absolute inset-0" width={WIDTH} height={height} aria-hidden>
                <path d={path} fill="none" stroke="#f0e2c8" strokeWidth="18" strokeLinecap="round" />
                <path d={path} fill="none" stroke="#d4bf98" strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" />
              </svg>
              <ol className="absolute inset-0">
                {unit.items.map((item, i) => (
                  <MapNode
                    key={item.lessonId}
                    item={item}
                    x={points[i].x}
                    y={points[i].y}
                    isTarget={item.lessonId === targetId}
                    href={lessonHref(item.lessonId, trackSlug, mode)}
                    color={color}
                    characterSlug={characterSlug}
                    side={OFFSETS[(startIndex + i) % OFFSETS.length] > 0 ? "left" : "right"}
                  />
                ))}
              </ol>
            </div>
          </section>
        );
      })}
    </div>
  );
}

const STATUS_LABEL: Record<ItemWithStatus["status"], string> = {
  completed: "concluída",
  in_progress: "em andamento",
  available: "disponível",
  locked: "bloqueada",
};

function MapNode({
  item,
  x,
  y,
  isTarget,
  href,
  color,
  characterSlug,
  side,
}: {
  item: ItemWithStatus;
  x: number;
  y: number;
  isTarget: boolean;
  href: string;
  color: string;
  characterSlug: string | null;
  side: "left" | "right";
}) {
  const c = colorClasses(color);
  const isReview = item.kind === "unit_review";
  const locked = item.status === "locked";
  const icon = locked ? "lock" : item.status === "completed" ? "check" : isReview ? "star" : item.status === "in_progress" ? "play" : "book";
  const label = `${isReview ? "Revisão da unidade" : "Lição"}: ${item.title} (${STATUS_LABEL[item.status]})`;
  const circle = cx(
    "relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-4 text-white transition-transform",
    isReview && "rounded-[22px]",
    locked && "border-line bg-cream-deep text-ink-faint",
    item.status === "completed" && "border-yellow-dark bg-yellow text-ink btn-3d [--btn-shadow:var(--color-yellow-dark)]",
    (item.status === "available" || item.status === "in_progress") && cx("btn-3d border-white", c.bg, c.shadow),
    isTarget && "animate-pulse-ring scale-110",
  );

  return (
    <li className="absolute" style={{ left: x - 34, top: y - 34 }}>
      {locked ? (
        <span role="img" aria-label={label} className={circle}>
          <Icon name={icon} size={28} />
        </span>
      ) : (
        <Link href={href} aria-label={label} className={circle}>
          <Icon name={icon} size={30} />
        </Link>
      )}
      {isTarget && (
        <div className={cx("pointer-events-none absolute top-1/2 flex w-[72px] -translate-y-1/2 flex-col items-center", side === "left" ? "right-[76px]" : "left-[76px]")}>
          {characterSlug ? <Character slug={characterSlug} size={58} label="" framed={false} /> : <Sheep size={58} label="" />}
          <span className="-mt-1 whitespace-nowrap rounded-2xl border-2 border-line bg-paper px-2 py-0.5 text-[11px] font-extrabold text-ink shadow-[0_2px_0_0_var(--color-line)]">
            {item.status === "in_progress" ? "Continuar" : "Começar"}
          </span>
        </div>
      )}
      <span
        className={cx(
          "absolute top-[74px] left-1/2 w-32 -translate-x-1/2 text-center text-[11px] font-extrabold leading-tight",
          locked ? "text-ink-faint" : "text-ink",
        )}
        aria-hidden
      >
        {item.title}
      </span>
    </li>
  );
}
