import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ConfigError, requirePublicEnv } from "@/lib/env";

let cached: SupabaseClient | null = null;

/**
 * Cliente com a service role key. SOMENTE no servidor.
 * Ignora RLS: sempre filtre explicitamente pelo usuário autenticado.
 */
export function adminClient(): SupabaseClient {
  if (cached) return cached;
  const { url } = requirePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new ConfigError("SUPABASE_SERVICE_ROLE_KEY não definida no servidor.");
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
