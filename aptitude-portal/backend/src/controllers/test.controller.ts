import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TestService } from '../services/test.service';
import { PortalConfigManager } from '../utils/portal.config';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';
import { saveAnswerSchema } from '../validators/test.validator';

async function getStudentId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) {
    throw new AppError('Student profile not found for this account.', 404);
  }
  return student.id;
}

export class TestController {
  /**
   * Check if test portal is currently open (Saturday & Sunday in Asia/Kolkata or Manual Staff Override)
   */
  static getPortalStatus(_req: AuthenticatedRequest, res: Response) {
    const status = PortalConfigManager.getStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  }

  /**
   * Get all topics with progress for student
   */
  static async getTopics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);
      const topics = await TestService.getTopicsWithStudentProgress(studentId);
      res.status(200).json({
        success: true,
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic details with tests
   */
  static async getTopicDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topicId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);
      const data = await TestService.getTopicDetails(topicId, studentId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get topic 3-test overall result
   */
  static async getTopicOverall(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { topicId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);
      const data = await TestService.getTopicDetails(topicId, studentId);
      res.status(200).json({
        success: true,
        data: {
          topic: data.topic,
          summary: data.overallSummary,
          tests: data.tests,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student dashboard overview metrics (2100 questions, 105 tests, 35 topics)
   */
  static async getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);
      const metrics = await TestService.getStudentDashboardMetrics(studentId);
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test details and questions without exposing correct answers
   */
  static async getTestById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);
      const data = await TestService.getTestById(testId, studentId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start or resume test (attempt #1)
   * Enforces weekend restriction when ENFORCE_WEEKEND is true
   */
  static async startTest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);

      // Portal availability check:
      const portalStatus = PortalConfigManager.getStatus();
      const enforceWeekend = process.env.ENFORCE_WEEKEND === 'true';

      if (enforceWeekend && !portalStatus.isOpen) {
        // Midnight rule: Active in-progress test started before portal closed is allowed to resume
        const existingAttempt = await prisma.testAttempt.findUnique({
          where: {
            studentId_testId_attemptNumber: { studentId, testId, attemptNumber: 1 },
          },
        });

        if (!existingAttempt || existingAttempt.status !== 'IN_PROGRESS') {
          res.status(403).json({
            success: false,
            code: 'TESTS_CLOSED',
            message: portalStatus.message || 'Aptitude tests are available only on Saturday and Sunday.',
          });
          return;
        }
      }

      const result = await TestService.startOrResumeTest(testId, studentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start retest (attempt #2) — only if original score <= 10
   * Enforces weekend restriction when ENFORCE_WEEKEND is true
   */
  static async startRetest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);

      // Portal availability check:
      const portalStatus = PortalConfigManager.getStatus();
      const enforceWeekend = process.env.ENFORCE_WEEKEND === 'true';

      if (enforceWeekend && !portalStatus.isOpen) {
        // Midnight rule: Active in-progress retest can still be resumed
        const existingRetest = await prisma.testAttempt.findUnique({
          where: {
            studentId_testId_attemptNumber: { studentId, testId, attemptNumber: 2 },
          },
        });

        if (!existingRetest || existingRetest.status !== 'IN_PROGRESS') {
          res.status(403).json({
            success: false,
            code: 'TESTS_CLOSED',
            message: portalStatus.message || 'Aptitude tests are available only on Saturday and Sunday.',
          });
          return;
        }
      }

      const result = await TestService.startRetest(testId, studentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save answer
   */
  static async saveAnswer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { questionId, selectedOption } = saveAnswerSchema.parse(req.body);
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);

      const result = await TestService.saveAnswer(attemptId, studentId, questionId, selectedOption);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit test attempt
   */
  static async submitTest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attemptId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);

      const result = await TestService.submitTest(attemptId, studentId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get test result
   */
  static async getTestResult(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attemptId } = req.params;
      if (!req.user) throw new AppError('Authentication required.', 401);

      const isStaff = req.user.role === 'STAFF';
      let studentId: string | undefined;

      if (!isStaff) {
        studentId = await getStudentId(req.user.userId);
      }

      const result = await TestService.getTestResult(attemptId, studentId, isStaff);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student monthly weekend activity and participation
   */
  static async getMonthlyActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new AppError('Authentication required.', 401);
      const studentId = await getStudentId(req.user.userId);
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

      const activity = await TestService.getMonthlyActivity(studentId, year, month);
      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }
}
