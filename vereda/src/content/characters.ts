import type { CharacterDef } from "./schema";

/**
 * Personagens das jornadas. As ilustrações são representações artísticas
 * originais, não retratos históricos.
 */
export const CHARACTERS: Record<string, CharacterDef> = {
  joao: {
    slug: "joao",
    name: "João",
    title: "Apóstolo",
    tagline: "O pescador que virou discípulo — não confundir com João Batista.",
    description:
      "Siga João, filho de Zebedeu, desde o chamado à beira do lago até os relatos dos Evangelhos, e conheça o Evangelho que a tradição associa a ele.",
    color: "blue",
    scene: "sea",
  },
  pedro: {
    slug: "pedro",
    name: "Pedro",
    title: "Apóstolo",
    tagline: "Coragem, tropeços e recomeços.",
    description:
      "Caminhe com Simão Pedro: o chamado, a convivência com Jesus, a negação, a restauração e sua atuação nas primeiras comunidades em Atos.",
    color: "coral",
    scene: "sea",
  },
  paulo: {
    slug: "paulo",
    name: "Paulo",
    title: "Apóstolo",
    tagline: "Estradas, navios e muitas cartas.",
    description:
      "Acompanhe Saulo de Tarso da conversão às viagens pelo Mediterrâneo, conheça as comunidades que ele visitou e descubra como ler suas cartas.",
    color: "lilac",
    scene: "road",
  },
  moises: {
    slug: "moises",
    name: "Moisés",
    title: "Líder e profeta",
    tagline: "Do rio Nilo ao monte Sinai.",
    description:
      "Do cesto no rio ao chamado na sarça, da saída do Egito à aliança no Sinai e aos anos no deserto: a grande jornada do Êxodo.",
    color: "yellow",
    scene: "desert",
  },
  elias: {
    slug: "elias",
    name: "Elias",
    title: "Profeta",
    tagline: "Fogo no monte e um murmúrio suave.",
    description:
      "Conheça a missão de Elias em tempos de crise nos livros dos Reis: a seca, o monte Carmelo, o encontro no Horebe e a passagem do manto a Eliseu.",
    color: "orange",
    scene: "mountain",
  },
  isaias: {
    slug: "isaias",
    name: "Isaías",
    title: "Profeta",
    tagline: "Visões de justiça, consolo e paz.",
    description:
      "Entenda o contexto do livro de Isaías, o chamado do profeta no templo e os grandes temas de justiça, esperança e consolo.",
    color: "teal",
    scene: "city",
  },
  daniel: {
    slug: "daniel",
    name: "Daniel",
    title: "Personagem profético",
    tagline: "Fidelidade e oração longe de casa.",
    description:
      "Viva com Daniel e seus amigos o exílio na Babilônia: escolhas difíceis, sonhos de reis, a cova dos leões, a oração e as visões do livro.",
    color: "indigo",
    scene: "palace",
  },
};
