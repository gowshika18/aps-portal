import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { TopicService } from '../services/topic.service';
import { TopicCategory } from '@prisma/client';

export class TopicController {
  static async getAllTopics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as TopicCategory | undefined;
      const topics = await TopicService.getAllTopics(category);
      res.status(200).json({
        success: true,
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopicById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const topic = await TopicService.getTopicById(id);

      if (!topic) {
        res.status(404).json({
          success: false,
          message: `Topic with id ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }
}
