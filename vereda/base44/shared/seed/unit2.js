// Unidade 2 — Criação e primeiros relatos (Gênesis 1–11).
// Conteúdo gerado como RASCUNHO: precisa de revisão editorial antes de publicar.
// Nenhuma citação literal de tradução: apenas referências e resumos próprios.
import { mc, tf, fill, order, match, block } from './helpers.js';

const SRC_REF = {
  label: 'Texto bíblico consultado',
  detail: 'Gênesis 1–11, conferido em traduções de referência; o conteúdo usa apenas resumos próprios, sem citação literal.',
};

const READING_NOTE = block(
  'interpretacao',
  'Como ler estes relatos?',
  'Cristãos leem Gênesis 1–11 de formas diferentes. Há quem entenda esses relatos como descrição literal de fatos e há quem os leia como narrativas teológicas, que falam de Deus, do ser humano e do mundo sem a intenção de ser um relato científico. Essa diferença existe tanto entre católicos quanto entre protestantes. Aqui, focamos no que o texto diz.',
  { tradition: 'Diversas tradições cristãs' }
);

export const unit2 = {
  key: 'u2',
  title: 'Criação e primeiros relatos',
  description: 'Os primeiros capítulos de Gênesis: criação, o jardim, Caim e Abel, Noé e Babel.',
  icon: 'semente',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      key: 'u2l1',
      title: 'No princípio: a criação',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer o relato da criação em sete dias e suas ideias centrais.',
      references: ['Gênesis 1:1–2:3'],
      context:
        '"Gênesis" vem do grego e significa "origem" ou "princípio". Os capítulos 1 a 11 tratam das origens do mundo e da humanidade; a partir do capítulo 12, o livro acompanha Abraão e sua família. O capítulo 1 tem um estilo muito organizado, com frases que se repetem a cada dia.',
      blocks: [
        block(
          'biblia_resumo',
          'Gênesis 1:1–2:3',
          'No princípio, Deus cria os céus e a terra. Em seis dias, por sua palavra, ele dá forma ao mundo: a luz; o firmamento, que separa as águas; a terra seca e as plantas; o sol, a lua e as estrelas; os peixes e as aves; os animais terrestres e o ser humano. No sétimo dia, Deus descansa e abençoa esse dia.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 1:26-31',
          'Deus cria o ser humano, homem e mulher, à sua imagem, e confia a eles o cuidado das demais criaturas. Ao final, o texto diz que Deus viu tudo o que tinha feito e que era muito bom.'
        ),
        block('glossario', 'Firmamento', 'Palavra usada em muitas traduções para a "abóbada" do céu que, no relato, separa as águas de cima das águas de baixo.'),
        block(
          'interpretacao',
          'Imagem de Deus',
          'A expressão de Gênesis 1:27 é entendida por muitas tradições judaicas e cristãs como base da dignidade de todo ser humano. O sentido exato da expressão é explicado de maneiras diferentes pelos intérpretes.',
          { tradition: 'Tradições judaicas e cristãs' }
        ),
        block(
          'interpretacao',
          'Os sete dias',
          'O Catecismo da Igreja Católica afirma que a Escritura apresenta a obra da criação de modo simbólico, como uma sucessão de seis dias de trabalho seguidos do descanso do sétimo (CIC 337). Entre protestantes, há quem leia os dias como dias literais e há quem os leia de forma literária ou simbólica.',
          { tradition: 'Católica e protestante' }
        ),
      ],
      summary: [
        'Gênesis significa "origem"; os capítulos 1–11 tratam das origens.',
        'Em Gênesis 1, Deus cria em seis dias e descansa no sétimo.',
        'O ser humano é criado, homem e mulher, à imagem de Deus.',
      ],
      reflection_prompt: 'O relato termina dizendo que tudo era muito bom. O que, na criação, mais desperta gratidão ou admiração em você?',
      sources: [SRC_REF, { label: 'Interpretação católica', detail: 'Catecismo da Igreja Católica, §337.' }],
      exercises: [
        order(
          'Ordene estas obras na sequência dos dias em que aparecem em Gênesis 1.',
          ['A luz', 'A terra seca e as plantas', 'O sol, a lua e as estrelas', 'Os peixes e as aves', 'Os animais terrestres e o ser humano'],
          [3, 0, 4, 2, 1],
          'Luz (1º dia), firmamento (2º), terra seca e plantas (3º), sol, lua e estrelas (4º), peixes e aves (5º), animais terrestres e ser humano (6º).',
          'Gênesis 1:3-31'
        ),
        mc(
          'O que acontece no sétimo dia, segundo Gênesis 2:2-3?',
          ['Deus cria o ser humano', 'Deus descansa e abençoa o dia', 'Deus cria a luz', 'Começa o dilúvio'],
          1,
          'No sétimo dia, Deus conclui a obra, descansa e abençoa esse dia.',
          'Gênesis 2:2-3'
        ),
        tf(
          'Segundo Gênesis 1:27, Deus criou o ser humano, homem e mulher, à sua imagem.',
          true,
          'Verdadeiro. O versículo afirma que homem e mulher foram criados à imagem de Deus.',
          'Gênesis 1:27'
        ),
        fill(
          'Ao final do sexto dia, Gênesis 1:31 diz que Deus viu que tudo era ___.',
          ['incompleto', 'passageiro', 'muito bom', 'perigoso'],
          2,
          'Ao longo do capítulo, Deus vê que cada obra é boa; ao final, tudo é descrito como muito bom.',
          'Gênesis 1:31'
        ),
        mc(
          'O que significa o nome "Gênesis"?',
          ['Origem, princípio', 'Lei', 'Canção', 'Revelação'],
          0,
          '"Gênesis" vem do grego e significa origem ou princípio — o livro trata das origens do mundo e do povo de Israel.',
          'Contexto — nome do livro'
        ),
      ],
    },
    // ------------------------------------------------------------------ 2
    {
      key: 'u2l2',
      title: 'O jardim do Éden',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer o segundo relato da criação e o que ele destaca sobre o ser humano.',
      references: ['Gênesis 2:4-25', 'Mateus 19:4-6'],
      context:
        'A partir de Gênesis 2:4, começa um relato com outro estilo e outro foco: em vez dos sete dias, ele se aproxima do ser humano, do jardim e das relações. Nesse trecho, Deus é chamado de "Senhor Deus".',
      blocks: [
        block('biblia_resumo', 'Gênesis 2:7', 'O Senhor Deus forma o ser humano do pó da terra e sopra em suas narinas o fôlego de vida, e ele se torna um ser vivente.'),
        block(
          'glossario',
          'Adão',
          'Em hebraico, "adam" (ser humano) soa parecido com "adamah" (terra, solo). O jogo de palavras reforça a ligação do ser humano com a terra.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 2:8-17',
          'Deus planta um jardim no Éden e coloca ali o homem para cultivá-lo e guardá-lo. Ele pode comer de todas as árvores, menos da árvore do conhecimento do bem e do mal.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 2:18-25',
          'Deus diz que não é bom que o homem esteja sozinho. O homem dá nome aos animais, mas nenhum deles é uma companhia correspondente. Deus forma a mulher a partir de uma costela do homem, e ele a reconhece como semelhante a si. O texto conclui que os dois se tornam uma só carne.'
        ),
        block(
          'contexto',
          'Um texto retomado depois',
          'Em Mateus 19:4-6, ao responder a uma pergunta sobre o casamento, Jesus retoma Gênesis 1:27 e 2:24.'
        ),
        READING_NOTE,
      ],
      summary: [
        'Gênesis 2 traz um segundo relato, centrado no ser humano e nas relações.',
        'O ser humano é formado do pó da terra e recebe o fôlego de vida.',
        'O jardim deve ser cultivado e guardado; uma árvore é proibida.',
      ],
      reflection_prompt: 'O texto diz que não é bom estar sozinho. Quem são as pessoas que caminham com você?',
      sources: [SRC_REF],
      exercises: [
        mc(
          'De que o ser humano é formado em Gênesis 2:7?',
          ['Da água do rio', 'Do pó da terra', 'De uma árvore', 'Da luz'],
          1,
          'O Senhor Deus forma o ser humano do pó da terra e sopra nele o fôlego de vida.',
          'Gênesis 2:7'
        ),
        tf(
          'Em Gênesis 2, Deus proíbe comer da árvore do conhecimento do bem e do mal.',
          true,
          'Verdadeiro. O homem pode comer de todas as árvores do jardim, exceto dessa.',
          'Gênesis 2:16-17'
        ),
        order(
          'Ordene os acontecimentos de Gênesis 2.',
          ['Deus forma o homem do pó da terra', 'Deus planta um jardim no Éden', 'O homem dá nome aos animais', 'Deus forma a mulher'],
          [2, 0, 3, 1],
          'Primeiro o homem é formado (2:7), depois o jardim é plantado (2:8), o homem dá nome aos animais (2:19-20) e a mulher é formada (2:21-22).',
          'Gênesis 2:7-22'
        ),
        fill(
          'Deus coloca o homem no jardim para ___ e guardá-lo.',
          ['vendê-lo', 'cultivá-lo', 'abandoná-lo', 'cercá-lo'],
          1,
          'O ser humano recebe a tarefa de cultivar e guardar o jardim.',
          'Gênesis 2:15'
        ),
        mc(
          'Qual ideia de Gênesis 2 Jesus retoma ao falar sobre o casamento em Mateus 19?',
          ['Deus descansou no sétimo dia', 'O homem deu nome aos animais', 'Os dois se tornam uma só carne', 'Deus plantou um jardim'],
          2,
          'Em Mateus 19:4-6, Jesus retoma Gênesis 2:24: os dois se tornam uma só carne.',
          'Gênesis 2:24; Mateus 19:4-6'
        ),
      ],
    },
    // ------------------------------------------------------------------ 3
    {
      key: 'u2l3',
      title: 'A escolha no jardim',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer o relato de Gênesis 3 e distinguir o texto das tradições posteriores.',
      references: ['Gênesis 3'],
      context:
        'Gênesis 3 continua a história do jardim. É um dos textos mais comentados da Bíblia e recebeu muitas interpretações ao longo dos séculos.',
      blocks: [
        block(
          'biblia_resumo',
          'Gênesis 3:1-7',
          'A serpente questiona a ordem de Deus. A mulher come do fruto da árvore proibida e o dá ao homem, que também come. Os dois percebem que estão nus e se cobrem com folhas de figueira.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 3:8-13',
          'Eles se escondem de Deus. Quando Deus pergunta o que aconteceu, o homem diz que a mulher lhe deu o fruto, e a mulher diz que a serpente a enganou.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 3:14-24',
          'Deus anuncia as consequências para a serpente, a mulher e o homem. Antes de saírem, Deus faz roupas de pele para vesti-los. Eles são enviados para fora do jardim, e querubins guardam o caminho da árvore da vida.'
        ),
        block(
          'conceito',
          'Fruto, não maçã',
          'O texto não diz qual era o fruto. A imagem da maçã veio de tradições artísticas e populares posteriores, talvez influenciada pelo latim, em que "malum" pode significar tanto "mal" quanto "maçã".'
        ),
        block('glossario', 'Querubim', 'Ser celestial que, na Bíblia, aparece ligado à presença de Deus e à guarda de lugares santos.'),
        block(
          'interpretacao',
          'Pecado original',
          'A Igreja Católica e muitas igrejas protestantes leem este capítulo com a doutrina do "pecado original", embora a expliquem de modos diferentes. A tradição ortodoxa costuma falar em "pecado ancestral", com ênfase nas consequências herdadas, como a mortalidade. No judaísmo, o texto é lido sem essa doutrina.',
          { tradition: 'Católica, protestante, ortodoxa e judaica' }
        ),
      ],
      summary: [
        'Em Gênesis 3, o homem e a mulher comem do fruto proibido e se escondem de Deus.',
        'O texto não diz que o fruto era uma maçã.',
        'Deus os veste antes de saírem do jardim.',
      ],
      reflection_prompt: 'O homem e a mulher se escondem e culpam outros. Em que situações é difícil assumir as próprias escolhas?',
      sources: [SRC_REF],
      exercises: [
        tf(
          'Gênesis 3 afirma que o fruto comido era uma maçã.',
          false,
          'Falso. O texto fala apenas em "fruto". A maçã é uma tradição posterior, comum na arte.',
          'Gênesis 3:6'
        ),
        order(
          'Ordene os acontecimentos de Gênesis 3.',
          ['A serpente questiona a ordem de Deus', 'Eles comem do fruto e percebem que estão nus', 'Eles se escondem de Deus', 'São enviados para fora do jardim'],
          [2, 0, 3, 1],
          'A serpente fala (3:1), eles comem e percebem a nudez (3:6-7), se escondem (3:8) e, por fim, saem do jardim (3:23-24).',
          'Gênesis 3'
        ),
        mc(
          'Quando Deus pergunta o que aconteceu, como o homem responde?',
          ['Pede para sair do jardim', 'Diz que não comeu nada', 'Diz que a mulher lhe deu o fruto', 'Culpa os querubins'],
          2,
          'O homem diz que foi a mulher quem lhe deu o fruto; a mulher, por sua vez, diz que a serpente a enganou.',
          'Gênesis 3:12-13'
        ),
        fill(
          'Para se cobrirem, eles usam folhas de ___.',
          ['oliveira', 'videira', 'figueira', 'palmeira'],
          2,
          'O texto diz que eles juntaram folhas de figueira para se cobrir.',
          'Gênesis 3:7'
        ),
        mc(
          'O que Deus faz por eles antes de saírem do jardim?',
          ['Faz roupas de pele para vesti-los', 'Dá a eles uma arca', 'Constrói uma casa', 'Entrega a eles a Lei'],
          0,
          'Deus faz roupas de pele para o homem e a mulher e os veste.',
          'Gênesis 3:21'
        ),
      ],
    },
    // ------------------------------------------------------------------ 4
    {
      key: 'u2l4',
      title: 'Caim e Abel',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer a história de Caim e Abel e perceber o que o texto diz e o que deixa em aberto.',
      references: ['Gênesis 4:1-16', 'Hebreus 11:4'],
      context: 'Fora do jardim, a história continua com a primeira família. Gênesis 4 mostra como a violência entra nas relações entre irmãos.',
      blocks: [
        block(
          'biblia_resumo',
          'Gênesis 4:1-5',
          'Eva dá à luz Caim e, depois, Abel. Abel é pastor de ovelhas e Caim cultiva o solo. Os dois apresentam ofertas a Deus; Deus se agrada da oferta de Abel, mas não da de Caim, que fica irado.'
        ),
        block('biblia_resumo', 'Gênesis 4:6-7', 'Deus fala com Caim e o adverte: o pecado está à porta, desejando dominá-lo, mas Caim pode dominá-lo.'),
        block(
          'biblia_resumo',
          'Gênesis 4:8-12',
          'Caim ataca e mata Abel no campo. Quando Deus pergunta por Abel, Caim diz que não sabe e pergunta se seria ele o responsável por guardar o irmão. Deus diz que o sangue de Abel clama a ele desde a terra.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 4:13-16',
          'Caim teme ser morto. Deus coloca nele um sinal para que ninguém o mate, e Caim vai morar na terra de Node, a leste do Éden.'
        ),
        block(
          'interpretacao',
          'Por que a oferta de Abel foi aceita?',
          'Gênesis não explica claramente. A carta aos Hebreus (11:4) diz que Abel ofereceu seu sacrifício pela fé. Outros intérpretes observam que Abel trouxe as primeiras crias do rebanho. Por haver leituras diferentes, essa pergunta não tem uma única resposta certa nesta lição.',
          { tradition: 'Diversas leituras judaicas e cristãs' }
        ),
      ],
      summary: [
        'Caim cultivava o solo; Abel era pastor de ovelhas.',
        'Deus adverte Caim antes do crime: ele pode dominar o pecado.',
        'Mesmo depois do crime, Deus protege a vida de Caim com um sinal.',
      ],
      reflection_prompt: 'Caim pergunta se é responsável por guardar o irmão. O que significa, para você, cuidar de quem está por perto?',
      sources: [SRC_REF],
      exercises: [
        match(
          'Associe cada nome à informação correta.',
          [
            ['Caim', 'Cultivava o solo'],
            ['Abel', 'Era pastor de ovelhas'],
            ['Node', 'Terra onde Caim foi morar'],
          ],
          [2, 0, 1],
          'Caim cultivava o solo, Abel era pastor de ovelhas e, depois do crime, Caim foi morar na terra de Node.',
          'Gênesis 4:2; 4:16'
        ),
        mc(
          'O que Deus diz a Caim antes do crime?',
          ['Que sua oferta seria aceita no dia seguinte', 'Que o pecado está à porta, mas ele pode dominá-lo', 'Que ele deveria deixar a família', 'Que Abel tinha culpa'],
          1,
          'Deus adverte Caim de que o pecado está à porta, mas que ele pode dominá-lo.',
          'Gênesis 4:6-7'
        ),
        tf(
          'Em Gênesis 4:15, Deus coloca um sinal em Caim para que ninguém o mate.',
          true,
          'Verdadeiro. Mesmo após o crime, Deus protege a vida de Caim.',
          'Gênesis 4:15'
        ),
        order(
          'Ordene os acontecimentos de Gênesis 4.',
          ['Caim e Abel apresentam ofertas', 'Deus adverte Caim', 'Caim mata Abel', 'Caim vai morar em Node'],
          [3, 1, 0, 2],
          'As ofertas (4:3-5), a advertência (4:6-7), o crime (4:8) e a ida para Node (4:16).',
          'Gênesis 4:1-16'
        ),
        mc(
          'Gênesis 4 explica claramente por que Deus aceitou a oferta de Abel?',
          ['Sim: porque Abel era o irmão mais velho', 'Sim: porque Caim ofereceu animais', 'Não: o texto não explica, e há diferentes leituras', 'Sim: porque Abel ofereceu mais vezes'],
          2,
          'O texto não dá a explicação. Hebreus 11:4 fala da fé de Abel, e outros intérpretes destacam as primeiras crias que ele ofereceu. Aliás, Caim era o mais velho e quem ofereceu animais foi Abel.',
          'Gênesis 4:3-5; Hebreus 11:4'
        ),
      ],
    },
    // ------------------------------------------------------------------ 5
    {
      key: 'u2l5',
      title: 'Noé e o dilúvio',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer o relato do dilúvio e a aliança de Deus com Noé.',
      references: ['Gênesis 6–9'],
      context:
        'Gênesis 6–9 narra o dilúvio. Outros povos da antiga Mesopotâmia também tinham relatos de uma grande inundação, como o que aparece na Epopeia de Gilgamesh; estudiosos comparam esses textos para entender melhor o contexto.',
      blocks: [
        block('biblia_resumo', 'Gênesis 6:5-8', 'Deus vê que a maldade se espalhou pela terra e se entristece. Mas Noé encontra favor diante de Deus.'),
        block(
          'biblia_resumo',
          'Gênesis 6:13-22',
          'Deus orienta Noé a construir uma arca e a levar nela sua família e animais. Noé faz tudo como Deus ordenou.'
        ),
        block(
          'conceito',
          'Quantos animais?',
          'O texto traz duas indicações: em Gênesis 6:19-20, um casal de cada espécie; em Gênesis 7:2-3, sete pares dos animais puros e das aves, e um par dos demais.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 7:11–8:12',
          'A chuva cai por quarenta dias e quarenta noites, e as águas cobrem a terra. Depois, a arca para sobre os montes de Ararate. Noé solta um corvo e, depois, uma pomba; numa das vezes, ela volta com uma folha de oliveira no bico.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 9:8-17',
          'Deus faz uma aliança com Noé, seus descendentes e todos os seres vivos: não haverá outro dilúvio para destruir a terra. O arco nas nuvens é o sinal dessa aliança.'
        ),
        block(
          'interpretacao',
          'Um dilúvio universal?',
          'Há cristãos que entendem o dilúvio como um evento que cobriu todo o planeta, outros como uma inundação regional descrita de forma ampla, e outros leem o relato principalmente por sua mensagem teológica sobre julgamento, cuidado e aliança.',
          { tradition: 'Diversas tradições cristãs' }
        ),
      ],
      summary: [
        'Noé constrói a arca e faz tudo como Deus ordena.',
        'Após o dilúvio, a pomba volta com uma folha de oliveira.',
        'Deus faz uma aliança com toda a criação; o arco nas nuvens é o sinal.',
      ],
      reflection_prompt: 'A história termina com uma promessa e um sinal. Que sinais de recomeço você reconhece na sua vida?',
      sources: [SRC_REF, { label: 'Contexto histórico', detail: 'Relatos mesopotâmicos de inundação (Epopeia de Gilgamesh).' }],
      exercises: [
        order(
          'Ordene os acontecimentos do relato do dilúvio.',
          [
            'Noé constrói a arca',
            'A chuva cai por quarenta dias e quarenta noites',
            'A arca para sobre os montes de Ararate',
            'A pomba volta com uma folha de oliveira',
            'Deus mostra o arco nas nuvens como sinal da aliança',
          ],
          [2, 4, 0, 3, 1],
          'A arca é construída (6:22), a chuva cai (7:12), a arca para em Ararate (8:4), a pomba traz a folha (8:11) e o arco é dado como sinal (9:13).',
          'Gênesis 6:22–9:13'
        ),
        mc('Qual é o sinal da aliança de Deus em Gênesis 9:13?', ['Uma pomba', 'O arco nas nuvens', 'A arca', 'Uma oliveira'], 1, 'Deus coloca o arco nas nuvens como sinal da aliança com toda a terra.', 'Gênesis 9:12-17'),
        tf('A primeira ave que Noé soltou foi um corvo.', true, 'Verdadeiro. Primeiro Noé solta um corvo (8:7) e depois uma pomba (8:8).', 'Gênesis 8:6-8'),
        fill('A pomba voltou trazendo no bico uma folha de ___.', ['figueira', 'palmeira', 'cedro', 'oliveira'], 3, 'A folha de oliveira mostrou a Noé que as águas tinham baixado.', 'Gênesis 8:11'),
        mc(
          'Sobre os animais que entraram na arca, o que o texto de Gênesis diz?',
          [
            'Fala em um casal de cada espécie e também em sete pares dos animais puros',
            'Diz apenas que entrou um animal de cada espécie',
            'Não menciona animais',
            'Diz que só entraram aves',
          ],
          0,
          'Gênesis 6:19-20 fala de um casal de cada espécie, e Gênesis 7:2-3 menciona sete pares dos animais puros e das aves.',
          'Gênesis 6:19-20; 7:2-3'
        ),
      ],
    },
    // ------------------------------------------------------------------ 6
    {
      key: 'u2l6',
      title: 'A torre de Babel',
      kind: 'licao',
      duration_min: 5,
      objective: 'Conhecer o relato de Babel e como ele conclui as histórias das origens.',
      references: ['Gênesis 11:1-9', 'Gênesis 11:10-32', 'Atos 2:1-11'],
      context:
        'Na antiga Mesopotâmia, havia grandes torres em degraus ligadas a templos, chamadas zigurates. Muitos estudiosos veem relação entre essas construções e o relato de Babel.',
      blocks: [
        block(
          'biblia_resumo',
          'Gênesis 11:1-4',
          'Toda a terra tinha uma só língua. As pessoas se estabelecem numa planície na terra de Sinear, fazem tijolos e decidem construir uma cidade e uma torre que chegasse ao céu, para tornar famoso o próprio nome e não serem espalhadas pela terra.'
        ),
        block(
          'biblia_resumo',
          'Gênesis 11:5-9',
          'O Senhor desce para ver a cidade e a torre e confunde a língua deles. Eles deixam de construir a cidade e são espalhados pela terra. O lugar passa a se chamar Babel.'
        ),
        block('glossario', 'Babel', 'Em hebraico, o nome soa parecido com o verbo "balal", que significa confundir. Babel também é o nome hebraico da Babilônia.'),
        block(
          'interpretacao',
          'Babel e Pentecostes',
          'Muitos cristãos leem Babel junto com Atos 2: em Pentecostes, pessoas de várias línguas ouvem a mesma mensagem, cada uma na própria língua. Essa ligação é uma leitura cristã tradicional, não algo dito pelo texto de Gênesis.',
          { tradition: 'Leitura cristã tradicional' }
        ),
        block(
          'conceito',
          'Uma ponte para a próxima unidade',
          'Depois de Babel, Gênesis 11 apresenta uma lista de descendentes de Sem que chega a Terá e a seu filho Abrão — o Abraão da próxima unidade.'
        ),
      ],
      summary: [
        'Em Babel, as pessoas querem construir uma torre para tornar famoso o próprio nome.',
        'Deus confunde a língua, e elas se espalham pela terra.',
        'Gênesis 11 termina apresentando Abrão, abrindo uma nova etapa da história.',
      ],
      reflection_prompt: 'Os construtores queriam tornar famoso o próprio nome. O que costuma motivar seus maiores projetos?',
      sources: [SRC_REF, { label: 'Contexto histórico', detail: 'Zigurates mesopotâmicos.' }],
      exercises: [
        mc(
          'Por que as pessoas queriam construir a cidade e a torre, segundo Gênesis 11:4?',
          ['Para se protegerem de um novo dilúvio', 'Para guardar alimentos', 'Para tornar famoso o próprio nome e não serem espalhadas', 'Para observar as estrelas'],
          2,
          'O texto diz que queriam tornar famoso o próprio nome e não ser espalhados. A ideia de proteção contra um novo dilúvio não aparece em Gênesis 11.',
          'Gênesis 11:4'
        ),
        tf('No início de Gênesis 11, toda a terra falava uma só língua.', true, 'Verdadeiro. O relato começa dizendo que havia uma só língua.', 'Gênesis 11:1'),
        fill('O lugar foi chamado ___, porque ali o Senhor confundiu a língua.', ['Éden', 'Babel', 'Ararate', 'Node'], 1, 'Babel soa como o verbo hebraico "confundir".', 'Gênesis 11:9'),
        order(
          'Ordene os acontecimentos de Gênesis 11:1-9.',
          ['Todos falam a mesma língua', 'Decidem construir uma cidade e uma torre', 'O Senhor confunde a língua', 'As pessoas são espalhadas pela terra'],
          [2, 3, 1, 0],
          'O relato vai da língua única (11:1) à decisão de construir (11:4), à confusão das línguas (11:7) e à dispersão (11:8-9).',
          'Gênesis 11:1-9'
        ),
        match(
          'Associe cada lugar ao que aconteceu nele.',
          [
            ['Éden', 'Jardim onde Deus colocou o primeiro homem'],
            ['Ararate', 'Montes onde a arca parou'],
            ['Sinear', 'Planície onde construíram a torre'],
            ['Node', 'Terra onde Caim foi morar'],
          ],
          [3, 1, 0, 2],
          'Éden é o jardim (Gn 2:8), Ararate onde a arca parou (Gn 8:4), Sinear a planície de Babel (Gn 11:2) e Node a terra de Caim (Gn 4:16).',
          'Gênesis 2:8; 4:16; 8:4; 11:2'
        ),
      ],
    },
    // ------------------------------------------------------------------ revisão
    {
      key: 'u2rev',
      title: 'Revisão da unidade',
      kind: 'revisao_unidade',
      duration_min: 5,
      objective: 'Retomar os relatos de Gênesis 1–11 e distinguir texto e tradição.',
      references: ['Gênesis 1–11'],
      context: 'Vamos relembrar os relatos das origens, da criação a Babel.',
      blocks: [
        block(
          'conceito',
          'Recapitulando',
          'Gênesis 1–11 apresenta a criação, o jardim, a escolha no jardim, Caim e Abel, Noé e o dilúvio e a torre de Babel. Também vimos que algumas ideias populares — como a maçã — não estão no texto.'
        ),
      ],
      summary: ['Você revisou os relatos de Gênesis 1–11 e a diferença entre o texto e tradições posteriores.'],
      reflection_prompt: 'Qual desses relatos mais ficou com você? Por quê?',
      sources: [SRC_REF],
      exercises: [
        match(
          'Associe cada capítulo ao relato correspondente.',
          [
            ['Gênesis 1', 'A criação em sete dias'],
            ['Gênesis 3', 'A escolha no jardim'],
            ['Gênesis 4', 'Caim e Abel'],
            ['Gênesis 11', 'A torre de Babel'],
          ],
          [2, 0, 3, 1],
          'Gênesis 1: criação; Gênesis 3: a escolha no jardim; Gênesis 4: Caim e Abel; Gênesis 11: Babel.',
          'Gênesis 1–11'
        ),
        order(
          'Ordene os relatos na sequência em que aparecem em Gênesis.',
          ['A criação', 'A escolha no jardim', 'Caim e Abel', 'O dilúvio', 'A torre de Babel'],
          [3, 0, 4, 2, 1],
          'Criação (1–2), escolha no jardim (3), Caim e Abel (4), dilúvio (6–9) e Babel (11).',
          'Gênesis 1–11'
        ),
        tf('Gênesis 2:15 diz que o homem foi colocado no jardim para cultivá-lo e guardá-lo.', true, 'Verdadeiro. Essa é a tarefa dada ao ser humano no jardim.', 'Gênesis 2:15'),
        mc('Qual ave voltou para a arca com uma folha de oliveira?', ['O corvo', 'A águia', 'A pomba', 'O pardal'], 2, 'Foi a pomba. O corvo foi a primeira ave solta, mas não é ele quem traz a folha.', 'Gênesis 8:7-11'),
        fill('Em Gênesis 1:27, o ser humano é criado à ___ de Deus.', ['sombra', 'imagem', 'porta', 'voz'], 1, 'O ser humano, homem e mulher, é criado à imagem de Deus.', 'Gênesis 1:27'),
        mc(
          'Qual destas ideias NÃO está no texto de Gênesis, mas vem de uma tradição popular posterior?',
          ['A pomba voltou com uma folha de oliveira', 'O fruto proibido era uma maçã', 'Caim cultivava o solo', 'Deus descansou no sétimo dia'],
          1,
          'Gênesis 3 fala apenas em "fruto". As outras afirmações estão no texto (Gn 8:11; 4:2; 2:2).',
          'Gênesis 3:6'
        ),
      ],
    },
  ],
};
