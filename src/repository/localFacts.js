import { createFact } from '../models/fact.js';

/**
 * Local collection of pre-defined facts covering all categories.
 * Each fact uses source: "local" and conforms to the Fact model.
 */
export const localFacts = [
  // Science facts
  createFact({
    id: 1,
    text: 'Light takes approximately 8 minutes and 20 seconds to travel from the Sun to Earth.',
    category: 'science',
    source: 'local',
  }),
  createFact({
    id: 2,
    text: 'Water expands by about 9% when it freezes into ice.',
    category: 'science',
    source: 'local',
  }),

  // History facts
  createFact({
    id: 3,
    text: 'The Great Wall of China was built over many centuries, beginning in the 7th century BC.',
    category: 'history',
    source: 'local',
  }),
  createFact({
    id: 4,
    text: 'The printing press was invented by Johannes Gutenberg around 1440.',
    category: 'history',
    source: 'local',
  }),

  // Nature facts
  createFact({
    id: 5,
    text: 'Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.',
    category: 'nature',
    source: 'local',
  }),
  createFact({
    id: 6,
    text: 'Octopuses have three hearts and blue blood.',
    category: 'nature',
    source: 'local',
  }),

  // Technology facts
  createFact({
    id: 7,
    text: 'The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage\'s Analytical Engine in the 1840s.',
    category: 'technology',
    source: 'local',
  }),
  createFact({
    id: 8,
    text: 'The first email was sent by Ray Tomlinson to himself in 1971.',
    category: 'technology',
    source: 'local',
  }),

  // General facts
  createFact({
    id: 9,
    text: 'A group of flamingos is called a flamboyance.',
    category: 'general',
    source: 'local',
  }),
  createFact({
    id: 10,
    text: 'The shortest war in history lasted 38 to 45 minutes between Britain and Zanzibar in 1896.',
    category: 'general',
    source: 'local',
  }),
];
