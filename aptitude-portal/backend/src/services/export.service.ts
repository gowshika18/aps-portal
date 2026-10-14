import { prisma } from '../utils/prisma';
import { AttemptStatus } from '@prisma/client';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const dataLines = rows.map((row) => row.map(escapeCSV).join(','));
  return [headerLine, ...dataLines].join('\n');
}

export class ExportService {
  /**
   * Student performance summary CSV
   */
  static async studentPerformanceCSV(): Promise<string> {
    const students = await prisma.student.findMany({
      orderBy: { rollNumber: 'asc' },
      include: {
        attempts: {
          where: { status: AttemptStatus.SUBMITTED },
          include: { test: { select: { topicId: true } } },
        },
      },
    });

    const headers = [
      'Roll Number', 'Name', 'Department', 'Year', 'Section',
      'Tests Completed', 'Topics Completed', 'Questions Attempted',
      'Correct', 'Wrong', 'Accuracy %', 'Overall Score',
    ];

    const rows = students.map((s) => {
      let attempted = 0, correct = 0, wrong = 0, score = 0;
      const topicCounts = new Map<string, number>();

      for (const att of s.attempts) {
        attempted += att.attemptedCount;
        correct += att.correctCount;
        wrong += att.wrongCount;
        score += att.score;
        topicCounts.set(att.test.topicId, (topicCounts.get(att.test.topicId) || 0) + 1);
      }

      let topicsCompleted = 0;
      topicCounts.forEach((cnt) => { if (cnt >= 3) topicsCompleted++; });

      const accuracy = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0;

      return [
        s.rollNumber, s.name, s.department, s.year, s.section,
        s.attempts.length, topicsCompleted, attempted,
        correct, wrong, accuracy, score,
      ];
    });

    return buildCSV(headers, rows);
  }

  /**
   * Per-topic student performance CSV
   */
  static async topicPerformanceCSV(): Promise<string> {
    const attempts = await prisma.testAttempt.findMany({
      where: { status: AttemptStatus.SUBMITTED },
      include: {
        student: { select: { rollNumber: true, name: true } },
        test: { include: { topic: true } },
      },
      orderBy: [{ student: { rollNumber: 'asc' } }, { test: { topic: { displayOrder: 'asc' } } }],
    });

    // Group by student + topic
    const grouped = new Map<string, {
      rollNumber: string; name: string; topicName: string;
      testsCompleted: number; attempted: number;
      correct: number; wrong: number; score: number;
    }>();

    for (const att of attempts) {
      const key = `${att.student.rollNumber}__${att.test.topicId}`;
      const existing = grouped.get(key) ?? {
        rollNumber: att.student.rollNumber,
        name: att.student.name,
        topicName: att.test.topic.name,
        testsCompleted: 0, attempted: 0, correct: 0, wrong: 0, score: 0,
      };
      existing.testsCompleted++;
      existing.attempted += att.attemptedCount;
      existing.correct += att.correctCount;
      existing.wrong += att.wrongCount;
      existing.score += att.score;
      grouped.set(key, existing);
    }

    const headers = [
      'Roll Number', 'Name', 'Topic',
      'Tests Completed', 'Questions Attempted', 'Correct', 'Wrong',
      'Score', 'Accuracy %', 'Completion %',
    ];

    const rows = Array.from(grouped.values()).map((r) => {
      const accuracy = r.attempted > 0 ? Number(((r.correct / r.attempted) * 100).toFixed(1)) : 0;
      const completion = Math.round((r.attempted / 60) * 100);
      return [
        r.rollNumber, r.name, r.topicName,
        r.testsCompleted, r.attempted, r.correct, r.wrong,
        r.score, accuracy, completion,
      ];
    });

    return buildCSV(headers, rows);
  }

  /**
   * Weekend activity CSV
   */
  static async weekendActivityCSV(year: number, month: number): Promise<string> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const attempts = await prisma.testAttempt.findMany({
      where: {
        status: AttemptStatus.SUBMITTED,
        submittedAt: { gte: startDate, lte: endDate },
      },
      include: {
        student: { select: { rollNumber: true, name: true, department: true } },
        test: { include: { topic: true } },
      },
      orderBy: [{ student: { rollNumber: 'asc' } }, { submittedAt: 'asc' }],
    });

    const headers = [
      'Roll Number', 'Student', 'Department', 'Date', 'Day of Week',
      'Topic', 'Test Number', 'Questions Attempted', 'Correct', 'Score', 'Accuracy %',
    ];

    const rows = attempts
      .filter((att) => {
        if (!att.submittedAt) return false;
        const day = att.submittedAt.toLocaleDateString('en-US', {
          timeZone: 'Asia/Kolkata', weekday: 'short',
        });
        return day === 'Sat' || day === 'Sun';
      })
      .map((att) => {
        const dayName = att.submittedAt!.toLocaleDateString('en-US', {
          timeZone: 'Asia/Kolkata', weekday: 'long',
        });
        const dateStr = att.submittedAt!.toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
        });
        return [
          att.student.rollNumber, att.student.name, att.student.department,
          dateStr, dayName, att.test.topic.name, att.test.testNumber,
          att.attemptedCount, att.correctCount, att.score, att.accuracy,
        ];
      });

    return buildCSV(headers, rows);
  }
}
