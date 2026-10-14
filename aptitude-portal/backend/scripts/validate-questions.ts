import fs from 'fs';
import path from 'path';
import { TOPICS_LIST, slugify, TopicData } from './generate-questions';

const QUESTIONS_DIR = path.resolve(__dirname, '../data/questions');

export function validateQuestionBank(): { valid: boolean; errors: string[]; summary: any } {
  const errors: string[] = [];
  let totalTopics = 0;
  let totalTests = 0;
  let totalQuestions = 0;
  const questionTextsFound = new Set<string>();

  if (!fs.existsSync(QUESTIONS_DIR)) {
    return {
      valid: false,
      errors: [`Questions directory does not exist: ${QUESTIONS_DIR}`],
      summary: {},
    };
  }

  // 1. Validate exactly 35 topic files exist
  const existingFiles = fs.readdirSync(QUESTIONS_DIR).filter((f) => f.endsWith('.json'));

  if (existingFiles.length !== 35) {
    errors.push(`Expected exactly 35 topic JSON files, but found ${existingFiles.length}`);
  }

  const topicNamesFound = new Set<string>();

  for (const topicMeta of TOPICS_LIST) {
    const fileName = `${slugify(topicMeta.name)}.json`;
    const filePath = path.join(QUESTIONS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      errors.push(`Missing topic file for: "${topicMeta.name}" (${fileName})`);
      continue;
    }

    let topicData: TopicData;
    try {
      topicData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e: any) {
      errors.push(`JSON parse error in ${fileName}: ${e.message}`);
      continue;
    }

    if (topicData.topic !== topicMeta.name) {
      errors.push(`Topic name mismatch in ${fileName}: expected "${topicMeta.name}", got "${topicData.topic}"`);
    }

    if (topicNamesFound.has(topicData.topic)) {
      errors.push(`Duplicate topic definition encountered: "${topicData.topic}"`);
    }
    topicNamesFound.add(topicData.topic);
    totalTopics++;

    // 2. Validate tests array
    if (!Array.isArray(topicData.tests) || topicData.tests.length !== 3) {
      errors.push(`Topic "${topicData.topic}" must contain exactly 3 tests, found ${topicData.tests?.length}`);
      continue;
    }

    const testNumbersFound = new Set<number>();

    for (const test of topicData.tests) {
      totalTests++;

      if (![1, 2, 3].includes(test.testNumber)) {
        errors.push(`Invalid testNumber in topic "${topicData.topic}": ${test.testNumber}`);
      }

      if (testNumbersFound.has(test.testNumber)) {
        errors.push(`Duplicate testNumber ${test.testNumber} in topic "${topicData.topic}"`);
      }
      testNumbersFound.add(test.testNumber);

      // 3. Validate questions in test
      if (!Array.isArray(test.questions) || test.questions.length !== 20) {
        errors.push(
          `Topic "${topicData.topic}" Test ${test.testNumber} must have exactly 20 questions, found ${test.questions?.length}`
        );
        continue;
      }

      const qNumbersFound = new Set<number>();

      for (const q of test.questions) {
        totalQuestions++;

        if (q.questionNumber < 1 || q.questionNumber > 20) {
          errors.push(
            `Invalid questionNumber in ${topicData.topic} Test ${test.testNumber}: ${q.questionNumber}`
          );
        }

        if (qNumbersFound.has(q.questionNumber)) {
          errors.push(
            `Duplicate questionNumber ${q.questionNumber} in ${topicData.topic} Test ${test.testNumber}`
          );
        }
        qNumbersFound.add(q.questionNumber);

        // Validate text and options
        if (!q.questionText || q.questionText.trim().length === 0) {
          errors.push(`Empty questionText in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }

        if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
          errors.push(`Missing option in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }
        const options = [q.optionA, q.optionB, q.optionC, q.optionD]
          .map((option) => (typeof option === 'string' ? option.trim().toLocaleLowerCase() : ''));
        if (options.some((option) => !option) || new Set(options).size !== 4) {
          errors.push(`Options must be four non-empty, distinct values in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }

        if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
          errors.push(
            `Invalid correctOption "${q.correctOption}" in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`
          );
        }

        if (!q.explanation || q.explanation.trim().length < 5) {
          errors.push(`Missing or too short explanation in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }

        if (!['EASY', 'MEDIUM', 'HARD', 'VERY HARD'].includes(q.difficulty)) {
          errors.push(`Invalid difficulty "${q.difficulty}" in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }

        if (q.marks !== 1) {
          errors.push(`Question marks must be 1 in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }

        const normalizedText = q.questionText.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
        if (normalizedText && questionTextsFound.has(normalizedText)) {
          errors.push(`Exact duplicate question text in ${topicData.topic} Test ${test.testNumber} Q${q.questionNumber}`);
        }
        questionTextsFound.add(normalizedText);
      }
    }
  }

  // 4. Overall counts validation
  if (totalTopics !== 35) {
    errors.push(`Total topics count mismatch: expected 35, found ${totalTopics}`);
  }
  if (totalTests !== 105) {
    errors.push(`Total tests count mismatch: expected 105, found ${totalTests}`);
  }
  if (totalQuestions !== 2100) {
    errors.push(`Total questions count mismatch: expected 2100, found ${totalQuestions}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      totalTopics,
      totalTests,
      totalQuestions,
      valid: errors.length === 0,
    },
  };
}

if (require.main === module) {
  console.log('--- Running Question Bank Validation ---');
  const result = validateQuestionBank();
  if (result.valid) {
    console.log('✅ Validation PASSED!');
    console.log(`Topics:    ${result.summary.totalTopics} / 35`);
    console.log(`Tests:     ${result.summary.totalTests} / 105`);
    console.log(`Questions: ${result.summary.totalQuestions} / 2,100`);
    console.log('All questions have valid counts, four distinct options, valid answer keys, difficulty, and explanations.');
  } else {
    console.error('❌ Validation FAILED with errors:');
    result.errors.forEach((err, idx) => console.error(` [${idx + 1}] ${err}`));
    process.exit(1);
  }
}
