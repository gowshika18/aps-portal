/**
 * Export Curated Logical Reasoning Questions
 * 
 * Imports all 15 logical topic generators from logic1.ts, logic2.ts, logic3.ts,
 * validates each topic (20 Qs per test, 3 tests per topic, distinct options, valid answers),
 * deletes the old calendars.json, writes/overwrites each topic's JSON file,
 * and creates logical-reasoning.json for the new topic.
 */
import fs from 'fs';
import path from 'path';
import { TopicData, slugify } from './generate-questions';

import { generateCalendars } from './question-bank/calendars';
import {
  generateNumberSeries,
  generateLetterSeries,
  generateCodingAndDecoding,
  generateAnalogy,
} from './question-bank/logic1';

// logic2: Odd One Out, Blood Relations, Direction Sense, Syllogism, Seating Arrangement
import {
  generateOddOneOut,
  generateBloodRelations,
  generateDirectionSense,
  generateSyllogism,
  generateSeatingArrangement,
} from './question-bank/logic2';

// logic3: Puzzles, Statement & Conclusion, Data Sufficiency, Venn Diagrams, Clocks
import {
  generatePuzzles,
  generateStatementAndConclusion,
  generateDataSufficiency,
  generateVennDiagrams,
  generateClocks,
} from './question-bank/logic3';

const QUESTIONS_DIR = path.resolve(__dirname, '../data/questions');

function validate(topic: TopicData): string[] {
  const errors: string[] = [];

  if (!topic.topic || topic.topic.trim().length === 0) {
    errors.push('Empty topic name');
  }

  if (topic.tests.length !== 3) {
    errors.push(`Topic "${topic.topic}" has ${topic.tests.length} tests instead of 3`);
  }

  for (const test of topic.tests) {
    if (test.questions.length !== 20) {
      errors.push(
        `Topic "${topic.topic}" Test ${test.testNumber} has ${test.questions.length} questions instead of 20`
      );
    }

    const qNums = new Set<number>();
    for (const q of test.questions) {
      if (qNums.has(q.questionNumber)) {
        errors.push(
          `Duplicate questionNumber ${q.questionNumber} in "${topic.topic}" Test ${test.testNumber}`
        );
      }
      qNums.add(q.questionNumber);

      // Validate 4 distinct options
      const opts = [q.optionA, q.optionB, q.optionC, q.optionD].map((o) =>
        (o || '').trim().toLowerCase()
      );
      if (opts.some((o) => !o)) {
        errors.push(
          `Empty option in "${topic.topic}" Test ${test.testNumber} Q${q.questionNumber}`
        );
      }
      if (new Set(opts).size !== 4) {
        errors.push(
          `Non-distinct options in "${topic.topic}" Test ${test.testNumber} Q${q.questionNumber}: [${opts.join(' | ')}]`
        );
      }

      // Validate correct option
      if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
        errors.push(
          `Invalid correctOption "${q.correctOption}" in "${topic.topic}" Test ${test.testNumber} Q${q.questionNumber}`
        );
      }

      // Validate explanation
      if (!q.explanation || q.explanation.trim().length < 5) {
        errors.push(
          `Missing/short explanation in "${topic.topic}" Test ${test.testNumber} Q${q.questionNumber}`
        );
      }
    }
  }

  return errors;
}

async function main() {
  console.log('=== Exporting Curated Logical Reasoning Questions ===\n');

  // Generate all 15 topics
  const generators: (() => TopicData)[] = [
    generateCalendars,
    generateNumberSeries,
    generateLetterSeries,
    generateCodingAndDecoding,
    generateAnalogy,
    generateOddOneOut,
    generateBloodRelations,
    generateDirectionSense,
    generateSyllogism,
    generateSeatingArrangement,
    generatePuzzles,
    generateStatementAndConclusion,
    generateDataSufficiency,
    generateVennDiagrams,
    generateClocks,
  ];

  let totalErrors = 0;
  let totalQuestions = 0;
  const allErrors: string[] = [];

  // Remove obsolete logical-reasoning.json if it exists
  const lrPath = path.join(QUESTIONS_DIR, 'logical-reasoning.json');
  if (fs.existsSync(lrPath)) {
    fs.unlinkSync(lrPath);
    console.log('✓ Deleted obsolete logical-reasoning.json');
  }

  // Ensure output directory exists
  if (!fs.existsSync(QUESTIONS_DIR)) {
    fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  }

  for (const gen of generators) {
    const topicData = gen();
    const topicErrors = validate(topicData);

    if (topicErrors.length > 0) {
      totalErrors += topicErrors.length;
      allErrors.push(...topicErrors);
      console.error(`✗ ${topicData.topic}: ${topicErrors.length} error(s)`);
      topicErrors.forEach((e) => console.error(`    ${e}`));
    } else {
      const qCount = topicData.tests.reduce((sum, t) => sum + t.questions.length, 0);
      totalQuestions += qCount;

      const slug = slugify(topicData.topic);
      const outPath = path.join(QUESTIONS_DIR, `${slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(topicData, null, 2), 'utf-8');
      console.log(`✓ ${topicData.topic}: ${qCount} questions → ${slug}.json`);
    }
  }

  console.log(`\n=== Export Summary ===`);
  console.log(`Topics exported: ${generators.length}`);
  console.log(`Total questions:  ${totalQuestions}`);
  console.log(`Total errors:     ${totalErrors}`);

  if (totalErrors > 0) {
    console.error('\n❌ Export finished with errors. Fix the issues above before seeding.');
    process.exit(1);
  }

  // Verify total JSON count
  const jsonFiles = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));
  console.log(`JSON files in data/questions/: ${jsonFiles.length} (expected 35)`);

  if (jsonFiles.length !== 35) {
    console.error(`❌ Expected exactly 35 JSON files, found ${jsonFiles.length}`);
    process.exit(1);
  }

  console.log('\n✅ All 15 logical topics exported and validated successfully.');
}

main().catch((err) => {
  console.error('Fatal error during export:', err);
  process.exit(1);
});
