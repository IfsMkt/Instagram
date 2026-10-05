import { b, fill, match, mc, order, tf, type UnitDef } from "../schema";

export const u01: UnitDef = {
  slug: "geral-u01-conhecendo-a-biblia",
  title: "Conhecendo a Bíblia",
  description: "O que é a Bíblia, como ela se organiza e como chegou até nós.",
  scene: "village",
  lessons: [
    {
      slug: "g01-o-que-e-a-biblia",
      title: "Uma biblioteca em um só volume",
      objective: "Entender que a Bíblia é uma coleção de livros variados, escritos ao longo de séculos.",
      references: ["Lucas 24:44", "2 Timóteo 3:16-17"],
      context:
        "Quando abrimos uma Bíblia, parece um único livro. Mas, por dentro, ela reúne dezenas de livros escritos por muitas pessoas, em lugares e épocas diferentes, ao longo de mais de mil anos.",
      blocks: [
        b(
          "explicacao",
          "De onde vem o nome",
          "A palavra “Bíblia” vem do grego “ta biblia”, que quer dizer “os livros”. O nome já conta um segredo: não é um livro só, é uma coleção — quase uma pequena biblioteca.",
        ),
        b(
          "explicacao",
          "Duas grandes partes",
          "A Bíblia cristã tem duas partes. O Antigo Testamento reúne escritos do povo de Israel, em grande parte compartilhados com a Bíblia Hebraica do judaísmo. O Novo Testamento reúne escritos sobre Jesus e as primeiras comunidades cristãs.",
        ),
        b(
          "explicacao",
          "Muitos jeitos de escrever",
          "Dentro dessa coleção há narrativas, leis, poesias, orações, provérbios, profecias, cartas e textos cheios de símbolos. Saber qual é o tipo de texto ajuda muito a ler bem: um poema não se lê como uma carta, e uma carta não se lê como uma lei.",
        ),
        b(
          "resumo",
          "Um exemplo nas palavras de Jesus",
          "No Evangelho de Lucas, Jesus ressuscitado fala aos discípulos sobre o que estava escrito “na Lei de Moisés, nos Profetas e nos Salmos” — uma forma antiga de se referir aos grupos de escritos sagrados de Israel.",
          "Lucas 24:44",
        ),
      ],
      exercises: [
        mc(
          "A palavra “Bíblia” vem do grego e significa:",
          ["Os livros", "A luz", "A lei", "A promessa"],
          0,
          "“Ta biblia” quer dizer “os livros”. O nome lembra que a Bíblia é uma coleção de vários escritos.",
          "Introdução geral",
        ),
        tf(
          "A Bíblia foi escrita por um único autor, em um único ano.",
          false,
          "A Bíblia reúne textos de muitos autores, escritos ao longo de mais de mil anos, em contextos bem diferentes.",
          "Introdução geral",
        ),
        match(
          "Associe cada livro ao tipo de texto que mais aparece nele.",
          [
            ["Salmos", "Poesia e oração"],
            ["Romanos", "Carta"],
            ["Êxodo", "Narrativa e leis"],
            ["Isaías", "Profecia"],
          ],
          "Salmos é um livro de poemas e orações; Romanos é uma carta de Paulo; Êxodo conta a saída do Egito e traz leis; Isaías reúne mensagens proféticas.",
          "Salmos; Romanos 1:1-7; Êxodo 20; Isaías 1:1",
        ),
        mc(
          "Quais são as duas grandes partes da Bíblia cristã?",
          ["Antigo Testamento e Novo Testamento", "Lei e Evangelho", "Salmos e Provérbios", "Profetas e Apóstolos"],
          0,
          "A Bíblia cristã se divide em Antigo Testamento e Novo Testamento.",
          "Introdução geral",
        ),
        fill(
          "Em Lucas, Jesus menciona o que estava escrito na Lei de Moisés, nos Profetas e nos",
          ".",
          ["Salmos", "Evangelhos", "Atos"],
          0,
          "Em Lucas 24:44, Jesus fala da Lei de Moisés, dos Profetas e dos Salmos.",
          "Lucas 24:44",
        ),
      ],
      takeaways: [
        "“Bíblia” quer dizer “os livros”: é uma coleção, não um livro único.",
        "Ela tem duas partes: Antigo e Novo Testamento.",
        "Reconhecer o tipo de texto (poesia, carta, narrativa…) ajuda a ler melhor.",
      ],
      reflection: "Que tipo de texto você tem mais curiosidade de conhecer: histórias, poesias ou cartas? Por quê?",
    },
    {
      slug: "g01-como-ler-referencias",
      title: "Livro, capítulo e versículo",
      objective: "Aprender a ler e encontrar uma referência bíblica.",
      references: ["João 3:16", "Gênesis 1:1-2:3"],
      context:
        "Para achar um trecho em uma coleção tão grande, usamos um “endereço”: o nome do livro, o número do capítulo e o número do versículo. Esse sistema é bem mais recente que os próprios textos.",
      blocks: [
        b(
          "explicacao",
          "Como funciona o endereço",
          "Em “João 3:16”, “João” é o livro, “3” é o capítulo e “16” é o versículo. Em muitas Bíblias católicas no Brasil, a mesma referência aparece com vírgula: “Jo 3,16”. As duas formas dizem a mesma coisa.",
        ),
        b(
          "contexto",
          "Uma invenção posterior",
          "Os autores bíblicos não escreveram capítulos nem versículos. A divisão em capítulos que usamos hoje é atribuída a Stephen Langton, no século XIII. A numeração de versículos se popularizou no século XVI, com o impressor Robert Estienne.",
        ),
        b(
          "explicacao",
          "Abreviações e intervalos",
          "Os livros costumam ser abreviados: Gn (Gênesis), Sl (Salmos), Mt (Mateus), Jo (João). Um intervalo aparece com hífen: “Gênesis 1:1-2:3” começa no capítulo 1, versículo 1, e vai até o capítulo 2, versículo 3.",
        ),
      ],
      exercises: [
        mc(
          "Na referência “João 3:16”, o número 3 indica:",
          ["O capítulo", "O versículo", "A página", "O ano em que foi escrito"],
          0,
          "O primeiro número depois do nome do livro é o capítulo; o segundo é o versículo.",
          "João 3:16",
        ),
        tf(
          "Os capítulos e versículos foram criados pelos próprios autores bíblicos.",
          false,
          "Capítulos e versículos foram acrescentados muitos séculos depois, para facilitar a localização dos trechos.",
          "Contexto histórico",
        ),
        match(
          "Associe cada abreviação ao livro.",
          [
            ["Gn", "Gênesis"],
            ["Sl", "Salmos"],
            ["Mt", "Mateus"],
            ["Jo", "João"],
          ],
          "Essas são abreviações comuns em Bíblias em português.",
          "Gênesis; Salmos; Mateus; João",
        ),
        order(
          "Ordene do maior para o menor.",
          ["Bíblia (a coleção)", "Livro", "Capítulo", "Versículo"],
          "A coleção reúne livros; cada livro tem capítulos; cada capítulo tem versículos.",
          "Introdução geral",
        ),
        fill(
          "Em muitas Bíblias católicas no Brasil, João 3:16 aparece escrito como “Jo 3",
          "16”.",
          [",", "/", "-"],
          0,
          "A vírgula separa capítulo e versículo em várias edições católicas: “Jo 3,16”.",
          "João 3:16",
        ),
      ],
      takeaways: [
        "Uma referência indica livro, capítulo e versículo.",
        "Capítulos e versículos foram criados séculos depois dos textos.",
        "“3:16” e “3,16” são duas formas de escrever a mesma referência.",
      ],
      reflection: "Escolha uma referência que você já ouviu (por exemplo, Salmo 23) e tente encontrá-la numa Bíblia ou aplicativo.",
    },
    {
      slug: "g01-antigo-testamento",
      title: "O Antigo Testamento por dentro",
      objective: "Conhecer os grupos de livros do Antigo Testamento e as diferenças entre tradições.",
      references: ["Gênesis 1:1", "Deuteronômio 34:1-12", "Lucas 24:44"],
      context:
        "O Antigo Testamento é a parte mais longa da Bíblia. Nem todas as tradições contam seus livros do mesmo jeito — e isso é normal: cada uma tem sua história.",
      blocks: [
        b(
          "explicacao",
          "Quatro grupos",
          "Nas Bíblias cristãs, os livros costumam ser agrupados assim: Pentateuco (os cinco primeiros, de Gênesis a Deuteronômio), livros históricos, livros poéticos e sapienciais (como Salmos e Provérbios) e livros proféticos.",
        ),
        b(
          "tradicoes",
          "Quantos livros?",
          "Nas Bíblias protestantes, o Antigo Testamento tem 39 livros. Nas Bíblias católicas, tem 46, porque inclui também os deuterocanônicos: Tobias, Judite, 1 e 2 Macabeus, Sabedoria, Eclesiástico (Sirácida) e Baruc, além de trechos a mais em Ester e Daniel. As Igrejas ortodoxas incluem ainda outros textos.",
        ),
        b(
          "tradicoes",
          "Na tradição judaica",
          "A Bíblia Hebraica tem o mesmo conteúdo do Antigo Testamento protestante, mas organizado em três partes — Torá (Lei), Profetas e Escritos — e contado como 24 livros, porque alguns são agrupados.",
        ),
      ],
      exercises: [
        mc(
          "Os cinco primeiros livros da Bíblia são chamados de:",
          ["Pentateuco", "Evangelhos", "Livros sapienciais", "Cartas"],
          0,
          "Pentateuco quer dizer “cinco rolos”: Gênesis, Êxodo, Levítico, Números e Deuteronômio. Na tradição judaica, esse conjunto é a Torá.",
          "Gênesis a Deuteronômio",
        ),
        match(
          "Associe cada tradição à contagem de livros do Antigo Testamento.",
          [
            ["Bíblias protestantes", "39 livros"],
            ["Bíblias católicas", "46 livros"],
            ["Bíblia Hebraica (contagem judaica)", "24 livros"],
          ],
          "A diferença vem dos deuterocanônicos (aceitos pela tradição católica) e do modo judaico de agrupar alguns livros.",
          "Introdução às tradições",
        ),
        tf(
          "Todas as tradições cristãs concordam com o mesmo número de livros no Antigo Testamento.",
          false,
          "Protestantes contam 39, católicos 46, e as Igrejas ortodoxas incluem ainda outros textos.",
          "Introdução às tradições",
        ),
        order(
          "Coloque os livros do Pentateuco na ordem em que aparecem.",
          ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio"],
          "Essa é a ordem do Pentateuco em todas as Bíblias cristãs e na Bíblia Hebraica.",
          "Gênesis a Deuteronômio",
        ),
        mc(
          "Qual destes livros é um deuterocanônico, presente nas Bíblias católicas?",
          ["Tobias", "Rute", "Jonas", "Provérbios"],
          0,
          "Tobias faz parte dos deuterocanônicos. Rute, Jonas e Provérbios estão em todas as Bíblias cristãs.",
          "Tobias 1:1",
        ),
      ],
      takeaways: [
        "O Antigo Testamento se agrupa em Pentateuco, históricos, poéticos/sapienciais e proféticos.",
        "Protestantes contam 39 livros; católicos, 46 — a diferença são os deuterocanônicos.",
        "A Bíblia Hebraica organiza o mesmo conteúdo em Torá, Profetas e Escritos.",
      ],
      reflection: "Você sabia que as Bíblias têm números de livros diferentes? O que isso desperta de curiosidade em você?",
    },
    {
      slug: "g01-novo-testamento",
      title: "O Novo Testamento por dentro",
      objective: "Conhecer os quatro grupos de livros do Novo Testamento.",
      references: ["Marcos 1:1", "Atos 1:1-3", "Romanos 1:1", "Apocalipse 1:1-3"],
      context:
        "O Novo Testamento foi escrito no século I, nas primeiras gerações depois de Jesus. Católicos, protestantes e ortodoxos concordam que ele tem 27 livros.",
      blocks: [
        b(
          "explicacao",
          "Os quatro Evangelhos",
          "Mateus, Marcos, Lucas e João contam a vida, os ensinamentos, a morte e a ressurreição de Jesus. “Evangelho” vem do grego e quer dizer “boa notícia”. Mateus, Marcos e Lucas são parecidos entre si e por isso são chamados de sinóticos (“vistos juntos”).",
        ),
        b(
          "explicacao",
          "Atos, cartas e Apocalipse",
          "Atos dos Apóstolos conta os primeiros passos das comunidades cristãs. Depois vêm as cartas — muitas atribuídas a Paulo e outras a Tiago, Pedro, João e Judas, além de Hebreus. Por fim, o Apocalipse usa visões e símbolos para falar de esperança.",
        ),
        b(
          "contexto",
          "Por que tantas cartas?",
          "As primeiras comunidades cristãs estavam espalhadas por cidades do Império Romano. Cartas eram a forma de ensinar, corrigir e encorajar à distância. Por isso o Novo Testamento tem tantas.",
        ),
      ],
      exercises: [
        mc(
          "Quantos livros tem o Novo Testamento nas principais tradições cristãs?",
          ["27", "39", "46", "66"],
          0,
          "Católicos, protestantes e ortodoxos concordam com os 27 livros do Novo Testamento.",
          "Introdução geral",
        ),
        fill(
          "A palavra “evangelho” significa",
          ".",
          ["boa notícia", "livro sagrado", "lei antiga"],
          0,
          "“Evangelho” vem do grego “euangelion”: boa notícia.",
          "Marcos 1:1",
        ),
        order(
          "Ordene os grupos de livros como aparecem no Novo Testamento.",
          ["Evangelhos", "Atos dos Apóstolos", "Cartas", "Apocalipse"],
          "O Novo Testamento começa com os Evangelhos, segue com Atos, depois as cartas, e termina com o Apocalipse.",
          "Mateus a Apocalipse",
        ),
        match(
          "Associe cada livro à sua descrição.",
          [
            ["Marcos", "Um dos quatro Evangelhos"],
            ["Atos", "Os primeiros passos das comunidades"],
            ["Romanos", "Carta de Paulo"],
            ["Apocalipse", "Visões e símbolos de esperança"],
          ],
          "Cada grupo tem um papel diferente na coleção do Novo Testamento.",
          "Marcos 1:1; Atos 1:1-3; Romanos 1:1; Apocalipse 1:1-3",
        ),
        tf(
          "Mateus, Marcos e Lucas são chamados de Evangelhos sinóticos.",
          true,
          "Eles são chamados sinóticos porque, colocados lado a lado, mostram muitas semelhanças.",
          "Mateus, Marcos e Lucas",
        ),
      ],
      takeaways: [
        "O Novo Testamento tem 27 livros nas principais tradições cristãs.",
        "Ele se organiza em Evangelhos, Atos, Cartas e Apocalipse.",
        "“Evangelho” quer dizer “boa notícia”.",
      ],
      reflection: "Se você pudesse ler só um Evangelho nesta semana, qual escolheria para começar?",
    },
    {
      slug: "g01-linguas-e-traducoes",
      title: "Línguas e traduções",
      objective: "Saber em que línguas a Bíblia foi escrita e por que existem tantas traduções.",
      references: ["Daniel 2:4", "Esdras 4:8", "Atos 2:5-11"],
      context:
        "Ninguém escreveu a Bíblia em português. Ela chegou até nós por meio de traduções feitas com muito estudo dos textos antigos.",
      blocks: [
        b(
          "contexto",
          "Três línguas antigas",
          "A maior parte do Antigo Testamento foi escrita em hebraico, com alguns trechos em aramaico — como partes de Daniel e de Esdras. O Novo Testamento foi escrito em grego, a língua comum de muitas regiões do Império Romano.",
        ),
        b(
          "contexto",
          "Traduções antigas",
          "Antes de Jesus, judeus que falavam grego já tinham traduzido suas Escrituras: é a Septuaginta, iniciada por volta do século III a.C. Mais tarde, Jerônimo fez a Vulgata, tradução para o latim que marcou a história da Igreja no Ocidente.",
        ),
        b(
          "contexto",
          "Em português",
          "Uma tradução marcante para o português foi a de João Ferreira de Almeida, no século XVII, muito usada por protestantes. Do lado católico, a de Antônio Pereira de Figueiredo, no século XVIII, foi muito difundida. Hoje há dezenas de traduções.",
        ),
        b(
          "explicacao",
          "Por que comparar traduções?",
          "Algumas traduções seguem mais de perto a forma do texto original; outras buscam dizer o sentido em linguagem atual. Comparar duas traduções ajuda a perceber nuances.",
        ),
      ],
      exercises: [
        match(
          "Associe cada parte à língua correspondente.",
          [
            ["Maior parte do Antigo Testamento", "Hebraico"],
            ["Novo Testamento", "Grego"],
            ["Trechos de Daniel e Esdras", "Aramaico"],
            ["Vulgata de Jerônimo", "Latim"],
          ],
          "Hebraico, aramaico e grego são as línguas originais; o latim é a língua da Vulgata, uma tradução.",
          "Daniel 2:4; Esdras 4:8",
        ),
        mc(
          "O que é a Septuaginta?",
          [
            "Uma tradução grega das Escrituras hebraicas",
            "O original hebraico do Gênesis",
            "Uma carta do apóstolo Paulo",
            "Uma tradução para o português",
          ],
          0,
          "A Septuaginta é a antiga tradução grega das Escrituras hebraicas, iniciada antes da época de Jesus.",
          "Contexto histórico",
        ),
        tf(
          "Todo o Antigo Testamento foi escrito em hebraico.",
          false,
          "A maior parte foi escrita em hebraico, mas alguns trechos, como partes de Daniel e Esdras, estão em aramaico.",
          "Daniel 2:4-7:28; Esdras 4:8-6:18",
        ),
        fill(
          "Uma tradução clássica da Bíblia para o português foi feita por João Ferreira de",
          ".",
          ["Almeida", "Figueiredo", "Andrade"],
          0,
          "João Ferreira de Almeida traduziu a Bíblia para o português no século XVII.",
          "Contexto histórico",
        ),
        mc(
          "Por que pode ser útil comparar duas traduções?",
          [
            "Porque cada tradução faz escolhas diferentes de palavras",
            "Porque uma delas sempre está errada",
            "Porque só assim se descobre o número de capítulos",
            "Porque traduções mudam a ordem dos livros",
          ],
          0,
          "Toda tradução faz escolhas. Comparar ajuda a perceber nuances do texto original.",
          "Introdução geral",
        ),
      ],
      takeaways: [
        "A Bíblia foi escrita em hebraico, aramaico e grego.",
        "A Septuaginta (grego) e a Vulgata (latim) são traduções antigas importantes.",
        "Comparar traduções ajuda a entender melhor um texto.",
      ],
      reflection: "Você já leu algum trecho em duas traduções diferentes? Que diferença você notou?",
    },
  ],
  review: {
    slug: "g01-revisao",
    title: "Revisão: Conhecendo a Bíblia",
    intro: "Hora de juntar as peças! Estas questões retomam o que você viu nesta unidade, sem pressa.",
    extra: [
      mc(
        "Qual frase descreve melhor o número de livros da Bíblia?",
        [
          "Depende da tradição: 66 nas Bíblias protestantes e 73 nas católicas",
          "Todas as Bíblias têm exatamente 66 livros",
          "Todas as Bíblias têm exatamente 73 livros",
          "O número de livros muda a cada nova tradução",
        ],
        0,
        "Protestantes: 39 (AT) + 27 (NT) = 66. Católicos: 46 (AT) + 27 (NT) = 73.",
        "Introdução às tradições",
      ),
      tf(
        "O Novo Testamento foi escrito em grego.",
        true,
        "O grego era a língua comum de muitas regiões do Império Romano no século I.",
        "Contexto histórico",
      ),
      match(
        "Associe cada grupo a um exemplo.",
        [
          ["Pentateuco", "Gênesis"],
          ["Livros poéticos", "Salmos"],
          ["Evangelhos", "Lucas"],
          ["Cartas", "Filipenses"],
        ],
        "Gênesis abre o Pentateuco; Salmos é poesia; Lucas é um Evangelho; Filipenses é uma carta de Paulo.",
        "Gênesis; Salmos; Lucas; Filipenses",
      ),
    ],
    takeaways: [
      "A Bíblia é uma coleção de livros em dois Testamentos.",
      "Referências funcionam como endereços: livro, capítulo e versículo.",
      "Tradições diferentes contam livros de formas diferentes.",
    ],
  },
};
