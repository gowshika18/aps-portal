import { Router } from 'express';
import { Role } from '@prisma/client';
import { StudentController } from '../controllers/student.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Staff-only protected routes
router.use(authenticateToken);
router.use(authorizeRoles(Role.STAFF));

router.get('/stats', StudentController.getStats);
router.get('/students', StudentController.getAllStudents);
router.get('/students/:rollNumber', StudentController.getStudentByRollNumber);
router.get('/analytics', StudentController.getBatchAnalytics);
router.get('/live-monitoring', StudentController.getLiveMonitoring);
router.get('/portal-control', StudentController.getPortalControl);
router.post('/portal-control', StudentController.updatePortalControl);

export default router;
