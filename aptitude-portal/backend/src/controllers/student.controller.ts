import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { StudentService } from '../services/student.service';
import { PortalConfigManager } from '../utils/portal.config';
import { portalControlSchema } from '../validators/test.validator';
import { AppError } from '../middleware/error.middleware';

export class StudentController {
  static async getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await StudentService.getStaffStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllStudents(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const students = await StudentService.getAllStudentsForStaff();
      res.status(200).json({
        success: true,
        data: students,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentByRollNumber(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rollNumber } = req.params;
      const details = await StudentService.getStudentDetailsForStaff(rollNumber);
      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBatchAnalytics(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await StudentService.getBatchAnalytics();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLiveMonitoring(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const liveData = await StudentService.getLiveMonitoring();
      res.status(200).json({
        success: true,
        data: liveData,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPortalControl(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = PortalConfigManager.getStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePortalControl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mode, note } = portalControlSchema.parse(req.body);
      const updatedBy = req.user?.username || 'Staff Admin';
      const updatedStatus = PortalConfigManager.setMode(mode, note, updatedBy);
      res.status(200).json({
        success: true,
        message: `Portal mode updated to ${mode}`,
        data: updatedStatus,
      });
    } catch (error) {
      next(error);
    }
  }
}
