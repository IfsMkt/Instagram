// Backend real: SDK do Base44 (autenticação, entidades e funções hospedadas).
import { createClient } from '@base44/sdk';
import { ApiError } from './local/db.js';

function toApiError(err) {
  const status = err?.response?.status || err?.status || 500;
  const body = err?.response?.data || {};
  return new ApiError(status, body.error || body.message || err?.message || 'Erro de comunicação com o servidor.', body.details);
}

const wrap = async (p) => {
  try {
    return await p;
  } catch (e) {
    throw toApiError(e);
  }
};

export function createBase44Backend({ appId, serverUrl }) {
  const client = createClient({ appId, ...(serverUrl ? { serverUrl } : {}) });
  const entityNames = ['Unit', 'Lesson', 'Exercise', 'Profile', 'UserStats', 'LessonProgress', 'LessonAttempt', 'XPEvent', 'DailyActivity', 'ReviewItem', 'ReviewSession', 'UserAchievement', 'Favorite', 'Note'];

  const entities = Object.fromEntries(
    entityNames.map((name) => {
      const e = client.entities[name];
      return [
        name,
        {
          list: (sort, limit) => wrap(e.list(sort, limit)),
          filter: (query, sort, limit) => wrap(e.filter(query, sort, limit)),
          get: (id) => wrap(e.get(id)),
          create: (data) => wrap(e.create(data)),
          update: (id, data) => wrap(e.update(id, data)),
          delete: (id) => wrap(e.delete(id)),
        },
      ];
    })
  );

  return {
    mode: 'base44',
    demoPreview: false,
    ready: Promise.resolve(),
    auth: {
      async me() {
        try {
          if (!(await client.auth.isAuthenticated())) return null;
          return await client.auth.me();
        } catch {
          return null;
        }
      },
      async login(email, password) {
        const res = await wrap(client.auth.loginViaEmailPassword(email, password));
        return res.user;
      },
      async register({ email, password }) {
        await wrap(client.auth.register({ email, password }));
        return { needsVerification: true };
      },
      async verify({ email, code, password }) {
        await wrap(client.auth.verifyOtp({ email, otpCode: code }));
        if (password) await wrap(client.auth.loginViaEmailPassword(email, password));
        return { ok: true };
      },
      async resendCode(email) {
        await wrap(client.auth.resendOtp(email));
      },
      async logout() {
        client.auth.logout(window.location.origin);
      },
      async updateMe(data) {
        return wrap(client.auth.updateMe(data));
      },
    },
    entities,
    async fn(name, payload = {}) {
      const res = await wrap(client.functions.invoke(name, payload));
      return res.data;
    },
  };
}
