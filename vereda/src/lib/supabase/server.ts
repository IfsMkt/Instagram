import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requirePublicEnv } from "@/lib/env";

/**
 * Cliente Supabase com a sessão da pessoa (cookies). Respeita RLS.
 * Use em Server Components, Server Actions e Route Handlers.
 */
export async function createClient() {
  const { url, anonKey } = requirePublicEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Em Server Components não é possível gravar cookies; o proxy renova a sessão.
        }
      },
    },
  });
}
