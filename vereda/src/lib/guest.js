// Estado do visitante (antes de criar conta): respostas do onboarding e a
// primeira lição experimentada. É enviado ao backend no cadastro.
import { readJSON, writeJSON } from './storage.js';

const KEY = 'vereda:guest:v1';

export const getGuest = () => readJSON(KEY, {});
export const setGuest = (patch) => writeJSON(KEY, { ...getGuest(), ...patch });
export const clearGuest = () => writeJSON(KEY, null);
