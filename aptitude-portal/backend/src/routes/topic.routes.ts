import { Router } from 'express';
import { TopicController } from '../controllers/topic.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Both Student and Staff can view topics
router.use(authenticateToken);

router.get('/', TopicController.getAllTopics);
router.get('/:id', TopicController.getTopicById);

export default router;
