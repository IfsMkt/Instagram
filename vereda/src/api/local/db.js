// Banco local que imita a API de entidades do SDK do Base44
// (list, filter, get, create, bulkCreate, update, delete) e aplica RLS.
import { evaluateRule } from './rls.js';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function matches(record, query) {
  return Object.entries(query || {}).every(([k, v]) => {
    const actual = record[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('$in' in v) return v.$in.includes(actual);
      if ('$ne' in v) return actual !== v.$ne;
      if ('$lte' in v) return actual <= v.$lte;
      if ('$gte' in v) return actual >= v.$gte;
    }
    return actual === v;
  });
}

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return rows.sort((a, b) => {
    const x = a[key] ?? '';
    const y = b[key] ?? '';
    return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
  });
}

export class LocalDB {
  /**
   * @param {object} opts
   * @param {object} opts.schemas  mapa nome → schema (com rls)
   * @param {Storage} opts.storage objeto com getItem/setItem
   * @param {string} opts.key      chave de armazenamento
   */
  constructor({ schemas, storage, key = 'vereda:db:v1' }) {
    this.schemas = schemas;
    this.storage = storage;
    this.key = key;
    this.data = this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(this.key);
      if (raw) return JSON.parse(raw);
    } catch {
      /* armazenamento indisponível ou corrompido: recomeça */
    }
    return { tables: {}, users: [] };
  }

  save() {
    this.storage.setItem(this.key, JSON.stringify(this.data));
  }

  table(name) {
    if (!this.schemas[name]) throw new Error(`Entidade desconhecida: ${name}`);
    return (this.data.tables[name] ||= []);
  }

  /** Entidades vistas por um usuário (null = visitante), com RLS aplicada. */
  scoped(user) {
    return this.makeApi(user, false);
  }

  /** Entidades com acesso de serviço (somente para o backend). */
  service() {
    return this.makeApi(null, true);
  }

  makeApi(user, isService) {
    const api = {};
    for (const name of Object.keys(this.schemas)) api[name] = this.entityApi(name, user, isService);
    return api;
  }

  entityApi(name, user, isService) {
    const db = this;
    const rls = this.schemas[name].rls || {};
    const can = (op, rec) => isService || evaluateRule(rls[op], rec, user);
    const deny = (op) => {
      throw new ApiError(user ? 403 : 401, `Sem permissão para ${op} ${name}.`);
    };
    const readable = () => db.table(name).filter((r) => can('read', r));
    const findOrThrow = (id) => {
      const rec = db.table(name).find((r) => r.id === id);
      if (!rec || !can('read', rec)) throw new ApiError(404, `${name} não encontrado.`);
      return rec;
    };
    const build = (data) => {
      const now = new Date().toISOString();
      const { id, created_date, updated_date, created_by, ...rest } = data || {};
      return { ...clone(rest), id: uid(), created_date: now, updated_date: now, created_by: isService ? 'service' : user?.email };
    };

    return {
      async list(sort, limit) {
        const rows = sortRows(readable().map(clone), sort);
        return limit ? rows.slice(0, limit) : rows;
      },
      async filter(query, sort, limit) {
        const rows = sortRows(readable().filter((r) => matches(r, query)).map(clone), sort);
        return limit ? rows.slice(0, limit) : rows;
      },
      async get(id) {
        return clone(findOrThrow(id));
      },
      async create(data) {
        if (!isService && !user) deny('criar');
        const rec = build(data);
        if (!can('create', rec)) deny('criar');
        db.table(name).push(rec);
        db.save();
        return clone(rec);
      },
      async bulkCreate(list) {
        const out = [];
        for (const d of list) out.push(await this.create(d));
        return out;
      },
      async update(id, data) {
        const rec = findOrThrow(id);
        if (!can('update', rec)) deny('alterar');
        const { id: _i, created_date, created_by, ...rest } = data || {};
        Object.assign(rec, clone(rest), { updated_date: new Date().toISOString() });
        db.save();
        return clone(rec);
      },
      async delete(id) {
        const rec = findOrThrow(id);
        if (!can('delete', rec)) deny('excluir');
        const t = db.table(name);
        t.splice(t.indexOf(rec), 1);
        db.save();
        return { success: true };
      },
    };
  }
}
