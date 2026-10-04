export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function formatDate(dateStr, opts = { day: 'numeric', month: 'long' }) {
  if (!dateStr) return '';
  const d = dateStr.length === 10 ? new Date(`${dateStr}T12:00:00Z`) : new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', { ...opts, timeZone: dateStr.length === 10 ? 'UTC' : undefined }).format(d);
}

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

export const TIMEZONES = [
  ['America/Noronha', 'Fernando de Noronha (UTC−2)'],
  ['America/Sao_Paulo', 'Brasília / São Paulo (UTC−3)'],
  ['America/Bahia', 'Bahia (UTC−3)'],
  ['America/Fortaleza', 'Fortaleza / Nordeste (UTC−3)'],
  ['America/Belem', 'Belém (UTC−3)'],
  ['America/Manaus', 'Manaus (UTC−4)'],
  ['America/Cuiaba', 'Cuiabá (UTC−4)'],
  ['America/Porto_Velho', 'Porto Velho (UTC−4)'],
  ['America/Rio_Branco', 'Rio Branco (UTC−5)'],
  ['Europe/Lisbon', 'Lisboa'],
  ['Africa/Luanda', 'Luanda'],
  ['Africa/Maputo', 'Maputo'],
  ['America/New_York', 'Nova York'],
  ['Europe/London', 'Londres'],
];

export const KNOWLEDGE = {
  comecando: 'Estou começando',
  algumas_historias: 'Conheço algumas histórias',
  ja_estudo: 'Já estudo',
};
export const GOALS = {
  historias: 'Conhecer as histórias',
  ensinamentos_jesus: 'Entender os ensinamentos de Jesus',
  rotina: 'Criar uma rotina de estudo',
  aprofundar: 'Aprofundar conhecimentos',
};
export const TRADITIONS = {
  geral: 'Cristão geral',
  catolico: 'Católico',
  protestante: 'Protestante',
  nao_informar: 'Prefiro não informar',
};
