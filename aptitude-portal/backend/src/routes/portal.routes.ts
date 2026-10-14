import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { NotificationService, AnnouncementService } from '../services/admin.service';
import { AdminController } from '../controllers/admin.controller';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../utils/prisma';

const router = Router();

router.use(authenticateToken);

// ── Announcements (all authenticated users) ─────────────────────────────
router.get('/announcements/active', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await AnnouncementService.getActiveAnnouncements();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── Notifications (student) ─────────────────────────────────────────────
router.get('/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unreadOnly === 'true';
    const data = await NotificationService.getForUser(userId, unreadOnly);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/notifications/:id/read', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await NotificationService.markAsRead(req.params.id, req.user!.userId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

router.post('/notifications/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await NotificationService.markAllAsRead(req.user!.userId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

// ── Student advanced analytics (self) ──────────────────────────────────
router.get('/my/analytics', authorizeRoles(Role.STUDENT), AdminController.getMyAdvancedAnalytics);
router.get('/my/weak-areas', authorizeRoles(Role.STUDENT), AdminController.getMyWeakAreas);

// ── Student profile ────────────────────────────────────────────────────
router.get('/my/profile', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user!.userId },
      include: {
        user: { select: { isActive: true, lastLoginAt: true } },
        attempts: {
          where: { status: 'SUBMITTED' },
          include: { test: { include: { topic: true } } },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!student) { res.status(404).json({ success: false, message: 'Profile not found.' }); return; }

    let attempted = 0, correct = 0, score = 0;
    const topicCounts = new Map<string, number>();
    // We need all attempts for aggregate, not just last 10
    const allAttempts = await prisma.testAttempt.findMany({
      where: { studentId: student.id, status: 'SUBMITTED' },
      select: { attemptedCount: true, correctCount: true, score: true, test: { select: { topicId: true } } },
    });
    for (const att of allAttempts) {
      attempted += att.attemptedCount;
      correct += att.correctCount;
      score += att.score;
      topicCounts.set(att.test.topicId, (topicCounts.get(att.test.topicId) || 0) + 1);
    }
    let topicsCompleted = 0;
    topicCounts.forEach((cnt) => { if (cnt >= 3) topicsCompleted++; });

    const recentActivity = student.attempts.map((att) => ({
      testTitle: att.test.title,
      topicName: att.test.topic.name,
      score: att.score,
      accuracy: att.accuracy,
      submittedAt: att.submittedAt,
    }));

    res.json({
      success: true,
      data: {
        id: student.id,
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        section: student.section,
        isActive: student.user.isActive,
        lastLoginAt: student.user.lastLoginAt,
        stats: {
          testsCompleted: allAttempts.length,
          topicsCompleted,
          questionsAttempted: attempted,
          overallAccuracy: attempted > 0 ? Number(((correct / attempted) * 100).toFixed(1)) : 0,
          overallProgress: Number(((attempted / 2160) * 100).toFixed(1)),
          overallScore: score,
        },
        recentActivity,
      },
    });
  } catch (e) { next(e); }
});

// ── Staff broadcast notifications ───────────────────────────────────────
router.post('/notifications/broadcast', authorizeRoles(Role.STAFF), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) { res.status(400).json({ success: false, message: 'title and message required.' }); return; }
    const data = await NotificationService.broadcastToStudents({ title, message, type });
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
