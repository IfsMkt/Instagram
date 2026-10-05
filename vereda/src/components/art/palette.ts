/** Paleta usada em ilustrações SVG (espelha os tokens de globals.css). */
export const COLORS = {
  green: { base: "#3f9e4d", dark: "#2c7a38", soft: "#dcf1d6" },
  blue: { base: "#3b82d0", dark: "#2a63a6", soft: "#dbeafb" },
  coral: { base: "#ec6f5a", dark: "#c4513e", soft: "#fde2dc" },
  yellow: { base: "#f3bd3c", dark: "#c99418", soft: "#fdf0c8" },
  lilac: { base: "#9a7fd8", dark: "#7558b8", soft: "#ece4fa" },
  teal: { base: "#2a9d92", dark: "#1d776e", soft: "#d4f0ec" },
  orange: { base: "#ee8636", dark: "#c4651b", soft: "#fde5d0" },
  indigo: { base: "#5a67cf", dark: "#4049a8", soft: "#e1e4f9" },
} as const;

export type ColorKey = keyof typeof COLORS;

export function colorOf(name: string | null | undefined): (typeof COLORS)[ColorKey] {
  return (name && name in COLORS ? COLORS[name as ColorKey] : COLORS.green);
}

/** Classes Tailwind por cor (literais completos para o compilador encontrar). */
export const COLOR_CLASSES: Record<ColorKey, { bg: string; soft: string; text: string; border: string; ring: string; shadow: string }> = {
  green: { bg: "bg-green", soft: "bg-green-soft", text: "text-green-dark", border: "border-green", ring: "ring-green", shadow: "[--btn-shadow:var(--color-green-dark)]" },
  blue: { bg: "bg-blue", soft: "bg-blue-soft", text: "text-blue-dark", border: "border-blue", ring: "ring-blue", shadow: "[--btn-shadow:var(--color-blue-dark)]" },
  coral: { bg: "bg-coral", soft: "bg-coral-soft", text: "text-coral-dark", border: "border-coral", ring: "ring-coral", shadow: "[--btn-shadow:var(--color-coral-dark)]" },
  yellow: { bg: "bg-yellow", soft: "bg-yellow-soft", text: "text-yellow-dark", border: "border-yellow", ring: "ring-yellow", shadow: "[--btn-shadow:var(--color-yellow-dark)]" },
  lilac: { bg: "bg-lilac", soft: "bg-lilac-soft", text: "text-lilac-dark", border: "border-lilac", ring: "ring-lilac", shadow: "[--btn-shadow:var(--color-lilac-dark)]" },
  teal: { bg: "bg-teal", soft: "bg-teal-soft", text: "text-teal-dark", border: "border-teal", ring: "ring-teal", shadow: "[--btn-shadow:var(--color-teal-dark)]" },
  orange: { bg: "bg-orange", soft: "bg-orange-soft", text: "text-orange-dark", border: "border-orange", ring: "ring-orange", shadow: "[--btn-shadow:var(--color-orange-dark)]" },
  indigo: { bg: "bg-indigo", soft: "bg-indigo-soft", text: "text-indigo-dark", border: "border-indigo", ring: "ring-indigo", shadow: "[--btn-shadow:var(--color-indigo-dark)]" },
};

export function colorClasses(name: string | null | undefined) {
  return name && name in COLOR_CLASSES ? COLOR_CLASSES[name as ColorKey] : COLOR_CLASSES.green;
}
