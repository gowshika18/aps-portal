import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';

export interface CreateStudentPayload {
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  year: number;
  section: string;
  password: string;
}

export interface CreateStaffPayload {
  staffId: string;
  name: string;
  email: string;
  department: string;
  password: string;
}

export class AccountManagementService {
  static async createStudent(payload: CreateStudentPayload) {
    const rollNumber = payload.rollNumber?.trim().toUpperCase();
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const department = payload.department?.trim();
    const year = Number(payload.year);
    const section = payload.section?.trim().toUpperCase();
    const password = payload.password;

    if (!rollNumber || !name || !email || !department || !year || !section || !password) {
      throw new AppError('All fields (Roll Number, Name, Email, Department, Year, Section, Password) are required.', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    // Check duplicate username (rollNumber)
    const existingUser = await prisma.user.findUnique({ where: { username: rollNumber } });
    if (existingUser) {
      throw new AppError('Student with this Roll Number already exists.', 400);
    }

    // Check duplicate student rollNumber
    const existingStudent = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingStudent) {
      throw new AppError('Student with this Roll Number already exists.', 400);
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Transaction to create User + Student atomically
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: rollNumber,
          passwordHash,
          role: Role.STUDENT,
          isActive: true,
        },
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber,
          name,
          email,
          department,
          year,
          section,
        },
      });

      return { student, user };
    });

    return {
      id: result.student.id,
      rollNumber: result.student.rollNumber,
      name: result.student.name,
      email: result.student.email,
      department: result.student.department,
      year: result.student.year,
      section: result.student.section,
      createdAt: result.student.createdAt,
    };
  }

  static async getStudentsList(page = 1, pageSize = 50, search?: string) {
    const where: any = {};
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { rollNumber: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: { user: { select: { isActive: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      students: students.map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        email: s.email,
        department: s.department,
        year: s.year,
        section: s.section,
        isActive: s.user.isActive,
        createdAt: s.createdAt,
      })),
    };
  }

  static async createStaff(payload: CreateStaffPayload) {
    const staffId = payload.staffId?.trim().toUpperCase();
    const name = payload.name?.trim();
    const email = payload.email?.trim().toLowerCase();
    const department = payload.department?.trim();
    const password = payload.password;

    if (!staffId || !name || !email || !department || !password) {
      throw new AppError('All fields (Staff ID, Name, Email, Department, Password) are required.', 400);
    }

    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    // Check duplicate username (staffId)
    const existingUser = await prisma.user.findUnique({ where: { username: staffId } });
    if (existingUser) {
      throw new AppError('Staff with this Staff ID already exists.', 400);
    }

    // Check duplicate staff staffId
    const existingStaff = await prisma.staff.findUnique({ where: { staffId } });
    if (existingStaff) {
      throw new AppError('Staff with this Staff ID already exists.', 400);
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Transaction to create User + Staff atomically
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: staffId,
          passwordHash,
          role: Role.STAFF,
          isActive: true,
        },
      });

      const staff = await tx.staff.create({
        data: {
          userId: user.id,
          staffId,
          name,
          email,
          department,
        },
      });

      return { staff, user };
    });

    return {
      id: result.staff.id,
      staffId: result.staff.staffId,
      name: result.staff.name,
      email: result.staff.email,
      department: result.staff.department,
      createdAt: result.staff.createdAt,
    };
  }

  static async getStaffList(page = 1, pageSize = 50, search?: string) {
    const where: any = {};
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { staffId: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, staffMembers] = await Promise.all([
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        include: { user: { select: { isActive: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      staff: staffMembers.map((s) => ({
        id: s.id,
        staffId: s.staffId,
        name: s.name,
        email: s.email,
        department: s.department,
        isActive: s.user.isActive,
        createdAt: s.createdAt,
      })),
    };
  }
}
