import { Router } from 'express';
import { TestController } from '../controllers/test.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public/student test portal status endpoint
router.get('/status', TestController.getPortalStatus);

// All subsequent routes require authentication
router.use(authenticateToken);

// Student dashboard metrics (2100 questions, 105 tests, 35 topics)
router.get('/dashboard', authorizeRoles(Role.STUDENT), TestController.getDashboardMetrics);

// Student monthly weekend activity and participation
router.get('/activity/monthly', authorizeRoles(Role.STUDENT), TestController.getMonthlyActivity);

// Topics with individual student progress
router.get('/topics', authorizeRoles(Role.STUDENT), TestController.getTopics);

// Topic details with tests
router.get('/topics/:topicId', authorizeRoles(Role.STUDENT), TestController.getTopicDetails);

// Topic 3-test overall result
router.get('/topics/:topicId/overall', authorizeRoles(Role.STUDENT), TestController.getTopicOverall);

// Save answer — MUST be before /:testId to avoid route conflict
router.post('/attempts/:attemptId/answer', authorizeRoles(Role.STUDENT), TestController.saveAnswer);

// Submit test — MUST be before /:testId to avoid route conflict
router.post('/attempts/:attemptId/submit', authorizeRoles(Role.STUDENT), TestController.submitTest);

// Get test result (accessible to STUDENT and STAFF) — MUST be before /:testId to avoid route conflict
router.get('/attempts/:attemptId/result', authorizeRoles(Role.STUDENT, Role.STAFF), TestController.getTestResult);

// Start/Resume test attempt (attempt #1)
router.post('/:testId/start', authorizeRoles(Role.STUDENT), TestController.startTest);

// Start Retest (attempt #2) — only allowed if original score <= 10
router.post('/:testId/retest', authorizeRoles(Role.STUDENT), TestController.startRetest);

// Get test details & questions (LAST — wildcard must not intercept /attempts/* routes above)
router.get('/:testId', authorizeRoles(Role.STUDENT), TestController.getTestById);

export default router;
