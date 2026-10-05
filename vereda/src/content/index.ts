import { buildCatalog, type Catalog } from "./compile";
import { TRACKS } from "./tracks";

let cached: Catalog | null = null;

export function getCatalog(): Catalog {
  if (!cached) cached = buildCatalog(TRACKS);
  return cached;
}
