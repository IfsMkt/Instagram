/**
 * Aplica as migrations de supabase/migrations em ordem, uma única vez cada.
 * Uso: DATABASE_URL=postgres://... npm run db:migrate
 * (Alternativa em projetos hospedados: `supabase db push` com a CLI oficial.)
 */
import { config } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Defina DATABASE_URL (string de conexão do Postgres) para aplicar as migrations.");
    process.exit(1);
  }
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query("create schema if not exists app_private");
  await client.query(
    "create table if not exists app_private.applied_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const { rows } = await client.query<{ name: string }>("select name from app_private.applied_migrations");
  const done = new Set(rows.map((r) => r.name));
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    process.stdout.write(`Aplicando ${file}... `);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into app_private.applied_migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log("ok");
    } catch (err) {
      await client.query("rollback");
      console.log("falhou");
      throw err;
    }
  }
  // Avisa o PostgREST para recarregar o esquema (ignorado se não houver PostgREST).
  await client.query("notify pgrst, 'reload schema'");
  await client.end();
  console.log("Migrations em dia.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
