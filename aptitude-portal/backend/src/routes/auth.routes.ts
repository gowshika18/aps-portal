import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { loginRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', loginRateLimiter, AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.get('/me', authenticateToken, AuthController.getMe);

// Public self-registration endpoints (no auth required)
router.post('/register/student', loginRateLimiter, AuthController.registerStudent);
router.post('/register/staff', loginRateLimiter, AuthController.registerStaff);

export default router;
