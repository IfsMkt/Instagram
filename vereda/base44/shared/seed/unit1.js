// Unidade 1 — Conhecendo a Bíblia.
// Conteúdo gerado como RASCUNHO: precisa de revisão editorial antes de publicar.
// Nenhuma citação literal de tradução: apenas referências e resumos próprios.
import { mc, tf, fill, order, match, block } from './helpers.js';

const SRC_REF = {
  label: 'Texto bíblico consultado',
  detail: 'Passagens conferidas em traduções de referência; o conteúdo usa apenas resumos próprios, sem citação literal.',
};

export const unit1 = {
  key: 'u1',
  title: 'Conhecendo a Bíblia',
  description: 'O que é a Bíblia, como ela se organiza e como encontrar uma passagem.',
  icon: 'livro',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      key: 'u1l1',
      title: 'O que é a Bíblia?',
      kind: 'licao',
      duration_min: 5,
      objective: 'Entender que a Bíblia é uma coleção de livros e conhecer suas duas grandes partes.',
      references: ['2 Timóteo 3:14-17', 'Lucas 24:44'],
      context:
        'A Bíblia não foi escrita de uma só vez. Ela reúne textos de muitos autores, escritos ao longo de muitos séculos, em lugares e situações diferentes. Para as comunidades cristãs, esses textos formam um conjunto lido como Escritura Sagrada.',
      blocks: [
        block(
          'conceito',
          'Uma biblioteca',
          'A palavra "Bíblia" vem do grego "biblía", que quer dizer "livros". Por isso, ajuda pensar na Bíblia como uma pequena biblioteca: há narrativas, leis, poemas, orações, ditos de sabedoria, profecias e cartas.'
        ),
        block(
          'conceito',
          'Duas grandes partes',
          'O Antigo Testamento reúne os escritos anteriores a Jesus, que também são sagrados para o povo judeu (organizados de outro modo na Bíblia Hebraica). O Novo Testamento reúne os escritos sobre Jesus e sobre as primeiras comunidades cristãs.'
        ),
        block(
          'glossario',
          'Testamento',
          'Aqui, "testamento" não é um documento de herança. A palavra traduz a ideia bíblica de "aliança": um compromisso, um laço entre Deus e seu povo.'
        ),
        block(
          'contexto',
          'Quantos livros?',
          'Na tradição católica, a Bíblia tem 73 livros (46 no Antigo Testamento e 27 no Novo). Na tradição protestante, tem 66 (39 e 27). A diferença está em livros do Antigo Testamento chamados deuterocanônicos pelos católicos — como Tobias, Judite, Sabedoria, Eclesiástico (Sirácida), Baruc e 1 e 2 Macabeus — que muitos protestantes chamam de apócrifos. As igrejas ortodoxas reconhecem ainda alguns outros livros. O Novo Testamento tem 27 livros nessas tradições.'
        ),
        block(
          'biblia_resumo',
          '2 Timóteo 3:14-17',
          'Paulo aconselha Timóteo a permanecer firme no que aprendeu desde a infância nas Sagradas Escrituras. Ele afirma que toda Escritura é inspirada por Deus e é útil para ensinar, corrigir e formar a pessoa para o bem.'
        ),
        block(
          'interpretacao',
          'Como as tradições entendem a Escritura',
          'Cristãos, em geral, afirmam que a Bíblia é inspirada por Deus, mas explicam de formas diferentes como ela se relaciona com outras fontes de ensino. A Igreja Católica ensina que a Escritura e a Tradição transmitem juntas a revelação, interpretadas pelo Magistério. Muitas igrejas protestantes destacam a Escritura como autoridade final ("somente a Escritura"). As igrejas ortodoxas entendem a Escritura dentro da Tradição viva da Igreja.',
          { tradition: 'Católica, protestante e ortodoxa' }
        ),
      ],
      summary: [
        'A Bíblia é uma coleção de livros de vários autores e épocas.',
        'Ela se divide em Antigo e Novo Testamento; "testamento" tem o sentido de aliança.',
        'Bíblias católicas têm 73 livros e protestantes, 66; o Novo Testamento tem 27 livros em ambas.',
      ],
      reflection_prompt: 'O que desperta sua curiosidade ao começar a conhecer a Bíblia?',
      sources: [SRC_REF, { label: 'Contexto histórico', detail: 'Informações gerais sobre o cânon bíblico nas tradições católica, protestante e ortodoxa.' }],
      exercises: [
        mc(
          'De onde vem a palavra "Bíblia"?',
          ['Do grego "biblía", que significa "livros"', 'Do latim "lex", que significa "lei"', 'Do hebraico "shalom", que significa "paz"', 'Do grego "logos", que significa "palavra"'],
          0,
          '"Bíblia" vem do grego "biblía", plural de "biblíon", e quer dizer "livros". O nome combina com o fato de a Bíblia ser uma coleção de livros.',
          'Contexto histórico — origem do nome'
        ),
        tf(
          'O Novo Testamento tem 27 livros tanto nas Bíblias católicas quanto nas protestantes.',
          true,
          'Verdadeiro. A diferença no número total de livros está no Antigo Testamento; o Novo Testamento tem 27 livros nas duas tradições.',
          'Contexto histórico — cânon do Novo Testamento'
        ),
        mc(
          'Por que Bíblias católicas e protestantes têm números diferentes de livros?',
          ['Porque a Bíblia católica não tem o Apocalipse', 'Por causa dos livros deuterocanônicos do Antigo Testamento', 'Porque as Bíblias protestantes têm mais evangelhos', 'Porque o Novo Testamento é diferente em cada uma'],
          1,
          'A diferença está em livros do Antigo Testamento, como Tobias, Judite e 1 e 2 Macabeus. Os católicos os chamam de deuterocanônicos; muitos protestantes, de apócrifos.',
          'Contexto histórico — cânon do Antigo Testamento'
        ),
        fill(
          'Na Bíblia, a palavra "testamento" tem o sentido de ___.',
          ['herança em dinheiro', 'aliança', 'livro de leis', 'profecia'],
          1,
          '"Testamento" traduz a ideia bíblica de aliança: um compromisso entre Deus e seu povo.',
          'Contexto — vocabulário bíblico'
        ),
        match(
          'Associe cada termo à descrição correta.',
          [
            ['Antigo Testamento', 'Escritos anteriores a Jesus, também sagrados para o judaísmo'],
            ['Novo Testamento', 'Escritos sobre Jesus e as primeiras comunidades cristãs'],
            ['2 Timóteo 3:16', 'Afirma que toda Escritura é inspirada e útil para ensinar'],
          ],
          [2, 0, 1],
          'O Antigo Testamento reúne escritos anteriores a Jesus; o Novo, os escritos sobre Jesus e as primeiras comunidades. Em 2 Timóteo 3:16, Paulo fala da inspiração e da utilidade da Escritura.',
          '2 Timóteo 3:14-17'
        ),
      ],
    },
    // ------------------------------------------------------------------ 2
    {
      key: 'u1l2',
      title: 'Como encontrar uma passagem',
      kind: 'licao',
      duration_min: 5,
      objective: 'Ler uma referência bíblica (livro, capítulo e versículo) e localizá-la.',
      references: ['João 3:16 (exemplo de referência)', 'Gênesis 1:1-5 (exemplo de intervalo)', 'Salmo 23'],
      context:
        'Os textos bíblicos foram escritos sem números de capítulos e versículos. Essas divisões foram criadas muito depois, para facilitar a localização das passagens.',
      blocks: [
        block(
          'conceito',
          'Lendo uma referência',
          'Em "Jo 3:16", "Jo" é o livro (Evangelho de João), 3 é o capítulo e 16 é o versículo. Muitas Bíblias católicas usam vírgula no lugar dos dois-pontos: "Jo 3,16". As duas formas indicam o mesmo lugar.'
        ),
        block(
          'conceito',
          'Intervalos e listas',
          '"Gn 1:1-5" indica do versículo 1 ao 5 do capítulo 1 de Gênesis. "Gn 1–2" indica os capítulos 1 e 2 inteiros. O ponto e vírgula separa passagens diferentes, como em "Sl 23; Sl 121".'
        ),
        block(
          'conceito',
          'Abreviações',
          'Algumas abreviações comuns: Gn (Gênesis), Êx (Êxodo), Sl (Salmos), Mt (Mateus), Mc (Marcos), Lc (Lucas), Jo (João), At (Atos). As abreviações podem variar um pouco entre edições; o índice no começo da Bíblia ajuda a conferir.'
        ),
        block(
          'contexto',
          'De onde vieram os números?',
          'A divisão em capítulos é atribuída a Stephen Langton, no início do século XIII. A numeração de versículos do Novo Testamento usada hoje vem da edição de Robert Estienne, de 1551. Como os números vieram depois, às vezes uma frase continua de um versículo para o outro.'
        ),
        block(
          'glossario',
          'Livros com números',
          'Quando um número aparece antes do nome, ele indica qual livro: 1 Samuel e 2 Samuel, 1 Coríntios e 2 Coríntios. Atenção: o Evangelho de João é diferente das cartas 1, 2 e 3 João.'
        ),
        block(
          'contexto',
          'Por que alguns Salmos têm dois números?',
          'Há duas formas antigas de numerar os Salmos: a da Bíblia hebraica e a da tradução grega antiga (seguida também pela tradução latina). Por isso, muitas Bíblias católicas mostram dois números, como "Salmo 23 (22)".'
        ),
      ],
      summary: [
        'Uma referência indica livro, capítulo e versículo, como em Jo 3:16.',
        'O hífen indica intervalo; o ponto e vírgula separa passagens.',
        'Capítulos e versículos foram acrescentados séculos depois da escrita dos textos.',
      ],
      reflection_prompt: 'Que passagem você gostaria de encontrar e ler com calma esta semana?',
      sources: [SRC_REF, { label: 'Contexto histórico', detail: 'Origem das divisões em capítulos (Stephen Langton) e versículos (Robert Estienne).' }],
      exercises: [
        mc(
          'Na referência Jo 3:16, o que o número 3 indica?',
          ['O versículo', 'O livro', 'O capítulo', 'A página'],
          2,
          'Em Jo 3:16, o primeiro número (3) é o capítulo e o segundo (16) é o versículo.',
          'Exemplo: João 3:16'
        ),
        fill(
          'A referência Gn 1:1-5 indica ___ do capítulo 1 de Gênesis.',
          ['apenas os versículos 1 e 5', 'os versículos de 1 a 5', 'os capítulos de 1 a 5', 'a página 15'],
          1,
          'O hífen indica um intervalo contínuo: do versículo 1 ao 5.',
          'Exemplo: Gênesis 1:1-5'
        ),
        tf(
          'As divisões em capítulos e versículos já existiam quando os textos bíblicos foram escritos.',
          false,
          'Falso. Os capítulos foram criados no século XIII (atribuídos a Stephen Langton) e a numeração atual dos versículos do Novo Testamento vem de 1551 (Robert Estienne).',
          'Contexto histórico — divisões do texto'
        ),
        match(
          'Associe cada abreviação ao livro correspondente.',
          [
            ['Gn', 'Gênesis'],
            ['Sl', 'Salmos'],
            ['Mt', 'Mateus'],
            ['At', 'Atos dos Apóstolos'],
          ],
          [3, 1, 0, 2],
          'Gn é Gênesis, Sl é Salmos, Mt é Mateus e At é Atos dos Apóstolos. Em caso de dúvida, consulte o índice de abreviações da sua Bíblia.',
          'Lista de abreviações'
        ),
        mc(
          'Em algumas Bíblias, o Salmo 23 aparece também como Salmo 22. Por quê?',
          ['Houve um erro de impressão', 'Existem duas formas antigas de numerar os Salmos', 'O salmo foi reescrito por outro autor', 'Um dos números indica a página'],
          1,
          'A numeração da Bíblia hebraica e a da tradução grega antiga diferem em parte dos Salmos. Por isso, muitas edições católicas mostram os dois números.',
          'Salmo 23 (22)'
        ),
      ],
    },
    // ------------------------------------------------------------------ 3
    {
      key: 'u1l3',
      title: 'O Antigo Testamento',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer os grandes grupos de livros do Antigo Testamento.',
      references: ['Lucas 24:44', 'Gênesis 1:1'],
      context:
        'O Antigo Testamento foi escrito, em sua maior parte, em hebraico, com alguns trechos em aramaico (como partes de Daniel e de Esdras). Os livros deuterocanônicos são conhecidos principalmente pela tradição grega, ligada à Septuaginta, uma tradução grega das Escrituras feita antes de Jesus.',
      blocks: [
        block(
          'conceito',
          'Pentateuco',
          'Os cinco primeiros livros — Gênesis, Êxodo, Levítico, Números e Deuteronômio — formam o Pentateuco, palavra grega que remete a "cinco volumes". No judaísmo, esse conjunto é a Torá, frequentemente traduzida como "Lei" ou "Instrução".'
        ),
        block(
          'conceito',
          'Livros históricos',
          'Contam a história do povo de Israel depois de Moisés: Josué, Juízes, Rute, 1 e 2 Samuel, 1 e 2 Reis, Crônicas, Esdras, Neemias, entre outros.'
        ),
        block(
          'conceito',
          'Livros poéticos e sapienciais',
          'Reúnem poemas, orações e reflexões sobre a vida: Jó, Salmos, Provérbios, Eclesiastes e Cântico dos Cânticos (e, na Bíblia católica, também Sabedoria e Eclesiástico).'
        ),
        block(
          'conceito',
          'Livros proféticos',
          'Trazem mensagens dos profetas ao povo: Isaías, Jeremias, Ezequiel, Daniel e os doze chamados "profetas menores", como Oseias, Amós e Jonas. "Menores" porque os livros são mais curtos — não porque sejam menos importantes.'
        ),
        block(
          'contexto',
          'A Bíblia Hebraica',
          'No judaísmo, os livros são organizados em três partes: Torá (Lei), Neviim (Profetas) e Ketuvim (Escritos). As iniciais formam a palavra Tanakh.'
        ),
        block(
          'biblia_resumo',
          'Lucas 24:44',
          'Depois da ressurreição, Jesus diz aos discípulos que precisava se cumprir o que estava escrito sobre ele na Lei de Moisés, nos Profetas e nos Salmos — uma forma de se referir às Escrituras de Israel.'
        ),
      ],
      summary: [
        'O Antigo Testamento foi escrito principalmente em hebraico.',
        'Grupos de livros: Pentateuco, históricos, poéticos e sapienciais, proféticos.',
        'No judaísmo, os livros se organizam em Torá, Profetas e Escritos (Tanakh).',
      ],
      reflection_prompt: 'Qual grupo de livros você tem mais vontade de conhecer primeiro? Por quê?',
      sources: [SRC_REF, { label: 'Contexto histórico', detail: 'Línguas do Antigo Testamento, Septuaginta e organização da Bíblia Hebraica.' }],
      exercises: [
        order(
          'Coloque os cinco primeiros livros da Bíblia na ordem em que aparecem.',
          ['Gênesis', 'Êxodo', 'Levítico', 'Números', 'Deuteronômio'],
          [2, 0, 4, 1, 3],
          'A ordem é Gênesis, Êxodo, Levítico, Números e Deuteronômio — o Pentateuco, que abre a Bíblia nas tradições judaica e cristã.',
          'Gênesis a Deuteronômio'
        ),
        mc(
          'Em que língua foi escrita a maior parte do Antigo Testamento?',
          ['Grego', 'Latim', 'Hebraico', 'Português'],
          2,
          'A maior parte foi escrita em hebraico, com alguns trechos em aramaico. O grego é a língua do Novo Testamento e da Septuaginta.',
          'Contexto histórico — línguas da Bíblia'
        ),
        match(
          'Associe cada grupo de livros a exemplos dele.',
          [
            ['Pentateuco', 'Gênesis, Êxodo e Números'],
            ['Livros sapienciais', 'Jó, Provérbios e Eclesiastes'],
            ['Livros proféticos', 'Isaías, Jeremias e Ezequiel'],
          ],
          [1, 2, 0],
          'O Pentateuco são os cinco primeiros livros; Jó, Provérbios e Eclesiastes são sapienciais; Isaías, Jeremias e Ezequiel são proféticos.',
          'Organização do Antigo Testamento'
        ),
        tf(
          'Os "profetas menores" recebem esse nome por serem considerados menos importantes.',
          false,
          'Falso. "Menores" se refere ao tamanho dos livros, que são mais curtos que Isaías, Jeremias ou Ezequiel.',
          'Oseias a Malaquias'
        ),
        fill(
          'Em Lucas 24:44, Jesus menciona a Lei de Moisés, os Profetas e os ___.',
          ['Evangelhos', 'Salmos', 'Atos', 'Apóstolos'],
          1,
          'Jesus fala da Lei de Moisés, dos Profetas e dos Salmos, referindo-se às Escrituras de Israel. Os Evangelhos ainda não haviam sido escritos.',
          'Lucas 24:44'
        ),
      ],
    },
    // ------------------------------------------------------------------ 4
    {
      key: 'u1l4',
      title: 'O Novo Testamento',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer as partes do Novo Testamento e o que cada uma traz.',
      references: ['Lucas 1:1-4', 'Atos 1:1-3'],
      context:
        'O Novo Testamento tem 27 livros escritos em grego. Segundo a maioria dos estudiosos, a maior parte deles foi escrita na segunda metade do século I. As cartas de Paulo estão entre os textos mais antigos.',
      blocks: [
        block(
          'conceito',
          'Evangelhos',
          'São quatro: Mateus, Marcos, Lucas e João. Narram a vida, os ensinamentos, a morte e a ressurreição de Jesus. "Evangelho" quer dizer "boa notícia".'
        ),
        block(
          'glossario',
          'Sinóticos',
          'Mateus, Marcos e Lucas são chamados de evangelhos sinóticos, palavra que sugere "ver junto": por serem parecidos, podem ser lidos lado a lado.'
        ),
        block(
          'conceito',
          'Atos dos Apóstolos',
          'Continua a obra de Lucas e mostra o início das primeiras comunidades cristãs, de Jerusalém até Roma.'
        ),
        block(
          'conceito',
          'Cartas',
          'Textos enviados a comunidades ou pessoas. Muitas são atribuídas a Paulo, como Romanos, Coríntios e Gálatas; outras a Tiago, Pedro, João e Judas. A carta aos Hebreus não traz o nome do autor. A autoria de algumas cartas é discutida pelos estudiosos.'
        ),
        block(
          'conceito',
          'Apocalipse',
          'O último livro usa linguagem simbólica, com visões e imagens. "Apocalipse" vem do grego e significa "revelação". Há diferentes formas de interpretá-lo entre as tradições cristãs.'
        ),
        block(
          'biblia_resumo',
          'Lucas 1:1-4',
          'Lucas conta que muitos já tinham escrito sobre os acontecimentos. Ele diz que investigou tudo com cuidado desde o início e decidiu escrever um relato ordenado a Teófilo, para que ele tivesse segurança sobre o que havia aprendido.'
        ),
      ],
      summary: [
        'O Novo Testamento tem 27 livros, escritos em grego.',
        'Partes: Evangelhos, Atos, Cartas e Apocalipse.',
        '"Evangelho" significa "boa notícia"; "Apocalipse" significa "revelação".',
      ],
      reflection_prompt: 'Lucas escreveu para que Teófilo tivesse segurança sobre o que aprendeu. O que você gostaria de compreender melhor?',
      sources: [SRC_REF, { label: 'Contexto histórico', detail: 'Língua, datação aproximada e organização do Novo Testamento.' }],
      exercises: [
        mc('Quantos são os evangelhos no Novo Testamento?', ['Três', 'Quatro', 'Sete', 'Doze'], 1, 'São quatro: Mateus, Marcos, Lucas e João.', 'Mateus, Marcos, Lucas e João'),
        order(
          'Coloque as partes do Novo Testamento na ordem em que aparecem nas Bíblias.',
          ['Evangelhos', 'Atos dos Apóstolos', 'Cartas', 'Apocalipse'],
          [3, 2, 0, 1],
          'A ordem é: Evangelhos, Atos dos Apóstolos, Cartas e, por último, Apocalipse.',
          'Organização do Novo Testamento'
        ),
        fill(
          'A palavra "evangelho" significa ___.',
          ['revelação final', 'livro sagrado', 'boa notícia', 'lei antiga'],
          2,
          '"Evangelho" vem do grego e quer dizer "boa notícia". "Revelação" é o significado de "apocalipse".',
          'Contexto — vocabulário bíblico'
        ),
        tf(
          'Em Lucas 1:1-4, Lucas afirma que investigou os acontecimentos com cuidado antes de escrever.',
          true,
          'Verdadeiro. Lucas diz que investigou tudo desde o início para escrever um relato ordenado a Teófilo.',
          'Lucas 1:1-4'
        ),
        match(
          'Associe cada parte do Novo Testamento ao que ela apresenta.',
          [
            ['Evangelhos', 'Narram a vida e os ensinamentos de Jesus'],
            ['Atos', 'Mostra o início das primeiras comunidades cristãs'],
            ['Cartas', 'Textos enviados a comunidades e pessoas'],
            ['Apocalipse', 'Linguagem simbólica; o nome significa "revelação"'],
          ],
          [2, 0, 3, 1],
          'Os Evangelhos narram a vida de Jesus; Atos, o início das comunidades; as Cartas foram enviadas a comunidades e pessoas; o Apocalipse usa linguagem simbólica.',
          'Organização do Novo Testamento'
        ),
      ],
    },
    // ------------------------------------------------------------------ 5
    {
      key: 'u1l5',
      title: 'Muitos jeitos de escrever',
      kind: 'licao',
      duration_min: 5,
      objective: 'Reconhecer gêneros literários da Bíblia e por que isso ajuda na leitura.',
      references: ['Salmo 23', 'Provérbios 1:1-7', 'Mateus 13:3'],
      context:
        'Assim como não lemos um poema do mesmo jeito que lemos uma notícia, a Bíblia tem textos de tipos diferentes. Identificar o gênero de um texto ajuda a entender o que ele quer comunicar.',
      blocks: [
        block('conceito', 'Narrativa', 'Conta acontecimentos, com personagens e lugares. Exemplos: Gênesis, Êxodo, Samuel, os Evangelhos e Atos.'),
        block(
          'conceito',
          'Poesia e oração',
          'O livro dos Salmos reúne 150 salmos nas Bíblias católicas e protestantes. A poesia hebraica usa muito o paralelismo: uma linha repete, completa ou contrasta a anterior.'
        ),
        block(
          'conceito',
          'Sabedoria',
          'Provérbios reúne ditos curtos sobre a vida. Logo no início (Pv 1:1-7), o livro diz que seu objetivo é ensinar sabedoria e afirma que o temor do Senhor é o princípio do conhecimento.'
        ),
        block(
          'glossario',
          'Temor do Senhor',
          'Expressão bíblica que costuma ser explicada como reverência e respeito diante de Deus, e não como pavor.'
        ),
        block(
          'conceito',
          'Parábola',
          'História curta que usa situações do dia a dia — sementes, pastores, moedas — para ensinar. Mateus 13 mostra Jesus ensinando muitas coisas por meio de parábolas.'
        ),
        block('conceito', 'Profecia, carta e apocalíptico', 'Profecias trazem mensagens ao povo em nome de Deus; cartas respondem a situações concretas de comunidades; textos apocalípticos usam visões e símbolos.'),
        block(
          'interpretacao',
          'Literal ou simbólico?',
          'Leitores e tradições cristãs divergem sobre quais textos devem ser lidos de forma literal e quais de forma simbólica. Nesta trilha, apresentamos os gêneros sem decidir essas questões por você.',
          { tradition: 'Diversas tradições cristãs' }
        ),
      ],
      summary: [
        'A Bíblia reúne narrativas, poesia, sabedoria, profecia, cartas e textos apocalípticos.',
        'Parábolas são histórias curtas do cotidiano usadas para ensinar.',
        'Reconhecer o gênero ajuda a ler cada texto de forma adequada.',
      ],
      reflection_prompt: 'Qual tipo de texto bíblico — narrativa, poesia, sabedoria ou carta — mais combina com você neste momento?',
      sources: [SRC_REF],
      exercises: [
        match(
          'Associe cada livro ao seu gênero principal.',
          [
            ['Salmos', 'Poesia e oração'],
            ['Provérbios', 'Ditos de sabedoria'],
            ['Romanos', 'Carta'],
            ['Atos', 'Narrativa'],
          ],
          [3, 2, 1, 0],
          'Salmos é poesia e oração; Provérbios reúne ditos de sabedoria; Romanos é uma carta de Paulo; Atos é narrativa.',
          'Salmos; Provérbios; Romanos; Atos'
        ),
        mc(
          'O que é uma parábola?',
          ['Uma lista de leis', 'Uma carta de Paulo', 'Uma história curta do dia a dia usada para ensinar', 'Um tipo de oração cantada'],
          2,
          'Parábolas são histórias curtas com elementos do cotidiano. Jesus as usava com frequência para ensinar.',
          'Mateus 13:3'
        ),
        tf(
          'O livro dos Salmos tem 150 salmos nas Bíblias católicas e protestantes.',
          true,
          'Verdadeiro. As igrejas ortodoxas incluem ainda o Salmo 151.',
          'Livro dos Salmos'
        ),
        fill(
          'Em Mateus 13:3, Jesus ensinava muitas coisas por meio de ___.',
          ['cartas', 'parábolas', 'cânticos', 'leis escritas'],
          1,
          'Mateus 13 apresenta Jesus ensinando a multidão por parábolas, começando pela do semeador.',
          'Mateus 13:3'
        ),
        mc(
          'Por que é útil identificar o gênero literário de um texto bíblico?',
          ['Porque cada tipo de texto tem seu jeito próprio de comunicar', 'Porque só as narrativas são importantes', 'Porque os poemas não fazem parte da Bíblia', 'Porque o gênero define o número de capítulos'],
          0,
          'Um poema, uma carta e uma narrativa comunicam de formas diferentes. Saber o gênero ajuda a não ler um texto com as regras de outro.',
          'Contexto — gêneros literários'
        ),
      ],
    },
    // ------------------------------------------------------------------ revisão
    {
      key: 'u1rev',
      title: 'Revisão da unidade',
      kind: 'revisao_unidade',
      duration_min: 5,
      objective: 'Retomar os principais pontos da unidade "Conhecendo a Bíblia".',
      references: ['2 Timóteo 3:14-17', 'Lucas 24:44', 'Lucas 1:1-4'],
      context: 'Vamos relembrar o que vimos sobre a organização da Bíblia, as referências e os gêneros literários.',
      blocks: [
        block(
          'conceito',
          'Recapitulando',
          'A Bíblia é uma coleção de livros em duas partes. Uma referência indica livro, capítulo e versículo. O Antigo Testamento se organiza em Pentateuco, históricos, poéticos e sapienciais e proféticos; o Novo, em Evangelhos, Atos, Cartas e Apocalipse.'
        ),
      ],
      summary: ['Você revisou a estrutura da Bíblia, como ler referências e os gêneros literários.'],
      reflection_prompt: 'O que mais mudou na forma como você enxerga a Bíblia depois desta unidade?',
      sources: [SRC_REF],
      exercises: [
        tf('A referência Jo 3:16 indica o Evangelho de João, capítulo 3, versículo 16.', true, 'Verdadeiro: livro, capítulo e versículo, nessa ordem.', 'Exemplo: João 3:16'),
        mc('Qual destes livros faz parte do Pentateuco?', ['Salmos', 'Isaías', 'Números', 'Atos'], 2, 'Números é o quarto livro do Pentateuco (Gênesis, Êxodo, Levítico, Números e Deuteronômio).', 'Números'),
        order(
          'Coloque os grupos de livros do Antigo Testamento na ordem em que aparecem nas Bíblias cristãs.',
          ['Pentateuco', 'Livros históricos', 'Livros poéticos e sapienciais', 'Livros proféticos'],
          [2, 3, 0, 1],
          'Nas Bíblias cristãs, vêm primeiro o Pentateuco, depois os históricos, os poéticos e sapienciais e, por fim, os proféticos.',
          'Organização do Antigo Testamento'
        ),
        match(
          'Associe cada número de livros ao que ele corresponde.',
          [
            ['73 livros', 'Bíblia católica'],
            ['66 livros', 'Bíblia protestante'],
            ['27 livros', 'Novo Testamento'],
          ],
          [1, 2, 0],
          'A Bíblia católica tem 73 livros, a protestante 66, e o Novo Testamento tem 27 livros em ambas.',
          'Contexto histórico — cânon bíblico'
        ),
        fill(
          'Na tradição católica, livros como Tobias, Judite e Sabedoria são chamados ___.',
          ['sinóticos', 'deuterocanônicos', 'profetas menores', 'evangelhos'],
          1,
          'São os deuterocanônicos, presentes nas Bíblias católicas. Muitos protestantes os chamam de apócrifos.',
          'Contexto histórico — cânon do Antigo Testamento'
        ),
        mc('Qual gênero predomina no livro dos Salmos?', ['Carta', 'Narrativa', 'Poesia e oração', 'Lei'], 2, 'Os Salmos são poemas e orações, muitos feitos para serem cantados.', 'Livro dos Salmos'),
      ],
    },
  ],
};
