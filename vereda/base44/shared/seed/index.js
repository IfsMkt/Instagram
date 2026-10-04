// Conteúdo inicial do Vereda. Tudo entra como RASCUNHO (status "rascunho") e só
// fica visível para estudantes depois de revisado e publicado por um administrador.
import { unit1 } from './unit1.js';
import { unit2 } from './unit2.js';

const comingSoon = (key, title, description, icon) => ({ key, title, description, icon, lessons: [] });

export const SEED_UNITS = [
  unit1,
  unit2,
  comingSoon('u3', 'Abraão e sua família', 'O chamado de Abraão e as histórias de seus descendentes.', 'tenda'),
  comingSoon('u4', 'Moisés e o Êxodo', 'A saída do Egito, a aliança e a caminhada no deserto.', 'monte'),
  comingSoon('u5', 'Reis, salmos e profetas', 'Os reis de Israel, a poesia dos Salmos e a voz dos profetas.', 'coroa'),
  comingSoon('u6', 'A vida de Jesus', 'Nascimento, ministério e encontros de Jesus nos Evangelhos.', 'caminho'),
  comingSoon('u7', 'Parábolas e ensinamentos', 'As histórias e os ensinamentos de Jesus.', 'semente'),
  comingSoon('u8', 'Morte e ressurreição de Jesus', 'Os últimos dias de Jesus e o anúncio da ressurreição.', 'sol'),
  comingSoon('u9', 'A igreja primitiva', 'As primeiras comunidades cristãs em Atos e nas cartas.', 'casa'),
  comingSoon('u10', 'Fé na vida cotidiana', 'Ensinamentos bíblicos aplicados ao dia a dia.', 'folha'),
];

export const SEED_EDITORIAL_NOTE =
  'Conteúdo inicial gerado com auxílio de IA. Requer revisão bíblica, histórica e teológica antes da publicação.';

export const TRANSLATION_POLICY = {
  literal_quotes: false,
  translation: null,
  note: 'Nenhuma citação literal. O conteúdo usa referências bíblicas e resumos próprios. Para incluir citações literais, registre aqui uma tradução com licença compatível.',
};
