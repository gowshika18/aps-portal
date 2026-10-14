import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AttemptStatus } from '@prisma/client';

export class StudentService {
  /**
   * Determine online status: active session with lastSeenAt within the past 10 minutes
   */
  private static isUserOnline(sessions: { isActive: boolean; lastSeenAt: Date }[]): boolean {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return sessions.some(
      (session) => session.isActive && session.lastSeenAt >= tenMinutesAgo
    );
  }

  /**
   * Get overall stats for staff dashboard top summary cards
   */
  static async getStaffStats() {
    const totalStudents = await prisma.student.count();

    // Query active sessions from the past 10 minutes for students
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeSessions = await prisma.loginSession.findMany({
      where: {
        isActive: true,
        lastSeenAt: { gte: tenMinutesAgo },
        user: { role: 'STUDENT' },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const submittedAttempts = await prisma.testAttempt.findMany({
      where: { status: AttemptStatus.SUBMITTED },
      include: {
        student: {
          select: { rollNumber: true, name: true, department: true },
        },
        test: {
          include: { topic: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const testsAttempted = submittedAttempts.length;
    let totalScoreSum = 0;
    let totalAccuracySum = 0;

    for (const att of submittedAttempts) {
      totalScoreSum += att.score;
      totalAccuracySum += att.accuracy;
    }

    const averageScore =
      testsAttempted > 0 ? Number(((totalScoreSum / (testsAttempted * 20)) * 100).toFixed(1)) : 0;
    const averageAccuracy =
      testsAttempted > 0 ? Number((totalAccuracySum / testsAttempted).toFixed(1)) : 0;

    // Recent activity list
    const recentActivity = submittedAttempts.slice(0, 8).map((att) => ({
      id: att.id,
      studentName: att.student.name,
      rollNumber: att.student.rollNumber,
      department: att.student.department,
      topicName: att.test.topic.name,
      testNumber: att.test.testNumber,
      score: att.score,
      accuracy: att.accuracy,
      submittedAt: att.submittedAt,
    }));

    return {
      totalStudents,
      activeNow: activeSessions.length,
      testsAttempted,
      averageScore,
      averageAccuracy,
      recentActivity,
    };
  }

  /**
   * List all students with live session status, last login, and real test progress
   */
  static async getAllStudentsForStaff() {
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
            lastLoginAt: true,
            sessions: {
              where: { isActive: true },
              orderBy: { lastSeenAt: 'desc' },
              take: 1,
              select: {
                id: true,
                isActive: true,
                lastSeenAt: true,
                loginAt: true,
              },
            },
          },
        },
        attempts: {
          where: { status: AttemptStatus.SUBMITTED },
          include: {
            test: {
              select: { topicId: true },
            },
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    return students.map((s) => {
      const isOnline = this.isUserOnline(s.user.sessions);
      const latestSession = s.user.sessions[0];

      const testsCompleted = s.attempts.length;
      let questionsAttempted = 0;
      let totalCorrect = 0;
      let totalScore = 0;

      const topicCounts = new Map<string, number>();
      for (const att of s.attempts) {
        questionsAttempted += att.attemptedCount;
        totalCorrect += att.correctCount;
        totalScore += att.score;
        topicCounts.set(att.test.topicId, (topicCounts.get(att.test.topicId) || 0) + 1);
      }

      let topicsCompleted = 0;
      topicCounts.forEach((cnt) => {
        if (cnt >= 3) topicsCompleted++;
      });

      const overallProgress = Number(((questionsAttempted / 2160) * 100).toFixed(1));
      const accuracy =
        questionsAttempted > 0 ? Number(((totalCorrect / questionsAttempted) * 100).toFixed(1)) : 0;
      const averageScore =
        testsCompleted > 0 ? Number(((totalScore / (testsCompleted * 20)) * 100).toFixed(1)) : 0;

      return {
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        email: s.email,
        department: s.department,
        year: s.year,
        section: s.section,
        isOnline,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        lastLoginAt: s.user.lastLoginAt,
        lastSeenAt: latestSession?.lastSeenAt || s.user.lastLoginAt,
        overallProgress,
        testsCompleted,
        topicsCompleted,
        questionsAttempted,
        accuracy,
        averageScore,
      };
    });
  }

  /**
   * Get single student detailed profile for staff view
   */
  static async getStudentDetailsForStaff(rollNumber: string) {
    const student = await prisma.student.findUnique({
      where: { rollNumber: rollNumber.trim() },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
            lastLoginAt: true,
            sessions: {
              orderBy: { lastSeenAt: 'desc' },
              take: 5,
              select: {
                id: true,
                isActive: true,
                loginAt: true,
                logoutAt: true,
                lastSeenAt: true,
                ipAddress: true,
                userAgent: true,
              },
            },
          },
        },
        attempts: {
          include: {
            test: {
              include: { topic: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new AppError(`Student with Roll Number "${rollNumber}" not found.`, 404);
    }

    const topics = await prisma.topic.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        tests: {
          orderBy: { testNumber: 'asc' },
        },
      },
    });

    const attemptMap = new Map(student.attempts.map((a) => [a.testId, a]));

    let totalTestsCompleted = 0;
    let totalQuestionsAttempted = 0;
    let totalCorrectCount = 0;
    let totalScoreSum = 0;
    let totalTopicsCompleted = 0;

    const topicProgress = topics.map((t) => {
      let topicCompletedTests = 0;
      let topicAttemptedQ = 0;
      let topicScore = 0;
      let topicCorrect = 0;

      const tests = t.tests.map((test) => {
        const att = attemptMap.get(test.id);
        const isSubmitted = att?.status === AttemptStatus.SUBMITTED;

        if (isSubmitted && att) {
          topicCompletedTests++;
          topicAttemptedQ += att.attemptedCount;
          topicScore += att.score;
          topicCorrect += att.correctCount;

          totalTestsCompleted++;
          totalQuestionsAttempted += att.attemptedCount;
          totalCorrectCount += att.correctCount;
          totalScoreSum += att.score;
        }

        return {
          id: test.id,
          testNumber: test.testNumber,
          title: test.title,
          isSubmitted: isSubmitted || false,
          attemptId: att?.id || null,
          score: att ? att.score : null,
          accuracy: att ? att.accuracy : null,
          timeTakenSeconds: att ? att.timeTakenSeconds : null,
          submittedAt: att ? att.submittedAt : null,
        };
      });

      if (topicCompletedTests === 3) {
        totalTopicsCompleted++;
      }

      const progress = Math.round((topicAttemptedQ / 60) * 100);
      const accuracy =
        topicAttemptedQ > 0 ? Number(((topicCorrect / topicAttemptedQ) * 100).toFixed(1)) : 0;

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        displayOrder: t.displayOrder,
        progress,
        isCompleted: topicCompletedTests === 3,
        completedTestsCount: topicCompletedTests,
        totalScore: topicScore,
        accuracy,
        tests,
      };
    });

    const isOnline = this.isUserOnline(student.user.sessions.filter((s) => s.isActive));
    const latestSession = student.user.sessions[0];

    const overallProgress = Number(((totalQuestionsAttempted / 2160) * 100).toFixed(1));
    const overallAccuracy =
      totalQuestionsAttempted > 0
        ? Number(((totalCorrectCount / totalQuestionsAttempted) * 100).toFixed(1))
        : 0;

    return {
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        section: student.section,
        isOnline,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        lastLoginAt: student.user.lastLoginAt,
        lastSeenAt: latestSession?.lastSeenAt || student.user.lastLoginAt,
      },
      stats: {
        overallProgress,
        testsCompleted: totalTestsCompleted,
        totalTests: 108,
        topicsCompleted: totalTopicsCompleted,
        totalTopics: 36,
        questionsAttempted: totalQuestionsAttempted,
        questionsRemaining: 2160 - totalQuestionsAttempted,
        overallScore: totalScoreSum,
        overallAccuracy,
      },
      topics: topicProgress,
      recentSessions: student.user.sessions.map((s) => ({
        id: s.id,
        loginAt: s.loginAt,
        logoutAt: s.logoutAt,
        lastSeenAt: s.lastSeenAt,
        isActive: s.isActive,
        ipAddress: s.ipAddress,
      })),
    };
  }

  /**
   * Get comprehensive batch analytics across topics, categories, and departments
   */
  static async getBatchAnalytics() {
    const topics = await prisma.topic.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        tests: {
          include: {
            attempts: {
              where: { status: AttemptStatus.SUBMITTED },
            },
          },
        },
      },
    });

    const allSubmittedAttempts = await prisma.testAttempt.findMany({
      where: { status: AttemptStatus.SUBMITTED },
      include: {
        student: { select: { department: true, rollNumber: true, name: true } },
        test: { include: { topic: true } },
      },
    });

    // 1. Topic Performance Matrix (all 36 topics)
    const topicMatrix = topics.map((t) => {
      let attemptsCount = 0;
      let totalScore = 0;
      let totalAccuracy = 0;

      for (const test of t.tests) {
        for (const att of test.attempts) {
          attemptsCount++;
          totalScore += att.score;
          totalAccuracy += att.accuracy;
        }
      }

      const avgScore =
        attemptsCount > 0 ? Number(((totalScore / (attemptsCount * 20)) * 100).toFixed(1)) : 0;
      const avgAccuracy =
        attemptsCount > 0 ? Number((totalAccuracy / attemptsCount).toFixed(1)) : 0;

      return {
        id: t.id,
        name: t.name,
        category: t.category,
        displayOrder: t.displayOrder,
        attemptsCount,
        averageScore: avgScore,
        averageAccuracy: avgAccuracy,
      };
    });

    // 2. Department Breakdown
    const deptMap = new Map<
      string,
      { attempts: number; totalScore: number; studentCount: Set<string> }
    >();
    const students = await prisma.student.findMany({ select: { id: true, department: true } });
    const allDeptStudents = new Map<string, number>();
    for (const s of students) {
      allDeptStudents.set(s.department, (allDeptStudents.get(s.department) || 0) + 1);
    }

    for (const att of allSubmittedAttempts) {
      const dept = att.student.department || 'Unknown';
      const curr = deptMap.get(dept) || {
        attempts: 0,
        totalScore: 0,
        studentCount: new Set<string>(),
      };
      curr.attempts++;
      curr.totalScore += att.score;
      curr.studentCount.add(att.student.rollNumber);
      deptMap.set(dept, curr);
    }

    const departmentStats = Array.from(allDeptStudents.entries()).map(([dept, totalStudents]) => {
      const data = deptMap.get(dept);
      const attempts = data?.attempts || 0;
      const avgScore =
        attempts > 0 ? Number(((data!.totalScore / (attempts * 20)) * 100).toFixed(1)) : 0;

      return {
        department: dept,
        totalStudents,
        participatingStudents: data?.studentCount.size || 0,
        totalAttempts: attempts,
        averageScore: avgScore,
      };
    });

    // 3. Category Comparison (QUANTITATIVE vs LOGICAL)
    let quantAttempts = 0,
      quantScore = 0;
    let logicalAttempts = 0,
      logicalScore = 0;

    for (const att of allSubmittedAttempts) {
      if (att.test.topic.category === 'QUANTITATIVE') {
        quantAttempts++;
        quantScore += att.score;
      } else {
        logicalAttempts++;
        logicalScore += att.score;
      }
    }

    const categoryStats = {
      quantitative: {
        totalTopics: 20,
        attemptsCount: quantAttempts,
        averageScore:
          quantAttempts > 0 ? Number(((quantScore / (quantAttempts * 20)) * 100).toFixed(1)) : 0,
      },
      logical: {
        totalTopics: 16,
        attemptsCount: logicalAttempts,
        averageScore:
          logicalAttempts > 0
            ? Number(((logicalScore / (logicalAttempts * 20)) * 100).toFixed(1))
            : 0,
      },
    };

    // 4. Score Distribution Buckets (0-20, 21-40, 41-60, 61-80, 81-100%)
    const scoreBuckets = {
      '0-20%': 0,
      '21-40%': 0,
      '41-60%': 0,
      '61-80%': 0,
      '81-100%': 0,
    };

    for (const att of allSubmittedAttempts) {
      const pct = (att.score / 20) * 100;
      if (pct <= 20) scoreBuckets['0-20%']++;
      else if (pct <= 40) scoreBuckets['21-40%']++;
      else if (pct <= 60) scoreBuckets['41-60%']++;
      else if (pct <= 80) scoreBuckets['61-80%']++;
      else scoreBuckets['81-100%']++;
    }

    return {
      totalAttempts: allSubmittedAttempts.length,
      topicMatrix,
      departmentStats,
      categoryStats,
      scoreBuckets,
    };
  }

  /**
   * Get real-time live monitoring metrics: ongoing in-progress attempts and online students
   */
  static async getLiveMonitoring() {
    const inProgressAttempts = await prisma.testAttempt.findMany({
      where: { status: AttemptStatus.IN_PROGRESS },
      include: {
        student: {
          select: { rollNumber: true, name: true, department: true },
        },
        test: {
          include: { topic: true },
        },
        answers: {
          select: { id: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    const activeTests = inProgressAttempts.map((att) => {
      const elapsedSeconds = Math.floor((Date.now() - att.startedAt.getTime()) / 1000);
      const remainingSeconds = Math.max(0, 1200 - elapsedSeconds);

      return {
        attemptId: att.id,
        rollNumber: att.student.rollNumber,
        studentName: att.student.name,
        department: att.student.department,
        topicName: att.test.topic.name,
        testNumber: att.test.testNumber,
        answeredCount: att.answers.length,
        totalQuestions: 20,
        startedAt: att.startedAt,
        elapsedSeconds,
        remainingSeconds,
      };
    });

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeSessions = await prisma.loginSession.findMany({
      where: {
        isActive: true,
        lastSeenAt: { gte: tenMinutesAgo },
        user: { role: 'STUDENT' },
      },
      include: {
        user: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    const onlineStudents = activeSessions
      .filter((s) => s.user.student)
      .map((s) => ({
        rollNumber: s.user.student!.rollNumber,
        name: s.user.student!.name,
        department: s.user.student!.department,
        loginAt: s.loginAt,
        lastSeenAt: s.lastSeenAt,
        ipAddress: s.ipAddress,
      }));

    return {
      activeTestsCount: activeTests.length,
      activeTests,
      onlineCount: onlineStudents.length,
      onlineStudents,
    };
  }
}
