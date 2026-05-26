import { createFact } from '../models/fact.js';

/**
 * Local collection of pre-defined facts in Brazilian Portuguese.
 * Each fact uses source: "local" and conforms to the Fact model.
 */
export const localFactsPtBr = [
  // Science facts
  createFact({
    id: 1,
    text: 'A luz leva aproximadamente 8 minutos e 20 segundos para viajar do Sol até a Terra.',
    category: 'science',
    source: 'local',
  }),
  createFact({
    id: 2,
    text: 'A água se expande cerca de 9% quando congela e se transforma em gelo.',
    category: 'science',
    source: 'local',
  }),

  // History facts
  createFact({
    id: 3,
    text: 'A Grande Muralha da China foi construída ao longo de muitos séculos, começando no século VII a.C.',
    category: 'history',
    source: 'local',
  }),
  createFact({
    id: 4,
    text: 'A prensa de tipos móveis foi inventada por Johannes Gutenberg por volta de 1440.',
    category: 'history',
    source: 'local',
  }),

  // Nature facts
  createFact({
    id: 5,
    text: 'O mel nunca estraga. Arqueólogos encontraram mel de 3000 anos em tumbas egípcias que ainda estava comestível.',
    category: 'nature',
    source: 'local',
  }),
  createFact({
    id: 6,
    text: 'Os polvos têm três corações e sangue azul.',
    category: 'nature',
    source: 'local',
  }),

  // Technology facts
  createFact({
    id: 7,
    text: 'A primeira programadora de computadores foi Ada Lovelace, que escreveu algoritmos para a Máquina Analítica de Charles Babbage nos anos 1840.',
    category: 'technology',
    source: 'local',
  }),
  createFact({
    id: 8,
    text: 'O primeiro e-mail foi enviado por Ray Tomlinson para ele mesmo em 1971.',
    category: 'technology',
    source: 'local',
  }),

  // General facts
  createFact({
    id: 9,
    text: 'Um grupo de flamingos é chamado de "flamboyance" em inglês.',
    category: 'general',
    source: 'local',
  }),
  createFact({
    id: 10,
    text: 'A guerra mais curta da história durou de 38 a 45 minutos, entre a Grã-Bretanha e Zanzibar em 1896.',
    category: 'general',
    source: 'local',
  }),
];
