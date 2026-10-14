import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AttemptStatus, Prisma } from '@prisma/client';

export const TEST_DURATION_SECONDS = 20 * 60; // 20 minutes for 20 questions

export class TestService {
  private static async createOrFindAttempt(
    studentId: string,
    testId: string,
    attemptNumber: 1 | 2
  ) {
    const where = {
      studentId_testId_attemptNumber: { studentId, testId, attemptNumber },
    };

    try {
      return await prisma.testAttempt.upsert({
        where,
        update: {},
        create: {
          studentId,
          testId,
          attemptNumber,
          isRetest: attemptNumber === 2,
          status: AttemptStatus.IN_PROGRESS,
          startedAt: new Date(),
          attemptedCount: 0,
          unattemptedCount: 20,
        },
        include: { answers: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existingAttempt = await prisma.testAttempt.findUnique({
          where,
          include: { answers: true },
        });
        if (existingAttempt) return existingAttempt;
      }
      throw error;
    }
  }

  private static async getAttemptQuestionVersions(questionIds: string[], startedAt: Date) {
    const versions = await prisma.questionVersion.findMany({
      where: {
        questionId: { in: questionIds },
        createdAt: { gt: startedAt },
      },
      orderBy: { createdAt: 'asc' },
    });
    const versionByQuestion = new Map<string, (typeof versions)[number]>();
    for (const version of versions) {
      if (!versionByQuestion.has(version.questionId)) {
        versionByQuestion.set(version.questionId, version);
      }
    }
    return versionByQuestion;
  }

  /**
   * Get all 35 topics with individual student progress
   */
  static async getTopicsWithStudentProgress(studentId: string) {
    const topics = await prisma.topic.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        tests: {
          orderBy: { testNumber: 'asc' },
          include: {
            attempts: {
              where: { studentId },
            },
          },
        },
      },
    });

