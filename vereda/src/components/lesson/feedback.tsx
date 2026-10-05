"use client";

import { useEffect, useRef } from "react";
import { Icon } from "../art/Icon";
import { cx } from "../ui";

/** Painel de feedback explicativo após verificar uma resposta. */
export function FeedbackPanel({ correct, explanation, reference }: { correct: boolean; explanation: string; reference: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className={cx(
        "animate-rise rounded-3xl border-2 px-5 py-4 outline-none",
        correct ? "border-green bg-green-soft text-green-ink" : "border-coral bg-coral-soft text-coral-dark",
      )}
    >
      <p className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name={correct ? "check-circle" : "info"} size={26} />
        {correct ? "Isso mesmo!" : "Quase! Vamos entender juntos."}
      </p>
      <p className="mt-2 font-semibold text-ink">{explanation}</p>
      {reference && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-3 py-1 text-xs font-extrabold text-ink-soft">
          <Icon name="book" size={14} /> {reference}
        </p>
      )}
      {!correct && <p className="mt-2 text-xs font-bold text-ink-soft">Esta questão vai aparecer de novo na sua revisão para fixar.</p>}
    </div>
  );
}

/** Sons opcionais gerados no próprio navegador (sem arquivos externos). */
export function playTone(kind: "correct" | "wrong" | "complete") {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = kind === "correct" ? [660, 880] : kind === "wrong" ? [300, 240] : [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Som é opcional; ignore falhas.
  }
}

const CONFETTI_COLORS = ["#3f9e4d", "#3b82d0", "#ec6f5a", "#f3bd3c", "#9a7fd8", "#2a9d92"];

/** Confete em CSS (desligado com movimento reduzido). */
export function Confetti({ count = 36 }: { count?: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${(i * 97) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--delay": `${(i % 9) * 0.08}s`,
              "--dur": `${2.2 + (i % 5) * 0.3}s`,
              "--drift": `${((i % 7) - 3) * 18}px`,
              transform: `rotate(${i * 23}deg)`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
