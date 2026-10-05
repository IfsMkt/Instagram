/**
 * Referência do dia: resumo próprio (paráfrase, não citação literal) e uma
 * reflexão curta e opcional. Rodízio por dia do ano.
 */
export type DailyReference = { reference: string; summary: string; reflection: string };

export const DAILY_REFERENCES: DailyReference[] = [
  {
    reference: "Salmos 23:1-3",
    summary: "O salmista compara Deus a um pastor que conduz a pastos verdes e águas tranquilas e renova as forças.",
    reflection: "O que tem renovado suas forças nesta semana?",
  },
  {
    reference: "Salmos 119:105",
    summary: "A palavra de Deus é comparada a uma lâmpada para os pés e uma luz para o caminho.",
    reflection: "Uma lâmpada ilumina o próximo passo, não a estrada inteira. Qual é o seu próximo passo hoje?",
  },
  {
    reference: "Mateus 11:28-30",
    summary: "Jesus convida quem está cansado e sobrecarregado a ir até ele e encontrar descanso.",
    reflection: "Que peso você gostaria de deixar um pouco de lado hoje?",
  },
  {
    reference: "Josué 1:9",
    summary: "Josué é encorajado a ser forte e corajoso, sem medo, pois Deus estaria com ele por onde andasse.",
    reflection: "Em que situação você precisa de um pouco mais de coragem?",
  },
  {
    reference: "Isaías 40:31",
    summary: "Quem espera no Senhor renova as forças: sobe com asas como águias, corre e não se cansa.",
    reflection: "Esperar também pode ser um tempo de preparo. Como você vive suas esperas?",
  },
  {
    reference: "Lamentações 3:22-23",
    summary: "Mesmo em meio à tristeza, o autor lembra que o amor fiel de Deus não acaba e se renova a cada manhã.",
    reflection: "O que há de novo para agradecer nesta manhã?",
  },
  {
    reference: "Mateus 6:34",
    summary: "Jesus aconselha a não se angustiar com o dia de amanhã, porque cada dia já tem suas próprias preocupações.",
    reflection: "Qual preocupação pode esperar até amanhã?",
  },
  {
    reference: "Filipenses 4:6-7",
    summary: "Paulo encoraja a não viver ansioso, mas apresentar tudo a Deus em oração, com gratidão, e promete uma paz que guarda o coração.",
    reflection: "Pelo que você é grato hoje, mesmo que seja algo pequeno?",
  },
  {
    reference: "1 Coríntios 13:4-7",
    summary: "Paulo descreve o amor: paciente, bondoso, sem inveja nem orgulho, que não guarda rancor e tudo suporta.",
    reflection: "Qual dessas características do amor você quer praticar hoje?",
  },
  {
    reference: "Miqueias 6:8",
    summary: "O profeta resume o que Deus pede: praticar a justiça, amar a misericórdia e caminhar com humildade.",
    reflection: "Como a justiça e a bondade podem aparecer em um gesto simples do seu dia?",
  },
  {
    reference: "Marcos 12:30-31",
    summary: "Jesus aponta dois grandes mandamentos: amar a Deus de todo o coração e amar o próximo como a si mesmo.",
    reflection: "Quem é o seu “próximo” hoje?",
  },
  {
    reference: "João 8:12",
    summary: "Jesus diz que é a luz do mundo e que quem o segue não andará em trevas.",
    reflection: "Onde você gostaria de ver mais luz na sua vida?",
  },
  {
    reference: "Romanos 12:12",
    summary: "Paulo encoraja a ser alegre na esperança, paciente nas dificuldades e perseverante na oração.",
    reflection: "Qual dessas três atitudes está mais difícil para você agora?",
  },
  {
    reference: "Salmos 46:1",
    summary: "O salmo afirma que Deus é refúgio e força, socorro sempre presente nas dificuldades.",
    reflection: "Onde você costuma buscar abrigo quando as coisas apertam?",
  },
  {
    reference: "Provérbios 3:5-6",
    summary: "O texto aconselha confiar no Senhor de todo o coração, sem se apoiar apenas no próprio entendimento.",
    reflection: "Em que decisão você gostaria de ter mais clareza?",
  },
  {
    reference: "Eclesiastes 3:1",
    summary: "Há um tempo certo para cada coisa debaixo do céu.",
    reflection: "Este é um tempo de quê para você?",
  },
  {
    reference: "Mateus 5:9",
    summary: "Jesus chama de felizes os que promovem a paz, pois serão chamados filhos de Deus.",
    reflection: "Onde você pode ser uma pessoa que promove paz hoje?",
  },
  {
    reference: "Lucas 6:31",
    summary: "Jesus ensina a tratar os outros do jeito que gostaríamos de ser tratados.",
    reflection: "Que gentileza você gostaria de receber — e pode oferecer hoje?",
  },
  {
    reference: "Gálatas 5:22-23",
    summary: "Paulo lista o fruto do Espírito: amor, alegria, paz, paciência, amabilidade, bondade, fidelidade, mansidão e domínio próprio.",
    reflection: "Qual desses frutos você quer cultivar nesta semana?",
  },
  {
    reference: "Hebreus 12:1-2",
    summary: "A vida de fé é comparada a uma corrida feita com perseverança, deixando de lado o que atrapalha.",
    reflection: "O que tem atrapalhado o seu passo?",
  },
  {
    reference: "Salmos 139:13-14",
    summary: "O salmista agradece por ter sido formado de modo admirável desde o ventre da mãe.",
    reflection: "Que qualidade sua você pode reconhecer com gratidão hoje?",
  },
  {
    reference: "Isaías 43:1",
    summary: "Deus diz ao seu povo que não tenha medo, porque foi chamado pelo nome e pertence a ele.",
    reflection: "Como é ser chamado pelo próprio nome por alguém que se importa?",
  },
  {
    reference: "Tiago 1:19",
    summary: "Tiago aconselha a ser rápido para ouvir, lento para falar e lento para se irar.",
    reflection: "Em qual conversa de hoje você pode ouvir um pouco mais?",
  },
  {
    reference: "1 João 4:18",
    summary: "O texto afirma que no amor não há medo, e que o amor perfeito lança fora o medo.",
    reflection: "Que medo perde força quando você se sente amado?",
  },
];

export function referenceForDay(isoDay: string): DailyReference {
  const [y, m, d] = isoDay.split("-").map(Number);
  const dayOfYear = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
  return DAILY_REFERENCES[dayOfYear % DAILY_REFERENCES.length];
}
