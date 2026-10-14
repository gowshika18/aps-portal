import fs from 'fs';
import path from 'path';

export interface QuestionData {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY HARD';
  marks: 1;
  subTopic?: string;
  concept?: string;
  sourceType: 'ORIGINAL';
}

export interface TestData {
  testNumber: 1 | 2 | 3;
  title?: string;
  questions: QuestionData[];
}

export interface TopicData {
  topic: string;
  category: 'QUANTITATIVE' | 'LOGICAL';
  tests: TestData[];
}

// Helper to convert topic name to file slug
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const TOPICS_LIST: { name: string; category: 'QUANTITATIVE' | 'LOGICAL'; order: number }[] = [
  // 1-20: Quantitative (20 Topics)
  { name: 'Number System', category: 'QUANTITATIVE', order: 1 },
  { name: 'HCF & LCM', category: 'QUANTITATIVE', order: 2 },
  { name: 'Percentages', category: 'QUANTITATIVE', order: 3 },
  { name: 'Profit & Loss', category: 'QUANTITATIVE', order: 4 },
  { name: 'Ratio & Proportion', category: 'QUANTITATIVE', order: 5 },
  { name: 'Averages', category: 'QUANTITATIVE', order: 6 },
  { name: 'Simple Interest', category: 'QUANTITATIVE', order: 7 },
  { name: 'Compound Interest', category: 'QUANTITATIVE', order: 8 },
  { name: 'Time & Work', category: 'QUANTITATIVE', order: 9 },
  { name: 'Pipes & Cisterns', category: 'QUANTITATIVE', order: 10 },
  { name: 'Time, Speed & Distance', category: 'QUANTITATIVE', order: 11 },
  { name: 'Problems on Trains', category: 'QUANTITATIVE', order: 12 },
  { name: 'Boats & Streams', category: 'QUANTITATIVE', order: 13 },
  { name: 'Mixtures & Alligation', category: 'QUANTITATIVE', order: 14 },
  { name: 'Probability', category: 'QUANTITATIVE', order: 15 },
  { name: 'Permutation & Combination', category: 'QUANTITATIVE', order: 16 },
  { name: 'Algebra', category: 'QUANTITATIVE', order: 17 },
  { name: 'Ages', category: 'QUANTITATIVE', order: 18 },
  { name: 'Data Interpretation', category: 'QUANTITATIVE', order: 19 },
  { name: 'Mensuration', category: 'QUANTITATIVE', order: 20 },

  // 21-35: Logical Reasoning (15 Topics)
  { name: 'Number Series', category: 'LOGICAL', order: 21 },
  { name: 'Letter Series', category: 'LOGICAL', order: 22 },
  { name: 'Coding & Decoding', category: 'LOGICAL', order: 23 },
  { name: 'Analogy', category: 'LOGICAL', order: 24 },
  { name: 'Odd One Out', category: 'LOGICAL', order: 25 },
  { name: 'Blood Relations', category: 'LOGICAL', order: 26 },
  { name: 'Direction Sense', category: 'LOGICAL', order: 27 },
  { name: 'Syllogism', category: 'LOGICAL', order: 28 },
  { name: 'Seating Arrangement', category: 'LOGICAL', order: 29 },
  { name: 'Puzzles', category: 'LOGICAL', order: 30 },
  { name: 'Statement & Conclusion', category: 'LOGICAL', order: 31 },
  { name: 'Data Sufficiency', category: 'LOGICAL', order: 32 },
  { name: 'Venn Diagrams', category: 'LOGICAL', order: 33 },
  { name: 'Calendars', category: 'LOGICAL', order: 34 },
  { name: 'Clocks', category: 'LOGICAL', order: 35 },
];

console.log(`Loaded ${TOPICS_LIST.length} topics specifications.`);
