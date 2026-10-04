// Carrega os schemas (com RLS) diretamente de base44/entities/*.jsonc.
import { parseJsonc } from './rls.js';

const files = import.meta.glob('../../../base44/entities/*.jsonc', { query: '?raw', import: 'default', eager: true });

export const SCHEMAS = Object.fromEntries(
  Object.values(files).map((text) => {
    const schema = parseJsonc(text);
    return [schema.name, schema];
  })
);
