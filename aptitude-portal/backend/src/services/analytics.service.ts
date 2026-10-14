import { prisma } from '../utils/prisma';
import { AttemptStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Full student performance intelligence — advanced metrics, topic breakdown, trends
   */
  static async getStudentAdvancedAnalytics(studentId: string) {
    // Fetch all submitted attempts with answers and questions
    const attempts = await prisma.testAttempt.findMany({
      where: { studentId, status: AttemptStatus.SUBMITTED },
      include: {
        test: { include: { topic: true } },
        answers: {
          include: {
            question: {
              select: { id: true, difficulty: true, marks: true, correctOption: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });

    if (attempts.length === 0) {
      return this.emptyAnalytics();
    }

    // ── Overall Metrics ──
    let totalAttempted = 0, totalCorrect = 0, totalWrong = 0, totalScore = 0;
    let totalTimeSeconds = 0;
    const allAnswerTimes: number[] = [];

    for (const att of attempts) {
      totalAttempted += att.attemptedCount;
      totalCorrect += att.correctCount;
      totalWrong += att.wrongCount;
      totalScore += att.score;
      totalTimeSeconds += att.timeTakenSeconds;

      for (const ans of att.answers) {
        if (ans.timeSpentSeconds != null && ans.timeSpentSeconds > 0) {
          allAnswerTimes.push(ans.timeSpentSeconds);
        }
      }
    }

    const totalTests = attempts.length;
    const totalUnattempted = totalTests * 20 - totalAttempted;
    const overallAccuracy = totalAttempted > 0
      ? Number(((totalCorrect / totalAttempted) * 100).toFixed(1)) : 0;
    const avgScorePercent = totalTests > 0
      ? Number(((totalScore / (totalTests * 20)) * 100).toFixed(1)) : 0;
    const avgTimePerTest = totalTests > 0 ? Math.round(totalTimeSeconds / totalTests) : 0;
    const avgTimePerQuestion = totalAttempted > 0
      ? Number((totalTimeSeconds / totalAttempted).toFixed(1)) : 0;

    // ── Topic-Level Analysis ──
    const topicMap = new Map<string, {
      topicId: string; topicName: string; category: string; displayOrder: number;
      testsCompleted: number; questionsAttempted: number;
      correct: number; wrong: number; unattempted: number;
      score: number; totalTime: number; submittedDates: Date[];
    }>();

    for (const att of attempts) {
      const { topic } = att.test;
      const existing = topicMap.get(topic.id) ?? {
        topicId: topic.id, topicName: topic.name, category: topic.category,
        displayOrder: topic.displayOrder, testsCompleted: 0,
        questionsAttempted: 0, correct: 0, wrong: 0, unattempted: 0,
        score: 0, totalTime: 0, submittedDates: [],
      };
      existing.testsCompleted++;
      existing.questionsAttempted += att.attemptedCount;
      existing.correct += att.correctCount;
      existing.wrong += att.wrongCount;
      existing.unattempted += att.unattemptedCount;
      existing.score += att.score;
      existing.totalTime += att.timeTakenSeconds;
      if (att.submittedAt) existing.submittedDates.push(att.submittedAt);
      topicMap.set(topic.id, existing);
    }

    const topicAnalytics = Array.from(topicMap.values()).map((t) => {
      const accuracy = t.questionsAttempted > 0
        ? Number(((t.correct / t.questionsAttempted) * 100).toFixed(1)) : 0;
      const avgTime = t.testsCompleted > 0
        ? Math.round(t.totalTime / t.testsCompleted) : 0;
      const completionPct = Math.round((t.questionsAttempted / 60) * 100);
      return {
        ...t,
        accuracy,
        avgTimePerTest: avgTime,
        completionPct,
        isCompleted: t.testsCompleted === 3,
        submittedDates: t.submittedDates,
      };
    });

    // ── Time Distribution ──
    const timeBuckets = { lt30: 0, t30_60: 0, t60_90: 0, t90_120: 0, gt120: 0 };
    for (const t of allAnswerTimes) {
      if (t < 30) timeBuckets.lt30++;
      else if (t <= 60) timeBuckets.t30_60++;
      else if (t <= 90) timeBuckets.t60_90++;
      else if (t <= 120) timeBuckets.t90_120++;
      else timeBuckets.gt120++;
    }

    // ── Trend Data (weekly buckets, by ISO week) ──
    const weeklyMap = new Map<string, {
      weekLabel: string; testsCompleted: number; questionsAttempted: number;
      correct: number; totalScore: number; topicsCompletedIds: Set<string>;
    }>();

    for (const att of attempts) {
      if (!att.submittedAt) continue;
      const d = new Date(att.submittedAt);
      // ISO week label: YYYY-Www
      const weekKey = getISOWeekLabel(d);
      const existing = weeklyMap.get(weekKey) ?? {
        weekLabel: weekKey, testsCompleted: 0, questionsAttempted: 0,
        correct: 0, totalScore: 0, topicsCompletedIds: new Set<string>(),
      };
      existing.testsCompleted++;
      existing.questionsAttempted += att.attemptedCount;
      existing.correct += att.correctCount;
      existing.totalScore += att.score;
      weeklyMap.set(weekKey, existing);
    }

    // Accumulate topic completions per week
    for (const att of attempts) {
      if (!att.submittedAt) continue;
      const weekKey = getISOWeekLabel(new Date(att.submittedAt));
      const wk = weeklyMap.get(weekKey);
      if (wk && topicMap.get(att.test.topicId)?.testsCompleted === 3) {
        wk.topicsCompletedIds.add(att.test.topicId);
      }
    }

    const weeklyTrend = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, wk]) => ({
        weekLabel: wk.weekLabel,
        testsCompleted: wk.testsCompleted,
        questionsAttempted: wk.questionsAttempted,
        accuracy: wk.questionsAttempted > 0
          ? Number(((wk.correct / wk.questionsAttempted) * 100).toFixed(1)) : 0,
        topicsCompleted: wk.topicsCompletedIds.size,
      }));

    return {
      overall: {
        totalTests,
        totalAttempted,
        totalCorrect,
        totalWrong,
        totalUnattempted,
        totalScore,
        overallAccuracy,
        avgScorePercent,
        avgTimePerTest,
        avgTimePerQuestion,
        totalTimeSeconds,
      },
      topicAnalytics: topicAnalytics.sort((a, b) => a.displayOrder - b.displayOrder),
      timeDistribution: timeBuckets,
      weeklyTrend,
    };
  }

  /**
   * Weak-area identification based on configurable thresholds
   */
  static async getWeakAreas(
    studentId: string,
    lowAccuracyThreshold = 60,
    lowCompletionThreshold = 100
  ) {
    const analytics = await this.getStudentAdvancedAnalytics(studentId);
    const allTopics = await prisma.topic.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { tests: { orderBy: { testNumber: 'asc' } } },
    });

    const attemptedTopicMap = new Map(
      analytics.topicAnalytics.map((t) => [t.topicId, t])
    );

    const weakAreas = [];
    for (const topic of allTopics) {
      const data = attemptedTopicMap.get(topic.id);

      const accuracy = data?.accuracy ?? 0;
      const completion = data?.completionPct ?? 0;
      const attempted = data?.questionsAttempted ?? 0;
      const unattemptedInTopic = 60 - attempted;
      const testsCompleted = data?.testsCompleted ?? 0;

      const reasons: string[] = [];
      if (accuracy > 0 && accuracy < lowAccuracyThreshold)
        reasons.push(`Accuracy below ${lowAccuracyThreshold}%`);
      if (completion < lowCompletionThreshold && testsCompleted > 0)
        reasons.push('Topic not fully completed');
      if (testsCompleted === 0)
        reasons.push('Not started');

      // High unattempted questions in any test is a concern
      const highUnattempted = data?.unattempted ?? 0;
      if (highUnattempted > 10 && testsCompleted > 0)
        reasons.push('High unattempted questions');

      if (reasons.length > 0) {
        weakAreas.push({
          topicId: topic.id,
          topicName: topic.name,
          category: topic.category,
          accuracy,
          completionPct: completion,
          questionsAttempted: attempted,
          questionsRemaining: unattemptedInTopic,
          testsCompleted,
          reasons,
          suggestedPracticeArea: getSuggestedPractice(topic.category, accuracy),
        });
      }
    }

    return {
      thresholds: { lowAccuracyThreshold, lowCompletionThreshold },
      weakAreasCount: weakAreas.length,
      weakAreas: weakAreas.sort((a, b) => a.accuracy - b.accuracy),
    };
  }

  /**
   * Per-question statistics for staff analytics dashboard
   */
  static async getQuestionAnalytics(
    page = 1,
    pageSize = 50,
    topicId?: string,
    testId?: string,
    search?: string
  ) {
    const where: any = {};
    if (topicId) where.test = { topicId };
    if (testId) where.testId = testId;
    if (search) where.questionText = { contains: search, mode: 'insensitive' };

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        include: {
          test: { include: { topic: true } },
          answers: { select: { isCorrect: true, timeSpentSeconds: true } },
        },
        orderBy: [{ test: { topic: { displayOrder: 'asc' } } }, { questionNumber: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const rows = questions.map((q) => {
      const attempts = q.answers.length;
      const correct = q.answers.filter((a) => a.isCorrect).length;
      const wrong = attempts - correct;
      const accuracy = attempts > 0 ? Number(((correct / attempts) * 100).toFixed(1)) : 0;
      const times = q.answers
        .filter((a) => a.timeSpentSeconds != null && a.timeSpentSeconds > 0)
        .map((a) => a.timeSpentSeconds!);
      const avgTime = times.length > 0
        ? Math.round(times.reduce((s, t) => s + t, 0) / times.length) : null;

      return {
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText.slice(0, 100) + (q.questionText.length > 100 ? '...' : ''),
        topicId: q.test.topicId,
        topicName: q.test.topic.name,
        testId: q.testId,
        testNumber: q.test.testNumber,
        difficulty: q.difficulty,
        marks: q.marks,
        isActive: q.isActive,
        isDuplicate: q.isDuplicate,
        attempts,
        correct,
        wrong,
        accuracy,
        avgTimeSeconds: avgTime,
      };
    });

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      questions: rows,
    };
  }

  /**
   * System-wide data integrity check
   */
  static async runIntegrityCheck() {
    const results: { check: string; status: 'PASS' | 'WARNING' | 'ERROR'; detail: string }[] = [];

    const [topicCount, testCount, questionCount] = await Promise.all([
      prisma.topic.count(),
      prisma.test.count(),
      prisma.question.count(),
    ]);

    results.push({
      check: 'Total Topics',
      status: topicCount === 35 ? 'PASS' : 'ERROR',
      detail: `Expected 35, found ${topicCount}`,
    });
    results.push({
      check: 'Total Tests',
      status: testCount === 105 ? 'PASS' : 'ERROR',
      detail: `Expected 105, found ${testCount}`,
    });
    results.push({
      check: 'Total Questions',
      status: questionCount === 2100 ? 'PASS' : 'ERROR',
      detail: `Expected 2100, found ${questionCount}`,
    });

    // Check 20 questions per test
    const testsWith20 = await prisma.test.count({
      where: { questions: { every: {} } },
    });
    const testsWithWrongCount = await prisma.test.findMany({
      include: { _count: { select: { questions: true } } },
      where: { questions: { none: {} } },
    });
    // More precise: count tests where questionCount != 20
    const questionsByTest = await prisma.$queryRaw<{ testId: string; cnt: number }[]>`
      SELECT "testId", COUNT(*)::int as cnt FROM questions GROUP BY "testId"
    `;
    const badTests = questionsByTest.filter((r) => r.cnt !== 20);
    results.push({
      check: '20 Questions Per Test',
      status: badTests.length === 0 ? 'PASS' : 'ERROR',
      detail: badTests.length === 0 ? 'All tests have 20 questions'
        : `${badTests.length} test(s) have wrong question count`,
    });

    // Check 3 tests per topic
    const testsByTopic = await prisma.$queryRaw<{ topicId: string; cnt: number }[]>`
      SELECT "topicId", COUNT(*)::int as cnt FROM tests GROUP BY "topicId"
    `;
    const badTopics = testsByTopic.filter((r) => r.cnt !== 3);
    results.push({
      check: '3 Tests Per Topic',
      status: badTopics.length === 0 ? 'PASS' : 'ERROR',
      detail: badTopics.length === 0 ? 'All topics have 3 tests'
        : `${badTopics.length} topic(s) have wrong test count`,
    });

    // Missing correct options
    const missingCorrect = await prisma.question.count({
      where: { correctOption: { notIn: ['A', 'B', 'C', 'D'] } },
    });
    results.push({
      check: 'Valid Correct Options',
      status: missingCorrect === 0 ? 'PASS' : 'ERROR',
      detail: missingCorrect === 0 ? 'All questions have valid correct options'
        : `${missingCorrect} question(s) have invalid correct options`,
    });

    // Duplicate question numbers within same test
    const dupQNumbers = await prisma.$queryRaw<{ testId: string; cnt: number }[]>`
      SELECT "testId", COUNT(*)::int as cnt FROM (
        SELECT "testId", "questionNumber", COUNT(*) as dupes
        FROM questions GROUP BY "testId", "questionNumber" HAVING COUNT(*) > 1
      ) sub GROUP BY "testId"
    `;
    results.push({
      check: 'Duplicate Question Numbers',
      status: dupQNumbers.length === 0 ? 'PASS' : 'ERROR',
      detail: dupQNumbers.length === 0 ? 'No duplicate question numbers'
        : `${dupQNumbers.length} test(s) have duplicate question numbers`,
    });

    // Orphan answers (attempt not found)
    const orphanAnswers = await prisma.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(*)::int as cnt FROM answers a
      LEFT JOIN test_attempts t ON a."attemptId" = t.id
      WHERE t.id IS NULL
    `;
    results.push({
      check: 'Orphan Answer Records',
      status: orphanAnswers[0]?.cnt === 0 ? 'PASS' : 'WARNING',
      detail: `${orphanAnswers[0]?.cnt ?? 0} orphan answer record(s)`,
    });

    // Duplicate attempts (same student/test/attempt-number tuple)
    const dupAttempts = await prisma.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(*)::int as cnt FROM (
        SELECT "studentId", "testId", "attemptNumber", COUNT(*) as dupes
        FROM test_attempts GROUP BY "studentId", "testId", "attemptNumber" HAVING COUNT(*) > 1
      ) sub
    `;
    results.push({
      check: 'Duplicate Test Attempts',
      status: dupAttempts[0]?.cnt === 0 ? 'PASS' : 'ERROR',
      detail: `${dupAttempts[0]?.cnt ?? 0} duplicate attempt(s) detected`,
    });

    // Flagged duplicates
    const flaggedDuplicates = await prisma.question.count({ where: { isDuplicate: true } });
    results.push({
      check: 'Flagged Duplicate Questions',
      status: flaggedDuplicates === 0 ? 'PASS' : 'WARNING',
      detail: `${flaggedDuplicates} question(s) flagged as potential duplicates`,
    });

    const passCount = results.filter((r) => r.status === 'PASS').length;
    const warnCount = results.filter((r) => r.status === 'WARNING').length;
    const errCount = results.filter((r) => r.status === 'ERROR').length;
    const overallStatus = errCount > 0 ? 'FAIL' : warnCount > 0 ? 'WARNING' : 'PASS';

    return {
      overallStatus,
      summary: {
        totalTopics: topicCount,
        totalTests: testCount,
        totalQuestions: questionCount,
        pass: passCount,
        warnings: warnCount,
        errors: errCount,
      },
      counts: { topicCount, testCount, questionCount },
      checks: results,
    };
  }

  private static emptyAnalytics() {
    return {
      overall: {
        totalTests: 0, totalAttempted: 0, totalCorrect: 0,
        totalWrong: 0, totalUnattempted: 0, totalScore: 0,
        overallAccuracy: 0, avgScorePercent: 0,
        avgTimePerTest: 0, avgTimePerQuestion: 0, totalTimeSeconds: 0,
      },
      topicAnalytics: [],
      timeDistribution: { lt30: 0, t30_60: 0, t60_90: 0, t90_120: 0, gt120: 0 },
      weeklyTrend: [],
    };
  }
}

function getISOWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getSuggestedPractice(category: string, accuracy: number): string {
  if (accuracy === 0) return 'Begin with the basics and attempt all questions';
  if (accuracy < 40) return 'Focus on concept fundamentals and formula review';
  if (accuracy < 60) return 'Practice medium-difficulty problems to improve consistency';
  return 'Work on speed and tackle timed practice sets';
}
