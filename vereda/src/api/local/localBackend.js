// Backend local do Vereda: simula autenticação, entidades e funções do Base44 no
// navegador (dados em localStorage). Usa os mesmos handlers e as mesmas regras RLS
// do backend real. Serve para desenvolvimento, demonstração e testes automatizados.
import { LocalDB, ApiError } from './db.js';
import { SCHEMAS } from './schemas.js';
import * as handlers from '../../../base44/shared/handlers.js';

const FUNCTIONS = {
  content: handlers.getContent,
  'complete-lesson': handlers.completeLesson,
  'submit-review': handlers.submitReview,
  'trial-lesson': handlers.getTrialLesson,
  'claim-guest-progress': handlers.claimGuestProgress,
  'admin-content': handlers.adminContent,
  'delete-account': handlers.deleteAccount,
};

const SESSION_KEY = 'vereda:session:v1';

async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const publicUser = (u) => u && { id: u.id, email: u.email, full_name: u.full_name, role: u.role, created_date: u.created_date };

export function createLocalBackend({ storage = globalThis.localStorage, latency = 0, demoPreview = true, adminEmail = 'admin@vereda.local', adminPassword = 'vereda-admin', now } = {}) {
  const db = new LocalDB({ schemas: SCHEMAS, storage });
  const wait = () => (latency ? new Promise((r) => setTimeout(r, latency)) : Promise.resolve());

  const currentUser = () => {
    let id = null;
    try {
      id = storage.getItem(SESSION_KEY);
    } catch {
      id = null;
    }
    return db.data.users.find((u) => u.id === id) || null;
  };

  const ctxFor = (user) => ({
    user: publicUser(user),
    service: db.service(),
    now: now ? now() : new Date(),
    allowDraft: demoPreview,
    deleteAuthUser: async (u) => {
      db.data.users = db.data.users.filter((x) => x.id !== u.id);
      db.save();
      return true;
    },
  });

  async function createUser({ email, password, full_name, role = 'user' }) {
    const salt = Math.random().toString(36).slice(2);
    const user = { id: `u_${Math.random().toString(36).slice(2, 12)}`, email, full_name: full_name || '', role, salt, password_hash: await hashPassword(password, salt), created_date: new Date().toISOString() };
    db.data.users.push(user);
    db.save();
    return user;
  }

  // Inicialização: conta de administrador de demonstração e conteúdo inicial (como rascunho).
  async function bootstrap() {
    if (!db.data.users.some((u) => u.email === adminEmail)) await createUser({ email: adminEmail, password: adminPassword, full_name: 'Equipe editorial', role: 'admin' });
    if (!(await db.service().Unit.list()).length) await handlers.seedContent({ service: db.service() }, 'sistema (importação inicial)');
  }
  const ready = bootstrap();

  const backend = {
    mode: 'local',
    demoPreview,
    ready,
    auth: {
      async me() {
        await ready;
        return publicUser(currentUser());
      },
      async login(email, password) {
        await ready;
        await wait();
        const user = db.data.users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
        if (!user || user.password_hash !== (await hashPassword(password, user.salt))) throw new ApiError(401, 'E-mail ou senha incorretos.');
        storage.setItem(SESSION_KEY, user.id);
        return publicUser(user);
      },
      async register({ email, password, full_name }) {
        await ready;
        await wait();
        const clean = String(email || '').trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) throw new ApiError(400, 'Informe um e-mail válido.');
        if (!password || password.length < 8) throw new ApiError(400, 'A senha precisa ter pelo menos 8 caracteres.');
        if (db.data.users.some((u) => u.email === clean)) throw new ApiError(409, 'Já existe uma conta com este e-mail.');
        const user = await createUser({ email: clean, password, full_name });
        storage.setItem(SESSION_KEY, user.id);
        return { user: publicUser(user), needsVerification: false };
      },
      async verify() {
        return { ok: true };
      },
      async logout() {
        storage.removeItem(SESSION_KEY);
      },
      async updateMe(data) {
        const user = currentUser();
        if (!user) throw new ApiError(401, 'É preciso entrar na sua conta.');
        if (typeof data.full_name === 'string') user.full_name = data.full_name;
        db.save();
        return publicUser(user);
      },
    },
    get entities() {
      return db.scoped(publicUser(currentUser()));
    },
    async fn(name, payload = {}) {
      await ready;
      await wait();
      const handler = FUNCTIONS[name];
      if (!handler) throw new ApiError(404, `Função desconhecida: ${name}`);
      try {
        return JSON.parse(JSON.stringify(await handler(ctxFor(currentUser()), JSON.parse(JSON.stringify(payload)))));
      } catch (e) {
        if (e instanceof handlers.HttpError) throw new ApiError(e.status, e.message, e.details);
        throw e;
      }
    },
    /** Apenas para testes: acesso direto ao banco. */
    _db: db,
  };
  return backend;
}
