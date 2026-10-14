import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

export class AuthService {
  static async login(identifier: string, password: string, ipAddress?: string, userAgent?: string) {
    const cleanIdentifier = identifier.trim();
    const upperIdentifier = cleanIdentifier.toUpperCase();

    // 1. Search for user by username, student rollNumber, staff staffId, or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: 'insensitive' } },
          { username: { equals: upperIdentifier } },
          { student: { rollNumber: { equals: upperIdentifier, mode: 'insensitive' } } },
          { student: { email: { equals: cleanIdentifier.toLowerCase(), mode: 'insensitive' } } },
          { staff: { staffId: { equals: upperIdentifier, mode: 'insensitive' } } },
          { staff: { email: { equals: cleanIdentifier.toLowerCase(), mode: 'insensitive' } } },
        ],
      },
      include: {
        student: true,
        staff: true,
      },
    });

    // 1b. Direct lookup via Student table if not matched above
    if (!user) {
      const student = await prisma.student.findFirst({
        where: {
          rollNumber: { equals: upperIdentifier, mode: 'insensitive' },
        },
        include: {
          user: {
            include: {
              student: true,
              staff: true,
            },
          },
        },
      });

      if (student?.user) {
        user = student.user;
      }
    }

    // 1c. Direct lookup via Staff table if not matched above
    if (!user) {
      const staff = await prisma.staff.findFirst({
        where: {
          staffId: { equals: upperIdentifier, mode: 'insensitive' },
        },
        include: {
          user: {
            include: {
              student: true,
              staff: true,
            },
          },
        },
      });

      if (staff?.user) {
        user = staff.user;
      }
    }

    // 2. Reject if user does not exist (Generic error)
    if (!user) {
      throw new AppError('Invalid credentials. Please check your Roll Number / Staff ID and password.', 401);
    }

    // 3. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials. Please check your Roll Number / Staff ID and password.', 401);
    }

    // 4. Check if account is active
    if (!user.isActive) {
      throw new AppError('Account is inactive. Please contact the administrator.', 403);
    }

    // 5. Create LoginSession
    const session = await prisma.loginSession.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown',
        isActive: true,
        loginAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    // 6. Update user's lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 7. Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId: session.id,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // 8. Assemble clean user profile (NEVER include passwordHash)
    const profile = {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      student: user.student
        ? {
            id: user.student.id,
            rollNumber: user.student.rollNumber,
            name: user.student.name,
            email: user.student.email,
            department: user.student.department,
            year: user.student.year,
            section: user.student.section,
          }
        : null,
      staff: user.staff
        ? {
            id: user.staff.id,
            staffId: user.staff.staffId,
            name: user.staff.name,
            email: user.staff.email,
            department: user.staff.department,
          }
        : null,
    };

    return {
      user: profile,
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  static async logout(sessionId: string) {
    if (!sessionId) return;

    try {
      await prisma.loginSession.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          logoutAt: new Date(),
        },
      });
    } catch {
      // If session record not found, proceed smoothly
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        staff: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive.', 404);
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      student: user.student
        ? {
            id: user.student.id,
            rollNumber: user.student.rollNumber,
            name: user.student.name,
            email: user.student.email,
            department: user.student.department,
            year: user.student.year,
            section: user.student.section,
          }
        : null,
      staff: user.staff
        ? {
            id: user.staff.id,
            staffId: user.staff.staffId,
            name: user.staff.name,
            email: user.staff.email,
            department: user.staff.department,
          }
        : null,
    };
  }
}
