import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

/**
 * Destino dos links enviados por e-mail (confirmação de cadastro e
 * recuperação de senha). Aceita os dois formatos do Supabase:
 * - `?code=...` (fluxo PKCE, padrão)
 * - `?token_hash=...&type=...` (modelo de e-mail personalizado; funciona em outro dispositivo)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"), "/inicio");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (ok) return NextResponse.redirect(new URL(next, url.origin));
  return NextResponse.redirect(new URL("/entrar?aviso=link-invalido", url.origin));
}
