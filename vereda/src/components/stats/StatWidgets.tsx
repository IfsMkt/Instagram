import { Icon } from "../art/Icon";
import { cx } from "../ui";

/** Anel de progresso da meta diária (não depende só de cor: mostra números). */
export function GoalRing({ minutes, goal, size = 84 }: { minutes: number; goal: number; size?: number }) {
  const pct = Math.min(1, minutes / Math.max(1, goal));
  const r = 34;
  const circ = 2 * Math.PI * r;
  const met = minutes >= goal;
  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Meta diária: ${minutes} de ${goal} minutos${met ? ", concluída" : ""}`}>
      <svg viewBox="0 0 80 80" width={size} height={size} aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-cream-deep)" strokeWidth="9" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={met ? "var(--color-green)" : "var(--color-yellow)"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          transform="rotate(-90 40 40)"
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {met ? <Icon name="check" size={26} className="text-green-dark" /> : <span className="text-lg font-extrabold leading-none">{minutes}</span>}
        <span className="text-[10px] font-extrabold text-ink-soft">{met ? "feita!" : `de ${goal} min`}</span>
      </div>
    </div>
  );
}

export function StreakBadge({ days, activeToday }: { days: number; activeToday: boolean }) {
  return (
    <div className="flex items-center gap-2" role="img" aria-label={`Sequência de ${days} ${days === 1 ? "dia" : "dias"}${activeToday ? ", estudou hoje" : ""}`}>
      <span className={cx("flex h-12 w-12 items-center justify-center rounded-2xl", activeToday ? "bg-coral text-white" : "bg-coral-soft text-coral-dark")}>
        <Icon name="flame" size={28} />
      </span>
      <span>
        <span className="block text-2xl font-extrabold leading-none">{days}</span>
        <span className="text-xs font-extrabold text-ink-soft">{days === 1 ? "dia seguido" : "dias seguidos"}</span>
      </span>
    </div>
  );
}

/** Calendário de atividade (5 semanas). Dias com estudo têm símbolo, não só cor. */
export function ActivityCalendar({ days, today }: { days: { date: string; minutes: number; goalMet: boolean }[]; today: string }) {
  const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const first = new Date(`${days[0].date}T12:00:00Z`).getUTCDay();
  const cells: ({ date: string; minutes: number; goalMet: boolean } | null)[] = [...Array(first).fill(null), ...days];
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "UTC" });
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold text-ink-faint" aria-hidden>
        {weekdays.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      <ol className="mt-1 grid grid-cols-7 gap-1.5" aria-label="Calendário de atividade das últimas cinco semanas">
        {cells.map((d, i) =>
          d ? (
            <li
              key={d.date}
              className={cx(
                "flex aspect-square items-center justify-center rounded-xl text-[11px] font-extrabold",
                d.goalMet ? "bg-green text-white" : d.minutes > 0 ? "bg-green-soft text-green-ink" : "bg-cream-deep/70 text-ink-faint",
                d.date === today && "ring-2 ring-ink/50",
              )}
              aria-label={`${fmt.format(new Date(`${d.date}T12:00:00Z`))}: ${d.minutes > 0 ? `${d.minutes} minutos${d.goalMet ? ", meta cumprida" : ""}` : "sem estudo"}`}
            >
              {d.goalMet ? <Icon name="check" size={14} /> : d.minutes > 0 ? "•" : Number(d.date.slice(8))}
            </li>
          ) : (
            <li key={`v${i}`} aria-hidden />
          ),
        )}
      </ol>
      <p className="mt-2 flex flex-wrap gap-3 text-[11px] font-bold text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-3 w-3 rounded bg-green" /> meta cumprida (✓)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-3 w-3 rounded bg-green-soft" /> estudou (•)
        </span>
      </p>
    </div>
  );
}
