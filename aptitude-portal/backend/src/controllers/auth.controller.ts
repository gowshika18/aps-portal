import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AccountManagementService } from '../services/account-management.service';
import { loginSchema } from '../validators/auth.validator';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const identifier = (validatedData.rollNumber || validatedData.staffId || validatedData.username)!;
      const { password } = validatedData;

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await AuthService.login(identifier, password, ipAddress, userAgent);

      // Cookie options: sameSite 'none' with secure in production enables cross-origin cookies
      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      };

      // Set HTTP-only cookie for secure browser persistence
      res.cookie('access_token', result.accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.cookie('refresh_token', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Role-based target dashboard
      const redirectUrl = result.user.role === 'STUDENT' ? '/student/dashboard' : '/staff/dashboard';

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          redirectUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.sessionId) {
        await AuthService.logout(req.user.sessionId);
      }

      const isProd = process.env.NODE_ENV === 'production';
      const clearOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
      };

      res.clearCookie('access_token', clearOptions);
      res.clearCookie('refresh_token', clearOptions);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      const user = await AuthService.getMe(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ── Public Self-Registration (no auth token required) ──────────────────────

  static async registerStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const student = await AccountManagementService.createStudent(req.body);
      res.status(201).json({
        success: true,
        message: 'Student account created successfully. You can now log in.',
        data: {
          rollNumber: student.rollNumber,
          name: student.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async registerStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await AccountManagementService.createStaff(req.body);
      res.status(201).json({
        success: true,
        message: 'Staff account created successfully. You can now log in.',
        data: {
          staffId: staff.staffId,
          name: staff.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
