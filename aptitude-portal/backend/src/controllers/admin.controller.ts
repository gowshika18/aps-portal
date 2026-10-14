import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { QuestionManagementService } from '../services/question-management.service';
import { AuditService, AnnouncementService, SystemSettingsService } from '../services/admin.service';
import { AccountManagementService } from '../services/account-management.service';
import { ExportService } from '../services/export.service';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';

export class AdminController {
  // ── Analytics ──────────────────────────────────────────────────────────

  static async getStudentAdvancedAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rollNumber } = req.params;
      const student = await prisma.student.findUnique({ where: { rollNumber } });
      if (!student) { res.status(404).json({ success: false, message: 'Student not found.' }); return; }
      const data = await AnalyticsService.getStudentAdvancedAnalytics(student.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getStudentWeakAreas(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rollNumber } = req.params;
      const lowAcc = Number(req.query.lowAccuracy ?? 60);
      const lowComp = Number(req.query.lowCompletion ?? 100);
      const student = await prisma.student.findUnique({ where: { rollNumber } });
      if (!student) { res.status(404).json({ success: false, message: 'Student not found.' }); return; }
      const data = await AnalyticsService.getWeakAreas(student.id, lowAcc, lowComp);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getMyAdvancedAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await prisma.student.findFirst({ where: { userId: req.user!.userId } });
      if (!student) { res.status(404).json({ success: false, message: 'Student profile not found.' }); return; }
      const data = await AnalyticsService.getStudentAdvancedAnalytics(student.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getMyWeakAreas(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await prisma.student.findFirst({ where: { userId: req.user!.userId } });
      if (!student) { res.status(404).json({ success: false, message: 'Student profile not found.' }); return; }
      const lowAcc = Number(req.query.lowAccuracy ?? 60);
      const lowComp = Number(req.query.lowCompletion ?? 100);
      const data = await AnalyticsService.getWeakAreas(student.id, lowAcc, lowComp);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getQuestionAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 50);
      const { topicId, testId, search } = req.query as any;
      const data = await AnalyticsService.getQuestionAnalytics(page, pageSize, topicId, testId, search);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async runIntegrityCheck(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.runIntegrityCheck();
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // ── Question Management ─────────────────────────────────────────────────

  static async getQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await QuestionManagementService.getQuestionById(req.params.questionId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async addQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const staffId = req.user!.username;
      const data = await QuestionManagementService.addQuestion(staffId, req.body);
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'QUESTION_CREATED',
        entityType: 'Question',
        entityId: data.id,
        metadata: { testId: data.testId, questionNumber: data.questionNumber },
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async editQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const { editReason, ...fields } = req.body;
      const data = await QuestionManagementService.editQuestion(req.user!.username, questionId, fields, editReason);
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'QUESTION_UPDATED',
        entityType: 'Question',
        entityId: questionId,
        metadata: { versionCreated: data.versionCreated, editReason },
        ipAddress: req.ip,
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async deactivateQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { questionId } = req.params;
      const data = await QuestionManagementService.deactivateQuestion(questionId);
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'QUESTION_DEACTIVATED',
        entityType: 'Question',
        entityId: questionId,
        ipAddress: req.ip,
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async bulkImport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await QuestionManagementService.bulkImport(req.user!.username, req.body);
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'BULK_IMPORT',
        entityType: 'Question',
        metadata: { imported: data.imported, topic: data.topicName, testNumber: data.testNumber },
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async detectDuplicates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.query as any;
      const threshold = Number(req.query.threshold ?? 85) / 100;
      const data = await QuestionManagementService.detectDuplicates(testId, threshold);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateTestConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { testId } = req.params;
      const data = await QuestionManagementService.updateTestConfig(testId, req.body, req.user!.username);
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'TEST_UPDATED',
        entityType: 'Test',
        entityId: testId,
        metadata: req.body,
        ipAddress: req.ip,
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getTopicsAndTests(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const topics = await prisma.topic.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          tests: {
            orderBy: { testNumber: 'asc' },
            include: { _count: { select: { questions: true, attempts: true } } },
          },
        },
      });
      res.json({ success: true, data: topics });
    } catch (e) { next(e); }
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────

  static async getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 50);
      const { staffId, action, entityType } = req.query as any;
      const data = await AuditService.getLogs({ page, pageSize, staffId, action, entityType });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // ── Announcements ───────────────────────────────────────────────────────

  static async getActiveAnnouncements(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnnouncementService.getActiveAnnouncements();
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAllAnnouncements(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const data = await AnnouncementService.getAllAnnouncements(page);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnnouncementService.createAnnouncement({ ...req.body, createdBy: req.user!.username });
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'ANNOUNCEMENT_CREATED',
        entityType: 'Announcement',
        entityId: data.id,
        metadata: { title: data.title },
        ipAddress: req.ip,
      });
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnnouncementService.updateAnnouncement(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async deleteAnnouncement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnnouncementService.deleteAnnouncement(req.params.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // ── System Settings ─────────────────────────────────────────────────────

  static async getSettings(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SystemSettingsService.getAll();
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await SystemSettingsService.bulkUpdate(req.body, req.user!.username);
      await AuditService.log({
        staffId: await getStaffDbId(req.user!.userId),
        action: 'SETTINGS_UPDATED',
        entityType: 'SystemSetting',
        metadata: req.body,
        ipAddress: req.ip,
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  // ── CSV Exports ─────────────────────────────────────────────────────────

  static async exportStudentPerformance(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await ExportService.studentPerformanceCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="student_performance_${yyyymmdd()}.csv"`);
      res.send(csv);
    } catch (e) { next(e); }
  }

  static async exportTopicPerformance(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await ExportService.topicPerformanceCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="topic_performance_${yyyymmdd()}.csv"`);
      res.send(csv);
    } catch (e) { next(e); }
  }

  static async exportWeekendActivity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = Number(req.query.year ?? new Date().getFullYear());
      const month = Number(req.query.month ?? new Date().getMonth() + 1);
      const csv = await ExportService.weekendActivityCSV(year, month);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="weekend_activity_${year}_${month}.csv"`);
      res.send(csv);
    } catch (e) { next(e); }
  }

  // ── Paginated Students (enhanced server-side) ───────────────────────────

  static async getStudentsPaginated(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 25);
      const { search, department, year, section, sortBy, sortDir } = req.query as any;

      const where: any = {};
      if (search) {
        where.OR = [
          { rollNumber: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (department) where.department = department;
      if (year) where.year = Number(year);
      if (section) where.section = section;

      const validSortFields = ['rollNumber', 'name', 'department', 'year'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'rollNumber';
      const orderDir = sortDir === 'desc' ? 'desc' : 'asc';

      const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
          where,
          include: {
            user: { select: { isActive: true, lastLoginAt: true } },
            attempts: {
              where: { status: 'SUBMITTED' },
              select: { attemptedCount: true, correctCount: true, score: true, test: { select: { topicId: true } } },
            },
          },
          orderBy: { [orderField]: orderDir },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const data = students.map((s) => {
        let attempted = 0, correct = 0, score = 0;
        const topicCounts = new Map<string, number>();
        for (const att of s.attempts) {
          attempted += att.attemptedCount;
          correct += att.correctCount;
          score += att.score;
          topicCounts.set(att.test.topicId, (topicCounts.get(att.test.topicId) || 0) + 1);
        }
        let topicsCompleted = 0;
        topicCounts.forEach((cnt) => { if (cnt >= 3) topicsCompleted++; });
        const accuracy = attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0;
        const overallProgress = Number(((attempted / 2160) * 100).toFixed(1));
        return {
          id: s.id, rollNumber: s.rollNumber, name: s.name,
          email: s.email, department: s.department, year: s.year, section: s.section,
          isActive: s.user.isActive, lastLoginAt: s.user.lastLoginAt,
          testsCompleted: s.attempts.length, topicsCompleted,
          questionsAttempted: attempted, accuracy, averageScore:
            s.attempts.length > 0 ? Number(((score / (s.attempts.length * 20)) * 100).toFixed(1)) : 0,
          overallProgress,
        };
      });

      res.json({ success: true, data: { total, page, pageSize, totalPages: Math.ceil(total / pageSize), students: data } });
    } catch (e) { next(e); }
  }

  // ── Account Management (Create Student & Create Staff) ──────────────────

  static async createStudent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await AccountManagementService.createStudent(req.body);
      const staffId = await getStaffDbId(req.user!.userId);
      await AuditService.log({
        staffId,
        action: 'STUDENT_ACCOUNT_CREATED',
        entityType: 'Student',
        entityId: student.id,
        metadata: { rollNumber: student.rollNumber, name: student.name, department: student.department },
      });
      res.status(201).json({ success: true, message: 'Student account created successfully.', data: student });
    } catch (e) { next(e); }
  }

  static async getStudentsAccountList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 50);
      const search = (req.query.search as string) || '';
      const data = await AccountManagementService.getStudentsList(page, pageSize, search);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await AccountManagementService.createStaff(req.body);
      const staffId = await getStaffDbId(req.user!.userId);
      await AuditService.log({
        staffId,
        action: 'STAFF_ACCOUNT_CREATED',
        entityType: 'Staff',
        entityId: staff.id,
        metadata: { staffId: staff.staffId, name: staff.name, department: staff.department },
      });
      res.status(201).json({ success: true, message: 'Staff account created successfully.', data: staff });
    } catch (e) { next(e); }
  }

  static async getStaffAccountList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page ?? 1);
      const pageSize = Number(req.query.pageSize ?? 50);
      const search = (req.query.search as string) || '';
      const data = await AccountManagementService.getStaffList(page, pageSize, search);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}

async function getStaffDbId(userId: string): Promise<string> {
  const staff = await prisma.staff.findUnique({ where: { userId } });
  return staff?.id ?? userId;
}

function yyyymmdd(): string {
  return new Date().toISOString().slice(0, 10);
}
