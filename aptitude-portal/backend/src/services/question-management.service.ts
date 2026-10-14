import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';

const VALID_OPTIONS = ['A', 'B', 'C', 'D'] as const;
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD', 'VERY_HARD'] as const;

export class QuestionManagementService {
  /**
   * Get a single question by ID (staff only)
   */
  static async getQuestionById(questionId: string) {
    const q = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        test: { include: { topic: true } },
        versions: { orderBy: { versionNumber: 'desc' }, take: 5 },
      },
    });
    if (!q) throw new AppError('Question not found.', 404);
    return q;
  }

  /**
   * Add a single question to a test
   */
  static async addQuestion(
    staffUsername: string,
    data: {
      testId: string;
      questionNumber: number;
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation: string;
      difficulty?: string;
      marks?: number;
      subTopic?: string;
      concept?: string;
    }
  ) {
    this.validateQuestionFields(data);

    const test = await prisma.test.findUnique({
      where: { id: data.testId },
      include: { _count: { select: { questions: true } } },
    });
    if (!test) throw new AppError('Test not found.', 404);

    // Check if question number slot is already taken
    const existing = await prisma.question.findUnique({
      where: { testId_questionNumber: { testId: data.testId, questionNumber: data.questionNumber } },
    });
    if (existing) throw new AppError(`Question number ${data.questionNumber} already exists in this test.`, 409);

    const question = await prisma.question.create({
      data: {
        testId: data.testId,
        questionNumber: data.questionNumber,
        questionText: data.questionText,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        explanation: data.explanation,
        difficulty: data.difficulty ?? 'HARD',
        marks: data.marks ?? 1,
        subTopic: data.subTopic,
        concept: data.concept,
      },
    });

    return question;
  }

  /**
   * Edit a question — creates a version snapshot first to preserve history
   */
  static async editQuestion(
    staffUsername: string,
    questionId: string,
    data: Partial<{
      questionText: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation: string;
      difficulty: string;
      marks: number;
      subTopic: string;
      concept: string;
    }>,
    editReason?: string
  ) {
    const existing = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existing) throw new AppError('Question not found.', 404);

    if (data.correctOption && !VALID_OPTIONS.includes(data.correctOption as any)) {
      throw new AppError('Correct option must be A, B, C, or D.', 400);
    }
    if (data.difficulty && !VALID_DIFFICULTIES.includes(data.difficulty as any)) {
      throw new AppError('Invalid difficulty level.', 400);
    }

    // Snapshot current version before editing
    const latestVersion = await prisma.questionVersion.findFirst({
      where: { questionId },
      orderBy: { versionNumber: 'desc' },
    });
    const nextVersion = (latestVersion?.versionNumber ?? 0) + 1;

    await prisma.questionVersion.create({
      data: {
        questionId,
        versionNumber: nextVersion,
        questionText: existing.questionText,
        optionA: existing.optionA,
        optionB: existing.optionB,
        optionC: existing.optionC,
        optionD: existing.optionD,
        correctOption: existing.correctOption,
        explanation: existing.explanation,
        difficulty: existing.difficulty,
        marks: existing.marks,
        editedBy: staffUsername,
        editReason: editReason ?? null,
      },
    });

    // Apply the update
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(data.questionText !== undefined && { questionText: data.questionText }),
        ...(data.optionA !== undefined && { optionA: data.optionA }),
        ...(data.optionB !== undefined && { optionB: data.optionB }),
        ...(data.optionC !== undefined && { optionC: data.optionC }),
        ...(data.optionD !== undefined && { optionD: data.optionD }),
        ...(data.correctOption !== undefined && { correctOption: data.correctOption }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.marks !== undefined && { marks: data.marks }),
        ...(data.subTopic !== undefined && { subTopic: data.subTopic }),
        ...(data.concept !== undefined && { concept: data.concept }),
      },
    });

    return { question: updated, versionCreated: nextVersion };
  }

  /**
   * Deactivate a question (soft delete)
   */
  static async deactivateQuestion(questionId: string) {
    const existing = await prisma.question.findUnique({ where: { id: questionId } });
    if (!existing) throw new AppError('Question not found.', 404);

    return prisma.question.update({
      where: { id: questionId },
      data: { isActive: false },
    });
  }

  /**
   * Bulk import questions with full validation and transaction
   */
  static async bulkImport(
    staffUsername: string,
    payload: {
      topic: string;
      testNumber: number;
      questions: Array<{
        questionNumber: number;
        questionText: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctOption: string;
        explanation: string;
        difficulty: string;
        marks: number;
      }>;
    }
  ) {
    // Validate topic exists
    const topic = await prisma.topic.findUnique({ where: { name: payload.topic } });
    if (!topic) throw new AppError(`Topic "${payload.topic}" not found.`, 404);

    // Validate test exists
    const test = await prisma.test.findUnique({
      where: { topicId_testNumber: { topicId: topic.id, testNumber: payload.testNumber } },
    });
    if (!test) throw new AppError(`Test ${payload.testNumber} for topic "${payload.topic}" not found.`, 404);

    const questions = payload.questions;

    // Exactly 20 questions
    if (questions.length !== 20) {
      throw new AppError(`Bulk import requires exactly 20 questions. Provided: ${questions.length}`, 400);
    }

    // Unique question numbers
    const qNums = questions.map((q) => q.questionNumber);
    if (new Set(qNums).size !== qNums.length) {
      throw new AppError('Duplicate question numbers in import payload.', 400);
    }
    if (!qNums.every((n) => n >= 1 && n <= 20)) {
      throw new AppError('Question numbers must be between 1 and 20.', 400);
    }

    // Per-question validation
    const errors: string[] = [];
    const seenTexts = new Set<string>();
    for (const q of questions) {
      this.validateQuestionFields(q, errors, `Q${q.questionNumber}`);
      const normalized = q.questionText.trim().toLowerCase();
      if (seenTexts.has(normalized)) {
        errors.push(`Q${q.questionNumber}: Duplicate question text within this batch.`);
      }
      seenTexts.add(normalized);
    }

    if (errors.length > 0) {
      throw new AppError(`Import validation failed:\n${errors.join('\n')}`, 400);
    }

    // Check for existing questions in this test (overwrite protection)
    const existingCount = await prisma.question.count({ where: { testId: test.id } });
    if (existingCount >= 20) {
      throw new AppError('This test already has 20 questions. Deactivate existing questions first or use a different test.', 409);
    }

    // Atomic transaction import
    const imported = await prisma.$transaction(
      questions.map((q) =>
        prisma.question.create({
          data: {
            testId: test.id,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty,
            marks: q.marks,
            sourceType: 'BULK_IMPORT',
          },
        })
      )
    );

    return {
      imported: imported.length,
      testId: test.id,
      topicName: topic.name,
      testNumber: test.testNumber,
    };
  }

  /**
   * Detect potential duplicate questions across the question bank
   */
  static async detectDuplicates(
    testId?: string,
    threshold = 0.85
  ) {
    const where: any = { isActive: true };
    if (testId) where.testId = testId;

    const questions = await prisma.question.findMany({
      where,
      select: {
        id: true, testId: true, questionNumber: true, questionText: true,
        test: { select: { testNumber: true, topic: { select: { name: true } } } },
      },
      orderBy: [{ testId: 'asc' }, { questionNumber: 'asc' }],
    });

    const duplicates: Array<{
      questionAId: string; questionBId: string;
      questionAText: string; questionBText: string;
      topicA: string; topicB: string;
      similarity: number; isSameTest: boolean;
    }> = [];

    // Precompute normalized strings and trigram sets once
    const precomputed = questions.map((q) => {
      const lower = q.questionText.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        q,
        lower,
        trigrams: buildTrigrams(lower),
      };
    });

    // Lightning fast similarity check
    for (let i = 0; i < precomputed.length; i++) {
      const itemA = precomputed[i];
      if (itemA.trigrams.size === 0) continue;

      for (let j = i + 1; j < precomputed.length; j++) {
        const itemB = precomputed[j];
        if (itemB.trigrams.size === 0) continue;

        let intersection = 0;
        for (const tg of itemA.trigrams) {
          if (itemB.trigrams.has(tg)) intersection++;
        }
        const union = itemA.trigrams.size + itemB.trigrams.size - intersection;
        const sim = union > 0 ? intersection / union : 0;

        if (sim >= threshold) {
          duplicates.push({
            questionAId: itemA.q.id,
            questionBId: itemB.q.id,
            questionAText: itemA.q.questionText.slice(0, 120),
            questionBText: itemB.q.questionText.slice(0, 120),
            topicA: itemA.q.test.topic.name,
            topicB: itemB.q.test.topic.name,
            similarity: Number((sim * 100).toFixed(1)),
            isSameTest: itemA.q.testId === itemB.q.testId,
          });
        }
      }
    }

    // Flag detected duplicates in DB
    if (duplicates.length > 0) {
      const ids = new Set<string>();
      for (const d of duplicates) {
        ids.add(d.questionAId);
        ids.add(d.questionBId);
      }
      await prisma.question.updateMany({
        where: { id: { in: Array.from(ids) } },
        data: { isDuplicate: true },
      });
    }

    return {
      total: duplicates.length,
      threshold: threshold * 100,
      duplicates: duplicates.slice(0, 100), // cap to 100 results
    };
  }

  /**
   * Update test configuration (title, active status, duration, marks)
   */
  static async updateTestConfig(
    testId: string,
    data: {
      title?: string;
      isActive?: boolean;
      durationSeconds?: number;
    },
    staffUsername: string
  ) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { _count: { select: { attempts: { where: { status: 'SUBMITTED' } } } } },
    });
    if (!test) throw new AppError('Test not found.', 404);

    const hasCompletedAttempts = test._count.attempts > 0;

    // Duration cannot be changed if test has completed attempts (would affect historical timing)
    if (data.durationSeconds !== undefined && hasCompletedAttempts) {
      throw new AppError('Cannot change test duration: test already has submitted attempts.', 400);
    }

    const updated = await prisma.test.update({
      where: { id: testId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.durationSeconds !== undefined && { durationSeconds: data.durationSeconds }),
      },
    });
    return updated;
  }

  private static validateQuestionFields(
    data: any,
    errors?: string[],
    prefix = ''
  ) {
    const required = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'explanation'];
    const pref = prefix ? `${prefix}: ` : '';
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        const msg = `${pref}Missing required field: ${field}`;
        if (errors) errors.push(msg);
        else throw new AppError(msg, 400);
      }
    }
    if (data.correctOption && !VALID_OPTIONS.includes(data.correctOption)) {
      const msg = `${pref}correctOption must be A, B, C, or D`;
      if (errors) errors.push(msg);
      else throw new AppError(msg, 400);
    }
    if (data.difficulty && !VALID_DIFFICULTIES.includes(data.difficulty)) {
      const msg = `${pref}Invalid difficulty: ${data.difficulty}`;
      if (errors) errors.push(msg);
      else throw new AppError(msg, 400);
    }
  }
}

/** Trigram similarity between two strings (Jaccard on character trigrams) */
function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 3 || b.length < 3) return a === b ? 1 : 0;
  const tgA = buildTrigrams(a);
  const tgB = buildTrigrams(b);
  let intersection = 0;
  for (const tg of tgA) { if (tgB.has(tg)) intersection++; }
  return intersection / (tgA.size + tgB.size - intersection);
}

function buildTrigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}