    return topics.map((topic) => {
      let completedTests = 0;
      let totalAttemptedQuestions = 0;
      let totalCorrect = 0;
      let totalScore = 0;

      const testsData = topic.tests.map((test) => {
        const attempt = test.attempts[0];
        const isSubmitted = attempt?.status === AttemptStatus.SUBMITTED;
        const isInProgress = attempt?.status === AttemptStatus.IN_PROGRESS;

        if (isSubmitted) {
          completedTests++;
          totalAttemptedQuestions += attempt.attemptedCount;
          totalCorrect += attempt.correctCount;
          totalScore += attempt.score;
        }

        return {
          id: test.id,
          testNumber: test.testNumber,
          title: test.title,
          questionCount: test.questionCount,
          status: isSubmitted
            ? 'SUBMITTED'
            : isInProgress
            ? 'IN_PROGRESS'
            : 'NOT_STARTED',
          attemptId: attempt?.id || null,
          score: attempt ? attempt.score : null,
          accuracy: attempt ? attempt.accuracy : null,
          timeTakenSeconds: attempt ? attempt.timeTakenSeconds : null,
          submittedAt: attempt ? attempt.submittedAt : null,
        };
      });

      // Progress: out of 60 questions per topic
      const progress = Math.min(100, Math.round((totalAttemptedQuestions / 60) * 100));
      const accuracy =
        totalAttemptedQuestions > 0
          ? Number(((totalCorrect / totalAttemptedQuestions) * 100).toFixed(1))
          : 0;

      return {
        id: topic.id,
        name: topic.name,
        category: topic.category,
        displayOrder: topic.displayOrder,
        tests: testsData,
        completedTests,
        totalAttemptedQuestions,
        totalCorrect,
        totalScore,
        accuracy,
        progress,
        isCompleted: completedTests === 3,
      };
    });
  }

  /**
   * Get topic details with 3 tests and combined topic stats
   */
  static async getTopicDetails(topicId: string, studentId: string) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        tests: {
          orderBy: { testNumber: 'asc' },
          include: {
            attempts: {
              where: { studentId },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new AppError(`Topic with ID "${topicId}" not found.`, 404);
    }

    let completedTestsCount = 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalScore = 0;

    const tests = topic.tests.map((test) => {
      const attempt = test.attempts[0];
      const isSubmitted = attempt?.status === AttemptStatus.SUBMITTED;
      const isInProgress = attempt?.status === AttemptStatus.IN_PROGRESS;

      if (isSubmitted) {
        completedTestsCount++;
        totalAttempted += attempt.attemptedCount;
        totalCorrect += attempt.correctCount;
        totalWrong += attempt.wrongCount;
        totalScore += attempt.score;
      }

      return {
        id: test.id,
        testNumber: test.testNumber,
        title: test.title,
        questionCount: test.questionCount,
        status: isSubmitted
          ? 'SUBMITTED'
          : isInProgress
          ? 'IN_PROGRESS'
          : 'NOT_STARTED',
        attemptId: attempt?.id || null,
        score: attempt?.score ?? null,
        accuracy: attempt?.accuracy ?? null,
        attemptedCount: attempt?.attemptedCount ?? 0,
        unattemptedCount: attempt?.unattemptedCount ?? 20,
        correctCount: attempt?.correctCount ?? 0,
        wrongCount: attempt?.wrongCount ?? 0,
        timeTakenSeconds: attempt?.timeTakenSeconds ?? null,
        startedAt: attempt?.startedAt ?? null,
        submittedAt: attempt?.submittedAt ?? null,
      };
    });

    const totalQuestions = 60; // 3 tests * 20 questions
    const totalUnattempted = totalQuestions - totalAttempted;
    const overallProgress = Math.min(100, Math.round((totalAttempted / totalQuestions) * 100));
    const overallAccuracy =
      totalAttempted > 0 ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;

    return {
      topic: {
        id: topic.id,
        name: topic.name,
        category: topic.category,
        displayOrder: topic.displayOrder,
      },
      tests,
      overallSummary: {
        totalQuestions,
        totalAttempted,
        totalUnattempted,
        totalCorrect,
        totalWrong,
        totalScore,
        overallAccuracy,
        overallProgress,
        completedTestsCount,
        isCompleted: completedTestsCount === 3,
      },
    };
  }

  /**
   * Get student dashboard overview metrics (2100 questions, 105 tests, 35 topics)
   */
  static async getStudentDashboardMetrics(studentId: string) {
    const TOTAL_QUESTIONS = 2100;
    const TOTAL_TESTS = 105;
    const TOTAL_TOPICS = 35;

    // For dashboard: count only the FIRST (official) attempt per test
    const submittedAttempts = await prisma.testAttempt.findMany({
      where: {
        studentId,
        status: AttemptStatus.SUBMITTED,
        attemptNumber: 1,
      },
      include: {
        test: {
          select: { topicId: true },
        },
      },
    });

    const testsCompleted = submittedAttempts.length;
    const testsRemaining = Math.max(0, TOTAL_TESTS - testsCompleted);

    let questionsAttempted = 0;
    let totalCorrect = 0;
    let totalScore = 0;

    // Track which topics have 3 submitted tests (first attempts only)
    const topicSubmittedTests = new Map<string, number>();

    for (const attempt of submittedAttempts) {
      questionsAttempted += attempt.attemptedCount;
      totalCorrect += attempt.correctCount;
      totalScore += attempt.score;

      const current = topicSubmittedTests.get(attempt.test.topicId) || 0;
      topicSubmittedTests.set(attempt.test.topicId, current + 1);
    }

    let topicsCompleted = 0;
    topicSubmittedTests.forEach((count) => {
      if (count >= 3) {
        topicsCompleted++;
      }
    });

    const topicsRemaining = Math.max(0, TOTAL_TOPICS - topicsCompleted);
    const questionsRemaining = Math.max(0, TOTAL_QUESTIONS - questionsAttempted);
    const overallProgress = Number(((questionsAttempted / TOTAL_QUESTIONS) * 100).toFixed(1));
    const overallAccuracy =
      questionsAttempted > 0 ? Number(((totalCorrect / questionsAttempted) * 100).toFixed(1)) : 0;

    return {
      totalQuestions: TOTAL_QUESTIONS,
      totalTests: TOTAL_TESTS,
      totalTopics: TOTAL_TOPICS,
      questionsAttempted,
      questionsRemaining,
      testsCompleted,
      testsRemaining,
      topicsCompleted,
      topicsRemaining,
      overallProgress,
      overallScore: totalScore,
      overallAccuracy,
    };
  }

  /**
   * Get test details and questions without exposing correctOption or explanations (CRITICAL SECURITY)
   */
  static async getTestById(testId: string, studentId: string) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { topic: true },
    });

    if (!test || !test.isActive) {
      throw new AppError('Test not found.', 404, 'TEST_NOT_FOUND');
    }

    const questions = await prisma.question.findMany({
      where: { testId: test.id },
      orderBy: { questionNumber: 'asc' },
      select: {
        id: true,
        questionNumber: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        difficulty: true,
        marks: true,
      },
    });

    if (questions.length !== 20) {
      throw new AppError(
        `Test configuration error: Expected 20 questions for this test, but found ${questions.length}.`,
        500,
        'INVALID_QUESTION_COUNT'
      );
    }

    // Find student attempts
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId, testId },
      include: { answers: true },
      orderBy: { attemptNumber: 'asc' },
    });

    const firstAttempt = attempts.find((a) => a.attemptNumber === 1);
    const retestAttempt = attempts.find((a) => a.attemptNumber === 2);

    const activeAttempt = retestAttempt || firstAttempt;
    const savedAnswers: Record<string, string> = {};
    if (activeAttempt?.answers) {
      for (const ans of activeAttempt.answers) {
        savedAnswers[ans.questionId] = ans.selectedOption;
      }
    }

    return {
      test: {
        id: test.id,
        testNumber: test.testNumber,
        title: test.title,
        topicId: test.topic.id,
        topicName: test.topic.name,
        topicCategory: test.topic.category,
        questionCount: questions.length,
        durationMinutes: 20,
      },
      questions,
      firstAttempt: firstAttempt
        ? {
            id: firstAttempt.id,
            status: firstAttempt.status,
            score: firstAttempt.score,
            attemptNumber: firstAttempt.attemptNumber,
            isRetest: firstAttempt.isRetest,
          }
        : null,
      retestAttempt: retestAttempt
        ? {
            id: retestAttempt.id,
            status: retestAttempt.status,
            score: retestAttempt.score,
            attemptNumber: retestAttempt.attemptNumber,
            isRetest: retestAttempt.isRetest,
          }
        : null,
      savedAnswers,
      canRetest:
        firstAttempt?.status === AttemptStatus.SUBMITTED &&
        firstAttempt.score <= 10 &&
        !retestAttempt,
    };
  }

  /**
   * Start or resume test attempt (attempt #1 only)
   * CRITICAL SECURITY: Does NOT expose correctOption or explanation!
   */
  static async startOrResumeTest(testId: string, studentId: string) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { topic: true },
    });

    if (!test || !test.isActive) {
      throw new AppError('Test not found.', 404, 'TEST_NOT_FOUND');
    }

    // Find attempt #1 for this student+test
    let attempt = await prisma.testAttempt.findUnique({
      where: {
        studentId_testId_attemptNumber: {
          studentId,
          testId,
          attemptNumber: 1,
        },
      },
      include: { answers: true },
    });

    // 1. If first attempt is submitted, return submitted status and attempt info
    if (attempt && attempt.status === AttemptStatus.SUBMITTED) {
      const result = await this.getTestResult(attempt.id, studentId, false);
      return {
        status: 'SUBMITTED' as const,
        message: 'This test has already been completed and submitted.',
        attemptId: attempt.id,
        result,
      };
    }

    // 2. Check in-progress attempt timer
    if (attempt && attempt.status === AttemptStatus.IN_PROGRESS) {
      const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
      if (elapsed >= TEST_DURATION_SECONDS) {
        const submitted = await this.evaluateAndSubmitAttempt(attempt.id, studentId);
        return {
          status: 'AUTO_SUBMITTED',
          message: 'Time has expired. Test has been automatically evaluated and submitted.',
          attemptId: attempt.id,
          result: submitted,
        };
      }
    }

    // 3. Create fresh attempt #1 if none exists
    if (!attempt) {
      attempt = await this.createOrFindAttempt(studentId, testId, 1);

      if (attempt.status === AttemptStatus.SUBMITTED) {
        const result = await this.getTestResult(attempt.id, studentId, false);
        return {
          status: 'SUBMITTED' as const,
          message: 'This test has already been completed and submitted.',
          attemptId: attempt.id,
          result,
        };
      }
    }


    return this.buildActiveTestResponse(test, attempt);
  }

  /**
   * Start a retest (attempt #2) — only allowed if original score <= 10
   * CRITICAL SECURITY: Does NOT expose correctOption or explanation!
   */
  static async startRetest(testId: string, studentId: string) {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { topic: true },
    });

    if (!test || !test.isActive) {
      throw new AppError('Test not found.', 404, 'TEST_NOT_FOUND');
    }

    // Must have a submitted attempt #1
    const firstAttempt = await prisma.testAttempt.findUnique({
      where: {
        studentId_testId_attemptNumber: {
          studentId,
          testId,
          attemptNumber: 1,
        },
      },
    });

    if (!firstAttempt || firstAttempt.status !== AttemptStatus.SUBMITTED) {
      throw new AppError(
        'You must complete the original test before requesting a retest.',
        400,
        'ORIGINAL_TEST_NOT_SUBMITTED'
      );
    }

    // Retest eligibility: score must be <= 10
    if (firstAttempt.score > 10) {
      throw new AppError(
        `Retest not available. Your score (${firstAttempt.score}/20) is above 10. Only scores ≤ 10 qualify for a retest.`,
        400,
        'RETEST_NOT_ELIGIBLE'
      );
    }

    // Check if retest (attempt #2) already exists
    let retest = await prisma.testAttempt.findUnique({
      where: {
        studentId_testId_attemptNumber: {
          studentId,
          testId,
          attemptNumber: 2,
        },
      },
      include: { answers: true },
    });

    // If retest already submitted, return submitted status
    if (retest && retest.status === AttemptStatus.SUBMITTED) {
      const result = await this.getTestResult(retest.id, studentId, false);
      return {
        status: 'SUBMITTED' as const,
        message: 'Retest has already been completed and submitted.',
        attemptId: retest.id,
        result,
      };
    }

    // Check in-progress retest timer
    if (retest && retest.status === AttemptStatus.IN_PROGRESS) {
      const elapsed = Math.floor((Date.now() - retest.startedAt.getTime()) / 1000);
      if (elapsed >= TEST_DURATION_SECONDS) {
        const submitted = await this.evaluateAndSubmitAttempt(retest.id, studentId);
        return {
          status: 'AUTO_SUBMITTED',
          message: 'Time has expired. Retest has been automatically evaluated and submitted.',
          attemptId: retest.id,
          result: submitted,
        };
      }
    }

    // Create retest (attempt #2) if not exists
    if (!retest) {
      retest = await this.createOrFindAttempt(studentId, testId, 2);
    }

    return this.buildActiveTestResponse(test, retest);
  }

  /**
   * Shared helper to build the active test response payload
   */
  private static async buildActiveTestResponse(test: any, attempt: any) {
    const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, TEST_DURATION_SECONDS - elapsed);

    // Fetch 20 questions WITHOUT correctOption or explanation (Security)
    const currentQuestions = await prisma.question.findMany({
      where: { testId: test.id },
      orderBy: { questionNumber: 'asc' },
      select: {
        id: true,
        questionNumber: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        difficulty: true,
        marks: true,
      },
    });

    if (currentQuestions.length !== 20) {
      throw new AppError(
        `Test configuration error: Expected 20 questions for this test, but found ${currentQuestions.length}.`,
        500,
        'INVALID_QUESTION_COUNT'
      );
    }
    const questionVersions = await this.getAttemptQuestionVersions(
      currentQuestions.map((question) => question.id),
      attempt.startedAt
    );
    const questions = currentQuestions.map((question) => {
      const version = questionVersions.get(question.id);
      if (!version) return question;
      return {
        ...question,
        questionText: version.questionText,
        optionA: version.optionA,
        optionB: version.optionB,
        optionC: version.optionC,
        optionD: version.optionD,
        difficulty: version.difficulty,
        marks: version.marks,
      };
    });

    // Build map of already saved answers
    const savedAnswers: Record<string, string> = {};
    if (attempt.answers) {
      for (const ans of attempt.answers) {
        savedAnswers[ans.questionId] = ans.selectedOption;
      }
    }

    return {
      status: 'IN_PROGRESS' as const,
      attempt: {
        id: attempt.id,
        testId: test.id,
        testNumber: test.testNumber,
        testTitle: test.title,
        topicId: test.topic.id,
        topicName: test.topic.name,
        topicCategory: test.topic.category,
        startedAt: attempt.startedAt,
        durationSeconds: TEST_DURATION_SECONDS,
        remainingSeconds,
        attemptNumber: attempt.attemptNumber,
        isRetest: attempt.isRetest,
      },
      questions,
      savedAnswers,
    };
  }

  /**
   * Save or update an answer during active test
   */
  static async saveAnswer(
    attemptId: string,
    studentId: string,
    questionId: string,
    selectedOption: string
  ) {
    if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
      throw new AppError('Invalid option selected. Must be A, B, C, or D.', 400);
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              where: { id: questionId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!attempt || attempt.studentId !== studentId) {
      throw new AppError('Attempt not found or access denied.', 404);
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new AppError('Test is not currently in progress.', 400);
    }

    // Verify question belongs to this test
    if (attempt.test.questions.length === 0) {
      throw new AppError('Invalid question for this test.', 400);
    }

    // Check timer limit
    const elapsed = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
    if (elapsed >= TEST_DURATION_SECONDS) {
      await this.evaluateAndSubmitAttempt(attemptId, studentId);
      throw new AppError('Time has expired. Test was automatically submitted.', 400, 'TIME_EXPIRED');
    }

    // Upsert answer
    await prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: { selectedOption, answeredAt: new Date() },
      create: { attemptId, questionId, selectedOption },
    });

    // Update attempted / unattempted count
    const totalAnswered = await prisma.answer.count({ where: { attemptId } });

    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        attemptedCount: totalAnswered,
        unattemptedCount: 20 - totalAnswered,
      },
    });

    return {
      success: true,
      questionId,
      selectedOption,
      attemptedCount: totalAnswered,
      unattemptedCount: 20 - totalAnswered,
    };
  }

  /**
   * Submit and evaluate test attempt server-side
   */
  static async submitTest(attemptId: string, studentId: string) {
    return this.evaluateAndSubmitAttempt(attemptId, studentId);
  }

  /**
   * Internal evaluation method: calculates score, accuracy, correct/wrong, time taken
   */
  private static async evaluateAndSubmitAttempt(attemptId: string, studentId: string) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: true,
            topic: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt || attempt.studentId !== studentId) {
      throw new AppError('Test attempt not found or access denied.', 404);
    }

    // If already submitted, return the persisted result
    if (attempt.status === AttemptStatus.SUBMITTED) {
      return this.formatResult(attempt);
    }

    const questions = attempt.test.questions;
    const questionVersions = await this.getAttemptQuestionVersions(
      questions.map((question: any) => question.id),
      attempt.startedAt
    );
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let correctCount = 0;
    let score = 0;

    // Evaluate each answer
    for (const answer of attempt.answers) {
      const q = questionMap.get(answer.questionId);
      if (q) {
        const historicalQuestion = questionVersions.get(q.id) ?? q;
        const isCorrect = answer.selectedOption === historicalQuestion.correctOption;
        if (isCorrect) {
          correctCount++;
          score += historicalQuestion.marks;
        }

        // Update answer record with correctness
        await prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect },
        });
      }
    }

    const attemptedCount = attempt.answers.length;
    const unattemptedCount = questions.length - attemptedCount;
    const wrongCount = attemptedCount - correctCount;
    const accuracy =
      attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(1)) : 0;

    const timeTakenSeconds = Math.min(
      TEST_DURATION_SECONDS,
      Math.max(1, Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000))
    );

    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: new Date(),
        attemptedCount,
        unattemptedCount,
        correctCount,
        wrongCount,
        score,
        accuracy,
        timeTakenSeconds,
      },
      include: {
        test: {
          include: {
            questions: true,
            topic: true,
          },
        },
        answers: true,
      },
    });

    return this.formatResult(updatedAttempt);
  }

  /**
   * Get detailed test result including question review & explanations
   * Also returns canRetest flag: true if score <= 10 and no retest exists yet
   */
  static async getTestResult(attemptId: string, studentId?: string, isStaff = false) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            name: true,
            department: true,
          },
        },
        test: {
          include: {
            topic: true,
            questions: {
              orderBy: { questionNumber: 'asc' },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new AppError('Attempt not found.', 404);
    }

    // Security check: only owning student or staff can view
    if (!isStaff && studentId && attempt.studentId !== studentId) {
      throw new AppError('Access denied.', 403);
    }

    if (attempt.status !== AttemptStatus.SUBMITTED) {
      throw new AppError('Test result is only available after submission.', 400);
    }

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const questionVersions = await this.getAttemptQuestionVersions(
      attempt.test.questions.map((question) => question.id),
      attempt.startedAt
    );

    const questionReview = attempt.test.questions.map((q) => {
      const historicalQuestion = questionVersions.get(q.id) ?? q;
      const userAns = answerMap.get(q.id);
      return {
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: historicalQuestion.questionText,
        optionA: historicalQuestion.optionA,
        optionB: historicalQuestion.optionB,
        optionC: historicalQuestion.optionC,
        optionD: historicalQuestion.optionD,
        correctOption: historicalQuestion.correctOption,
        explanation: historicalQuestion.explanation,
        marks: historicalQuestion.marks,
        difficulty: historicalQuestion.difficulty,
        subTopic: q.subTopic,
        concept: q.concept,
        selectedOption: userAns?.selectedOption || null,
        isAnswered: !!userAns,
        isCorrect: userAns?.isCorrect ?? false,
      };
    });

    // Determine retest eligibility (only for students viewing their own first attempt)
    let canRetest = false;
    let retestAttemptId: string | null = null;
    if (!isStaff && attempt.attemptNumber === 1 && attempt.score <= 10) {
      // Check if a retest (attempt #2) already exists
      const existingRetest = await prisma.testAttempt.findUnique({
        where: {
          studentId_testId_attemptNumber: {
            studentId: attempt.studentId,
            testId: attempt.testId,
            attemptNumber: 2,
          },
        },
        select: { id: true, status: true },
      });
      if (!existingRetest) {
        // No retest started yet — eligible
        canRetest = true;
      } else if (existingRetest.status === AttemptStatus.SUBMITTED) {
        // Retest done — provide its ID for viewing
        retestAttemptId = existingRetest.id;
      }
    }

    return {
      attemptId: attempt.id,
      testId: attempt.test.id,
      testNumber: attempt.test.testNumber,
      testTitle: attempt.test.title,
      topicId: attempt.test.topic.id,
      topicName: attempt.test.topic.name,
      topicCategory: attempt.test.topic.category,
      student: attempt.student,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      timeTakenSeconds: attempt.timeTakenSeconds,
      totalQuestions: 20,
      attemptedCount: attempt.attemptedCount,
      unattemptedCount: attempt.unattemptedCount,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      score: attempt.score,
      accuracy: attempt.accuracy,
      attemptNumber: attempt.attemptNumber,
      isRetest: attempt.isRetest,
      canRetest,
      retestAttemptId,
      questionReview,
    };
  }

  /**
   * Get student monthly weekend activity and participation analytics
   */
  static async getMonthlyActivity(studentId: string, yearNum?: number, monthNum?: number) {
    const now = new Date();
    // Default to current year & month in Asia/Kolkata
    const kolkataDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const [currentYearStr, currentMonthStr] = kolkataDateStr.split('-');

    const year = yearNum || parseInt(currentYearStr, 10);
    const month = monthNum || parseInt(currentMonthStr, 10); // 1-12

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(year, month, 0).getDate();

    // Fetch all submitted attempts for this student in this month
    const attempts = await prisma.testAttempt.findMany({
      where: {
        studentId,
        status: AttemptStatus.SUBMITTED,
        submittedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        test: {
          include: { topic: true },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    // Group attempts by Kolkata date string "YYYY-MM-DD"
    const attemptsByDate = new Map<string, typeof attempts>();
    for (const att of attempts) {
      if (att.submittedAt) {
        const dateKey = att.submittedAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const list = attemptsByDate.get(dateKey) || [];
        list.push(att);
        attemptsByDate.set(dateKey, list);
      }
    }

    // Collect all weekend days (Saturday = 6, Sunday = 0)
    const weekendDays: Array<{
      date: string;
      dayOfWeek: 'Saturday' | 'Sunday';
      dayOfMonth: number;
      status: 'ATTENDED' | 'MISSED' | 'UPCOMING';
      testsAttempted: number;
      questionsAttempted: number;
      score: number;
      accuracy: number;
      tests: Array<{ testTitle: string; topicName: string; score: number }>;
    }> = [];

    let attendedWeekendDays = 0;
    let missedWeekendDays = 0;
    let upcomingWeekendDays = 0;
    let availableWeekendDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(`${dateStr}T12:00:00Z`);
      const dayName = dayDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });

      if (dayName === 'Sat' || dayName === 'Sun') {
        const dayOfWeek = dayName === 'Sat' ? 'Saturday' : 'Sunday';
        const dayAttempts = attemptsByDate.get(dateStr) || [];
        const isPastOrToday = dateStr <= kolkataDateStr;

        let status: 'ATTENDED' | 'MISSED' | 'UPCOMING';
        if (dayAttempts.length > 0) {
          status = 'ATTENDED';
          attendedWeekendDays++;
          if (isPastOrToday) availableWeekendDays++;
        } else if (isPastOrToday) {
          status = 'MISSED';
          missedWeekendDays++;
          availableWeekendDays++;
        } else {
          status = 'UPCOMING';
          upcomingWeekendDays++;
        }

        let dayQuestions = 0;
        let dayScore = 0;
        let dayCorrect = 0;
        for (const a of dayAttempts) {
          dayQuestions += a.attemptedCount;
          dayScore += a.score;
          dayCorrect += a.correctCount;
        }

        weekendDays.push({
          date: dateStr,
          dayOfWeek,
          dayOfMonth: d,
          status,
          testsAttempted: dayAttempts.length,
          questionsAttempted: dayQuestions,
          score: dayScore,
          accuracy: dayQuestions > 0 ? Number(((dayCorrect / dayQuestions) * 100).toFixed(1)) : 0,
          tests: dayAttempts.map((a) => ({
            testTitle: a.test.title,
            topicName: a.test.topic.name,
            score: a.score,
          })),
        });
      }
    }

    const participationPercentage =
      availableWeekendDays > 0 ? Math.round((attendedWeekendDays / availableWeekendDays) * 100) : 0;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return {
      year,
      month,
      monthName: `${monthNames[month - 1]} ${year}`,
      totalWeekendDays: weekendDays.length,
      availableWeekendDays,
      attendedWeekendDays,
      missedWeekendDays,
      upcomingWeekendDays,
      participationPercentage,
      testsCompletedInMonth: attempts.length,
      questionsAttemptedInMonth: attempts.reduce((s, a) => s + a.attemptedCount, 0),
      currentWeekendTarget: {
        target: '1 Topic / Week',
        status: attendedWeekendDays > 0 ? 'ON_TRACK' : 'NEEDS_PRACTICE',
      },
      weekendDays,
    };
  }

  private static formatResult(attempt: any) {
    // canRetest: score <= 10 and this is attempt #1
    const canRetest = attempt.attemptNumber === 1 && attempt.score <= 10;
    return {
      attemptId: attempt.id,
      testId: attempt.test.id,
      testTitle: attempt.test.title,
      topicName: attempt.test.topic?.name,
      totalQuestions: 20,
      attemptedCount: attempt.attemptedCount,
      unattemptedCount: attempt.unattemptedCount,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      score: attempt.score,
      accuracy: attempt.accuracy,
      timeTakenSeconds: attempt.timeTakenSeconds,
      submittedAt: attempt.submittedAt,
      attemptNumber: attempt.attemptNumber,
      isRetest: attempt.isRetest,
      canRetest,
    };
  }
}
