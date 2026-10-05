/** Variáveis públicas (podem ir para o navegador). */
export function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export class ConfigError extends Error {}

export function requirePublicEnv(): { url: string; anonKey: string } {
  const { url, anonKey } = publicEnv();
  if (!url || !anonKey) {
    throw new ConfigError(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY (veja .env.example).",
    );
  }
  return { url, anonKey };
}
