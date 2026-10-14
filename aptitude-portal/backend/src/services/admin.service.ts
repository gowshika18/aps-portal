import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';

// ─── Audit Log ─────────────────────────────────────────────────────────────

export class AuditService {
  static async log(params: {
    staffId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }) {
    try {
      await prisma.auditLog.create({
        data: {
          staffId: params.staffId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          metadata: params.metadata ?? {},
          ipAddress: params.ipAddress ?? null,
        },
      });
    } catch {
      // Non-blocking — audit failures should not break main operations
    }
  }

  static async getLogs(params: {
    page?: number;
    pageSize?: number;
    staffId?: string;
    action?: string;
    entityType?: string;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 50;
    const where: any = {};
    if (params.staffId) where.staffId = params.staffId;
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.entityType) where.entityType = params.entityType;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { staff: { select: { name: true, staffId: true } } },
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
      logs: logs.map((l) => ({
        id: l.id,
        staffName: l.staff.name,
        staffId: l.staff.staffId,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
    };
  }
}

// ─── Announcement Service ──────────────────────────────────────────────────

export class AnnouncementService {
  static async getActiveAnnouncements() {
    const now = new Date();
    return prisma.announcement.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAllAnnouncements(page = 1, pageSize = 20) {
    const [total, items] = await Promise.all([
      prisma.announcement.count(),
      prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
  }

  static async createAnnouncement(data: {
    title: string;
    message: string;
    startsAt?: Date;
    endsAt?: Date;
    createdBy: string;
  }) {
    if (!data.title?.trim() || !data.message?.trim()) {
      throw new AppError('Title and message are required.', 400);
    }
    return prisma.announcement.create({
      data: {
        title: data.title.trim(),
        message: data.message.trim(),
        startsAt: data.startsAt ?? new Date(),
        endsAt: data.endsAt ?? null,
        createdBy: data.createdBy,
        isActive: true,
      },
    });
  }

  static async updateAnnouncement(
    id: string,
    data: { title?: string; message?: string; isActive?: boolean; endsAt?: Date | null }
  ) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new AppError('Announcement not found.', 404);
    return prisma.announcement.update({ where: { id }, data });
  }

  static async deleteAnnouncement(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new AppError('Announcement not found.', 404);
    await prisma.announcement.delete({ where: { id } });
    return { deleted: true };
  }
}

// ─── Notification Service ──────────────────────────────────────────────────

export class NotificationService {
  static async getForUser(userId: string, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) where.status = 'UNREAD';
    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif || notif.userId !== userId) throw new AppError('Notification not found.', 404);
    return prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'READ', readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
    return { success: true };
  }

  static async createForUser(params: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    link?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type ?? 'INFO',
        link: params.link ?? null,
      },
    });
  }

  static async broadcastToStudents(params: {
    title: string;
    message: string;
    type?: string;
  }) {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: students.map((u) => ({
        userId: u.id,
        title: params.title,
        message: params.message,
        type: params.type ?? 'SYSTEM',
      })),
    });
    return { sent: students.length };
  }
}

// ─── System Settings Service ───────────────────────────────────────────────

const DEFAULT_SETTINGS: Record<string, { value: string; description: string }> = {
  WEEKEND_TESTING_ENABLED:   { value: 'true',  description: 'Enable/disable automatic weekend testing restriction' },
  WEEKLY_TOPIC_TARGET:       { value: '1',     description: 'Number of topics students should complete per week' },
  TEST_DURATION_SECONDS:     { value: '1200',  description: 'Default test duration in seconds (20 min)' },
  LOW_ACCURACY_THRESHOLD:    { value: '60',    description: 'Accuracy % below which a topic is flagged as weak' },
  LOW_COMPLETION_THRESHOLD:  { value: '100',   description: 'Completion % below which a topic is flagged' },
  ACTIVITY_TIMEOUT_MINUTES:  { value: '10',    description: 'Minutes of inactivity before a session is considered offline' },
  DEFAULT_QUESTION_DIFFICULTY:{ value: 'HARD', description: 'Default difficulty for new questions' },
  MAX_QUESTIONS_PER_TEST:    { value: '20',    description: 'Maximum questions per test' },
};

export class SystemSettingsService {
  static async ensureDefaults() {
    for (const [key, { value, description }] of Object.entries(DEFAULT_SETTINGS)) {
      await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value, description },
        update: {},
      });
    }
  }

  static async getAll() {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
    return settings;
  }

  static async get(key: string): Promise<string | null> {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (setting) return setting.value;
    return DEFAULT_SETTINGS[key]?.value ?? null;
  }

  static async getNumber(key: string, fallback: number): Promise<number> {
    const val = await this.get(key);
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  }

  static async update(key: string, value: string, updatedBy: string) {
    // Validate key is known
    if (!DEFAULT_SETTINGS[key]) {
      throw new AppError(`Unknown setting key: ${key}`, 400);
    }
    return prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, updatedBy, description: DEFAULT_SETTINGS[key].description },
      update: { value, updatedBy },
    });
  }

  static async bulkUpdate(updates: Record<string, string>, updatedBy: string) {
    const unknown = Object.keys(updates).filter((k) => !DEFAULT_SETTINGS[k]);
    if (unknown.length > 0) {
      throw new AppError(`Unknown setting keys: ${unknown.join(', ')}`, 400);
    }
    const results = await Promise.all(
      Object.entries(updates).map(([key, value]) => this.update(key, value, updatedBy))
    );
    return results;
  }
}
