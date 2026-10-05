/**
 * Define o PRIMEIRO administrador (ou concede papéis pelo terminal).
 * Exige a service role key, que só quem administra o projeto possui.
 * A pessoa precisa ter criado a conta pelo app antes.
 *
 * Uso: npm run admin:grant -- pessoa@exemplo.com [admin|editor]
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const [email, role = "admin"] = process.argv.slice(2);
  if (!email || !["admin", "editor"].includes(role)) {
    console.error("Uso: npm run admin:grant -- email@exemplo.com [admin|editor]");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await db.rpc("admin_grant_role", { p_email: email, p_role: role });
  if (error) {
    console.error(`Não foi possível conceder o papel: ${error.message}`);
    process.exit(1);
  }
  console.log(`Papel "${role}" concedido a ${email}.`);
}

main();
