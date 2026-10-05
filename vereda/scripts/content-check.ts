/** Valida o catálogo de conteúdo e imprime a contagem. Uso: npm run content:check */
import { getCatalog } from "../src/content";
import { validateCatalog } from "../src/content/compile";

const catalog = getCatalog();
const errors = validateCatalog(catalog);
const units = catalog.tracks.reduce((n, t) => n + t.units.length, 0);
const lessons = [...catalog.lessons.values()];
const regular = lessons.filter((l) => l.kind === "lesson").length;
const reviews = lessons.filter((l) => l.kind === "unit_review").length;
const placements = catalog.tracks.reduce((n, t) => n + t.units.reduce((m, u) => m + u.lessonSlugs.length, 0), 0);
const exercises = lessons.reduce((n, l) => n + l.exercises.length, 0);
console.log(`Trilhas: ${catalog.tracks.length} · Personagens: ${catalog.characters.length} · Unidades: ${units}`);
console.log(`Lições únicas: ${regular} · Revisões de unidade: ${reviews} · Posições nas trilhas: ${placements} · Exercícios: ${exercises}`);
if (errors.length) {
  console.error(`\n${errors.length} problema(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("Catálogo válido.");
