import fs from 'fs';
import path from 'path';

const QUESTIONS_DIR = path.resolve(__dirname, '../data/questions');
const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));

const duplicateSummary: Record<string, { total: number; unique: number; duplicates: number }> = {};

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8'));
  const topic = data.topic;
  const seen = new Set<string>();
  let dupCount = 0;
  let total = 0;

  for (const test of data.tests) {
    for (const q of test.questions) {
      total++;
      const norm = q.questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (seen.has(norm)) {
        dupCount++;
      } else {
        seen.add(norm);
      }
    }
  }

  if (dupCount > 0) {
    duplicateSummary[topic] = { total, unique: seen.size, duplicates: dupCount };
  }
}

console.log('Topics with duplicates:');
console.table(duplicateSummary);
