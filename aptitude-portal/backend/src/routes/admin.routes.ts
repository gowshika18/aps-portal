import { Router } from 'express';
import { Role } from '@prisma/client';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(Role.STAFF));

// ── Enhanced Student Search (paginated) ──────────────────────────────────
router.get('/students/paginated', AdminController.getStudentsPaginated);

// ── Account Management (Create Student & Staff) ───────────────────────────
router.post('/accounts/students', AdminController.createStudent);
router.get('/accounts/students', AdminController.getStudentsAccountList);
router.post('/accounts/staff', AdminController.createStaff);
router.get('/accounts/staff', AdminController.getStaffAccountList);

// ── Advanced Analytics ────────────────────────────────────────────────────
router.get('/analytics/students/:rollNumber', AdminController.getStudentAdvancedAnalytics);
router.get('/analytics/students/:rollNumber/weak-areas', AdminController.getStudentWeakAreas);
router.get('/analytics/questions', AdminController.getQuestionAnalytics);
router.get('/integrity', AdminController.runIntegrityCheck);

// ── Question Management ────────────────────────────────────────────────────
router.get('/topics-tests', AdminController.getTopicsAndTests);
router.get('/questions/:questionId', AdminController.getQuestion);
router.post('/questions', AdminController.addQuestion);
router.put('/questions/:questionId', AdminController.editQuestion);
router.delete('/questions/:questionId/deactivate', AdminController.deactivateQuestion);
router.post('/questions/bulk-import', AdminController.bulkImport);
router.get('/questions/duplicates', AdminController.detectDuplicates);

// ── Test Configuration ─────────────────────────────────────────────────────
router.put('/tests/:testId/config', AdminController.updateTestConfig);

// ── Audit Logs ─────────────────────────────────────────────────────────────
router.get('/audit-logs', AdminController.getAuditLogs);

// ── Announcements ──────────────────────────────────────────────────────────
router.get('/announcements', AdminController.getAllAnnouncements);
router.post('/announcements', AdminController.createAnnouncement);
router.put('/announcements/:id', AdminController.updateAnnouncement);
router.delete('/announcements/:id', AdminController.deleteAnnouncement);

// ── System Settings ────────────────────────────────────────────────────────
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

// ── CSV Exports ────────────────────────────────────────────────────────────
router.get('/exports/student-performance', AdminController.exportStudentPerformance);
router.get('/exports/topic-performance', AdminController.exportTopicPerformance);
router.get('/exports/weekend-activity', AdminController.exportWeekendActivity);

export default router;
