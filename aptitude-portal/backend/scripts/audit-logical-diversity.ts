import fs from 'fs';
import path from 'path';
import { slugify } from './generate-questions';

const LOGICAL_TOPICS = [
  'Clocks',
  'Calendars',
  'Venn Diagrams',
  'Statement & Conclusion',
  'Puzzles',
  'Data Sufficiency',
  'Seating Arrangement',
  'Syllogism',
  'Direction Sense',
  'Blood Relations',
  'Odd One Out',
  'Analogy',
  'Coding & Decoding',
  'Letter Series',
  'Number Series',
];

const QUESTIONS_DIR = path.resolve(__dirname, '../data/questions');

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function normalizeTemplate(text: string): string {
  // Replace numbers, quotes, and symbols to detect number-swapped templates
  return text
    .toLowerCase()
    .replace(/\b\d+\b/g, '<NUM>')
    .replace(/["'“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runAudit() {
  console.log('===============================================================');
  console.log('AUDIT: 15 LOGICAL TOPICS DIVERSITY & NON-REPETITION CHECK');
  console.log('===============================================================\n');

  let totalQuestions = 0;
  let totalTests = 0;
  let failedChecks = 0;
  const report: {
    topic: string;
    tests: number;
    questions: number;
    syntheticTemplatesFound: number;
    nearDuplicatesFound: number;
    exactDuplicatesFound: number;
    passed: boolean;
  }[] = [];

  const syntheticRegex = /#(v|\d+)|periodicity #|classification test #|cardinality survey #|lineage trace #|layout #\d+|inference appraisal #|evaluation #\d+|problem #\d+/i;

  for (const topicName of LOGICAL_TOPICS) {
    const slug = slugify(topicName);
    const filePath = path.join(QUESTIONS_DIR, `${slug}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing file for ${topicName}: ${slug}.json`);
      failedChecks++;
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const allQuestions: { qNum: number; testNum: number; text: string; subTopic?: string; concept?: string }[] = [];

    let syntheticCount = 0;
    let exactDupCount = 0;
    let nearDupCount = 0;

    for (const test of data.tests) {
      totalTests++;
      for (const q of test.questions) {
        totalQuestions++;
        allQuestions.push({
          qNum: q.questionNumber,
          testNum: test.testNumber,
          text: q.questionText,
          subTopic: q.subTopic,
          concept: q.concept,
        });

        if (syntheticRegex.test(q.questionText)) {
          syntheticCount++;
          console.warn(`  [SYNTHETIC TEMPLATE] ${topicName} T${test.testNumber} Q${q.questionNumber}: ${q.questionText.substring(0, 60)}`);
        }
      }
    }

    // Pairwise similarity comparison within the 60 questions of this topic
    for (let i = 0; i < allQuestions.length; i++) {
      for (let j = i + 1; j < allQuestions.length; j++) {
        const qA = allQuestions[i];
        const qB = allQuestions[j];

        if (qA.text.trim().toLowerCase() === qB.text.trim().toLowerCase()) {
          exactDupCount++;
          console.warn(`  [EXACT DUPLICATE] ${topicName} T${qA.testNum} Q${qA.qNum} vs T${qB.testNum} Q${qB.qNum}`);
        } else {
          // Check normalized template similarity
          const normA = normalizeTemplate(qA.text);
          const normB = normalizeTemplate(qB.text);
          if (normA === normB && normA.length > 25) {
            nearDupCount++;
            console.warn(`  [NUMBER-SWAPPED TEMPLATE] ${topicName} T${qA.testNum} Q${qA.qNum} vs T${qB.testNum} Q${qB.qNum}:\n    "${qA.text}"\n    "${qB.text}"`);
          } else {
            const sim = jaccardSimilarity(tokenize(qA.text), tokenize(qB.text));
            // Very high token overlap (> 0.88 on longer questions)
            if (sim > 0.88 && qA.text.length > 40 && normA !== normB) {
              nearDupCount++;
              console.warn(`  [HIGH SIMILARITY ${Math.round(sim * 100)}%] ${topicName} T${qA.testNum} Q${qA.qNum} vs T${qB.testNum} Q${qB.qNum}`);
            }
          }
        }
      }
    }

    const passed = syntheticCount === 0 && exactDupCount === 0 && nearDupCount === 0 && allQuestions.length === 60;
    if (!passed) failedChecks++;

    report.push({
      topic: topicName,
      tests: data.tests.length,
      questions: allQuestions.length,
      syntheticTemplatesFound: syntheticCount,
      nearDuplicatesFound: nearDupCount,
      exactDuplicatesFound: exactDupCount,
      passed,
    });
  }

  console.log('\n--- TOPIC DIVERSITY AUDIT SUMMARY TABLE ---');
  console.table(report);

  if (failedChecks === 0) {
    console.log(`\n✅ ALL 15 LOGICAL REASONING TOPICS PASSED DIVERSITY AUDIT!`);
    console.log(`- 15 Topics`);
    console.log(`- 45 Tests`);
    console.log(`- 900 Questions`);
    console.log(`- 0 Synthetic templates`);
    console.log(`- 0 Exact duplicates`);
    console.log(`- 0 Number-swapped / near duplicates`);
  } else {
    console.error(`\n❌ Diversity audit failed with ${failedChecks} topic issues.`);
    process.exit(1);
  }
}

runAudit().catch(console.error);
