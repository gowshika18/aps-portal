import fs from 'fs';
import path from 'path';
import {
  generateNumberSystem,
  generateHcfLcm,
  generatePercentages,
  generateProfitAndLoss,
  generateRatioAndProportion,
} from './question-bank/quant1';
import {
  generateAverages,
  generateSimpleInterest,
  generateCompoundInterest,
  generateTimeAndWork,
  generatePipesAndCisterns,
} from './question-bank/quant2';
import {
  generateTimeSpeedDistance,
  generateProblemsOnTrains,
  generateBoatsAndStreams,
  generateMixturesAndAlligation,
  generateProbability,
} from './question-bank/quant3';
import {
  generatePermutationAndCombination,
  generateAlgebra,
  generateAges,
  generateDataInterpretation,
  generateMensuration,
} from './question-bank/quant4';
import { QuestionData, TopicData, slugify, TOPICS_LIST } from './generate-questions';

const QUESTIONS_DIR = path.resolve(__dirname, '../data/questions');
const curatedTopics: TopicData[] = [
  generateNumberSystem(),
  generateHcfLcm(),
  generatePercentages(),
  generateProfitAndLoss(),
  generateRatioAndProportion(),
  generateAverages(),
  generateSimpleInterest(),
  generateCompoundInterest(),
  generateTimeAndWork(),
  generatePipesAndCisterns(),
  generateTimeSpeedDistance(),
  generateProblemsOnTrains(),
  generateBoatsAndStreams(),
  generateMixturesAndAlligation(),
  generateProbability(),
  generatePermutationAndCombination(),
  generateAlgebra(),
  generateAges(),
  generateDataInterpretation(),
  generateMensuration(),
];

function validateTopic(data: TopicData): void {
  const topicMeta = TOPICS_LIST.find((topic) => topic.name === data.topic);
  if (!topicMeta || topicMeta.category !== 'QUANTITATIVE' || data.category !== 'QUANTITATIVE') {
    throw new Error(`Unexpected curated topic or category: ${data.topic}`);
  }
  if (data.tests.length !== 3) {
    throw new Error(`${data.topic} must contain exactly three tests`);
  }

  const testNumbers = data.tests.map((test) => test.testNumber).sort();
  if (testNumbers.join(',') !== '1,2,3') {
    throw new Error(`${data.topic} must contain Tests 1, 2, and 3 exactly once`);
  }

  for (const test of data.tests) {
    if (test.questions.length !== 20) {
      throw new Error(`${data.topic} Test ${test.testNumber} must contain exactly 20 questions`);
    }
    const questionNumbers = test.questions.map((question) => question.questionNumber).sort((a, b) => a - b);
    if (questionNumbers.some((questionNumber, index) => questionNumber !== index + 1)) {
      throw new Error(`${data.topic} Test ${test.testNumber} must number questions 1 through 20`);
    }
    for (const question of test.questions) {
      validateQuestion(data.topic, test.testNumber, question);
    }
  }
}

function validateQuestion(topic: string, testNumber: number, question: QuestionData): void {
  const label = `${topic} Test ${testNumber} Q${question.questionNumber}`;
  const options = [question.optionA, question.optionB, question.optionC, question.optionD];
  if (new Set(options.map((option) => option.trim().toLocaleLowerCase())).size !== 4) {
    throw new Error(`${label} has duplicate options`);
  }
  if (!question.questionText.trim() || !question.explanation.trim()) {
    throw new Error(`${label} is missing question text or explanation`);
  }
  if (!['A', 'B', 'C', 'D'].includes(question.correctOption)) {
    throw new Error(`${label} has an invalid correct option`);
  }
  if (question.marks !== 1) {
    throw new Error(`${label} must be worth one mark`);
  }
}

const topicNames = new Set<string>();
const questionTexts = new Set<string>();
for (const topic of curatedTopics) {
  validateTopic(topic);
  if (topicNames.has(topic.topic)) {
    throw new Error(`Duplicate curated topic: ${topic.topic}`);
  }
  topicNames.add(topic.topic);

  for (const test of topic.tests) {
    for (const question of test.questions) {
      const normalizedText = question.questionText.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
      if (questionTexts.has(normalizedText)) {
        throw new Error(`Exact duplicate question text found in ${topic.topic} Test ${test.testNumber}`);
      }
      questionTexts.add(normalizedText);
    }
  }
}

if (topicNames.size !== 20) {
  throw new Error(`Expected 20 curated quantitative topics, found ${topicNames.size}`);
}

for (const topic of curatedTopics) {
  const filePath = path.join(QUESTIONS_DIR, `${slugify(topic.topic)}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(topic, null, 2)}\n`, 'utf8');
  console.log(`Exported ${topic.topic}: 3 tests, 60 questions`);
}

console.log(`Exported ${topicNames.size} topics and ${questionTexts.size} questions.`);
