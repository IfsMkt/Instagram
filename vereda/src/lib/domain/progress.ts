/**
 * Lógica única de progresso, compartilhada por Início, Mapa e Lições.
 * Funções puras: recebem a estrutura visível da trilha e o estado da pessoa.
 */

export type TrackItem = {
  lessonId: string;
  unitId: string;
  kind: "lesson" | "unit_review";
  title: string;
};

export type TrackUnit = {
  id: string;
  title: string;
  items: TrackItem[];
};

export type UserTrackState = {
  completed: ReadonlySet<string>;
  /** Desbloqueios gravados para esta trilha (nunca são desfeitos). */
  unlocked: ReadonlySet<string>;
  /** Tentativas abertas: lessonId → etapa salva e última atualização. */
  inProgress: ReadonlyMap<string, { attemptId: string; step: number; updatedAt: string }>;
};

export type ItemStatus = "completed" | "in_progress" | "available" | "locked";

export type ItemWithStatus = TrackItem & {
  index: number;
  status: ItemStatus;
  savedStep?: number;
};

export type UnitWithStatus = {
  id: string;
  title: string;
  items: ItemWithStatus[];
  completedCount: number;
  total: number;
  done: boolean;
};

export type TrackState = {
  units: UnitWithStatus[];
  items: ItemWithStatus[];
  completedCount: number;
  total: number;
};

/**
 * Regra de desbloqueio:
 * - o primeiro item da trilha está sempre liberado;
 * - um item com desbloqueio gravado continua liberado para sempre;
 * - um item cujo anterior foi concluído está liberado;
 * - um item concluído (inclusive em outra trilha) aparece como concluído.
 */
export function computeTrackState(units: TrackUnit[], state: UserTrackState): TrackState {
  const flat: TrackItem[] = units.flatMap((u) => u.items);
  const items: ItemWithStatus[] = flat.map((item, index) => {
    const prev = index > 0 ? flat[index - 1] : null;
    const open = state.inProgress.get(item.lessonId);
    let status: ItemStatus;
    if (state.completed.has(item.lessonId) && !open) {
      status = "completed";
    } else {
      const unlocked =
        index === 0 ||
        state.unlocked.has(item.lessonId) ||
        state.completed.has(item.lessonId) ||
        (prev !== null && state.completed.has(prev.lessonId));
      if (!unlocked) status = "locked";
      else if (open) status = "in_progress";
      else status = "available";
    }
    return { ...item, index, status, savedStep: open?.step };
  });

  let cursor = 0;
  const unitStates: UnitWithStatus[] = units.map((u) => {
    const unitItems = items.slice(cursor, cursor + u.items.length);
    cursor += u.items.length;
    const completedCount = unitItems.filter((i) => state.completed.has(i.lessonId)).length;
    return {
      id: u.id,
      title: u.title,
      items: unitItems,
      completedCount,
      total: unitItems.length,
      done: unitItems.length > 0 && completedCount === unitItems.length,
    };
  });

  return {
    units: unitStates,
    items,
    completedCount: items.filter((i) => state.completed.has(i.lessonId)).length,
    total: items.length,
  };
}

export type NextAction =
  | { type: "resume"; item: ItemWithStatus; step: number }
  | { type: "start"; item: ItemWithStatus }
  | { type: "all_done" }
  | { type: "no_content" };

/**
 * "Continuar minha jornada":
 * 1. retoma a lição interrompida (mais recente) da trilha, no ponto salvo;
 * 2. senão, abre a próxima lição liberada e não concluída, na ordem;
 * 3. para quem está começando, isso é a primeira lição;
 * 4. depois de uma unidade + revisão, a ordem leva à unidade seguinte;
 * 5. tudo concluído → oferece revisão ou outra jornada.
 * Nunca aponta para item bloqueado, vazio ou não publicado (só recebe itens visíveis).
 */
export function nextAction(track: TrackState, state: UserTrackState): NextAction {
  if (track.items.length === 0) return { type: "no_content" };

  const open = track.items
    .filter((i) => i.status === "in_progress")
    .sort((a, b) => {
      const ua = state.inProgress.get(a.lessonId)?.updatedAt ?? "";
      const ub = state.inProgress.get(b.lessonId)?.updatedAt ?? "";
      return ub.localeCompare(ua);
    });
  if (open.length > 0) {
    const item = open[0];
    return { type: "resume", item, step: item.savedStep ?? 0 };
  }

  const next = track.items.find((i) => i.status === "available");
  if (next) return { type: "start", item: next };

  return { type: "all_done" };
}

/** Item seguinte na ordem da trilha (para gravar o desbloqueio ao concluir). */
export function followingItem(units: TrackUnit[], lessonId: string): TrackItem | null {
  const flat = units.flatMap((u) => u.items);
  const index = flat.findIndex((i) => i.lessonId === lessonId);
  if (index < 0) return null;
  return flat[index + 1] ?? null;
}

/** Um item pode ser aberto? (bloqueados não). */
export function canOpen(track: TrackState, lessonId: string): boolean {
  const item = track.items.find((i) => i.lessonId === lessonId);
  return !!item && item.status !== "locked";
}

/** Unidade atual: a que contém o próximo passo (ou a última). */
export function currentUnit(track: TrackState, action: NextAction): UnitWithStatus | null {
  if (track.units.length === 0) return null;
  if (action.type === "resume" || action.type === "start") {
    return track.units.find((u) => u.id === action.item.unitId) ?? null;
  }
  return track.units[track.units.length - 1];
}
