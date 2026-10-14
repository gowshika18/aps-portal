import { QuestionData, TestData, TopicData } from '../generate-questions';

export type Slot = 'A' | 'B' | 'C' | 'D';
export const SLOTS: Slot[] = ['A', 'B', 'C', 'D'];

/**
 * Creates a QuestionData object with balanced options distribution across A, B, C, D.
 * The correct option is deterministically rotated based on questionNumber and testNumber
 * to maintain balanced option distribution across the test.
 */
export function createQ(
  qNum: number,
  testNum: number,
  text: string,
  correctText: string,
  distractor1: string,
  distractor2: string,
  distractor3: string,
  explanation: string,
  subTopic: string,
  concept: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY HARD' = 'MEDIUM'
): QuestionData {
  // Deterministic slot rotation so options are well distributed
  const slotIndex = (qNum + testNum * 2) % 4;
  const correctSlot = SLOTS[slotIndex];
  const wrongSlots = SLOTS.filter((s) => s !== correctSlot);

  // Guard against duplicate option values
  const uniqueDistractors = Array.from(new Set([distractor1, distractor2, distractor3]));
  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(`None of these (${uniqueDistractors.length + 1})`);
  }

  const opts: Record<Slot, string> = { A: '', B: '', C: '', D: '' };
  opts[correctSlot] = correctText.trim();
  opts[wrongSlots[0]] = uniqueDistractors[0].trim();
  opts[wrongSlots[1]] = uniqueDistractors[1].trim();
  opts[wrongSlots[2]] = uniqueDistractors[2].trim();

  return {
    questionNumber: qNum,
    questionText: text.trim(),
    optionA: opts.A,
    optionB: opts.B,
    optionC: opts.C,
    optionD: opts.D,
    correctOption: correctSlot,
    explanation: explanation.trim(),
    difficulty,
    marks: 1,
    subTopic: subTopic.trim(),
    concept: concept.trim(),
    sourceType: 'ORIGINAL',
  };
}

export function buildTopicData(
  topic: string,
  category: 'QUANTITATIVE' | 'LOGICAL',
  test1Questions: QuestionData[],
  test2Questions: QuestionData[],
  test3Questions: QuestionData[]
): TopicData {
  if (test1Questions.length !== 20 || test2Questions.length !== 20 || test3Questions.length !== 20) {
    throw new Error(
      `Topic "${topic}" does not have 20 questions per test. Found: T1=${test1Questions.length}, T2=${test2Questions.length}, T3=${test3Questions.length}`
    );
  }

  return {
    topic,
    category,
    tests: [
      {
        testNumber: 1,
        title: `${topic} – Test 1`,
        questions: test1Questions,
      },
      {
        testNumber: 2,
        title: `${topic} – Test 2`,
        questions: test2Questions,
      },
      {
        testNumber: 3,
        title: `${topic} – Test 3`,
        questions: test3Questions,
      },
    ],
  };
}
