import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import { getProfile, getUser } from "@/lib/auth";
import { publicEnv } from "@/lib/env";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap" });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo", weight: ["600", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Vereda — Aprenda a Bíblia, um passo por dia", template: "%s · Vereda" },
  description: "Lições curtas, exercícios, revisão e progresso visível para conhecer a Bíblia no seu ritmo.",
  applicationName: "Vereda",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8ec",
};

async function reducedMotionPreference(): Promise<boolean> {
  if (!publicEnv().configured) return false;
  try {
    const user = await getUser();
    if (!user) return false;
    const profile = await getProfile(user.id);
    return Boolean(profile?.reduced_motion);
  } catch {
    return false;
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const reduced = await reducedMotionPreference();
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${baloo.variable}`} data-reduced-motion={reduced ? "true" : "false"}>
      <body className="paper-texture antialiased">
        <a href="#conteudo" className="sr-only-focusable fixed left-3 top-3 z-50 rounded-xl bg-ink px-4 py-2 font-bold text-white">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
