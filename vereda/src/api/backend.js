// Escolhe o backend: Base44 quando VITE_BASE44_APP_ID estiver definido; caso
// contrário, o backend local de demonstração (dados apenas neste navegador).
import { createLocalBackend } from './local/localBackend.js';
import { createBase44Backend } from './base44Backend.js';

export { ApiError } from './local/db.js';

const env = import.meta.env || {};

export const backend = env.VITE_BASE44_APP_ID
  ? createBase44Backend({ appId: env.VITE_BASE44_APP_ID, serverUrl: env.VITE_BASE44_SERVER_URL })
  : createLocalBackend({
      latency: env.MODE === 'test' ? 0 : 150,
      demoPreview: env.VITE_LOCAL_DEMO_PREVIEW !== 'false',
      adminPassword: env.VITE_LOCAL_ADMIN_PASSWORD || 'vereda-admin',
    });

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
