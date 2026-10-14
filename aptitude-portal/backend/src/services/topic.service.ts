import { prisma } from '../utils/prisma';
import { TopicCategory } from '@prisma/client';

export class TopicService {
  /**
   * Fetch all 36 topics for student dashboard
   */
  static async getAllTopics(category?: TopicCategory) {
    const whereClause = category ? { category, isActive: true } : { isActive: true };

    const topics = await prisma.topic.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' },
    });

    // Decorate each topic with Phase 1 structure (3 tests, 60 questions, 0% progress)
    return topics.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      displayOrder: t.displayOrder,
      testsCount: 3,
      totalQuestions: 60,
      progress: 0,
      status: 'Not Started',
      tests: [
        { testNumber: 1, name: 'Test 1 - Hard Level', questionCount: 20, status: 'Not Started', score: 0 },
        { testNumber: 2, name: 'Test 2 - Hard Level', questionCount: 20, status: 'Not Started', score: 0 },
        { testNumber: 3, name: 'Test 3 - Hard Level', questionCount: 20, status: 'Not Started', score: 0 },
      ],
    }));
  }

  /**
   * Get single topic details (for topic detail placeholder in Phase 1)
   */
  static async getTopicById(id: string) {
    const topic = await prisma.topic.findUnique({
      where: { id },
    });

    if (!topic) {
      return null;
    }

    return {
      id: topic.id,
      name: topic.name,
      category: topic.category,
      displayOrder: topic.displayOrder,
      testsCount: 3,
      totalQuestions: 60,
      progress: 0,
      status: 'Not Started',
      tests: [
        {
          testNumber: 1,
          name: `${topic.name} - Test 1`,
          difficulty: 'Hard',
          questionCount: 20,
          status: 'Not Started',
          scheduledNotice: 'Test engine will be activated in Phase 2 (Weekend schedule: Saturday & Sunday).',
        },
        {
          testNumber: 2,
          name: `${topic.name} - Test 2`,
          difficulty: 'Hard',
          questionCount: 20,
          status: 'Not Started',
          scheduledNotice: 'Test engine will be activated in Phase 2 (Weekend schedule: Saturday & Sunday).',
        },
        {
          testNumber: 3,
          name: `${topic.name} - Test 3`,
          difficulty: 'Hard',
          questionCount: 20,
          status: 'Not Started',
          scheduledNotice: 'Test engine will be activated in Phase 2 (Weekend schedule: Saturday & Sunday).',
        },
      ],
    };
  }
}
