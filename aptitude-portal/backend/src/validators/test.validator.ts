import { z } from 'zod';

export const saveAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  selectedOption: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Selected option must be one of A, B, C, or D' }),
  }),
});

export const portalControlSchema = z.object({
  mode: z.enum(['AUTOMATIC_WEEKEND', 'MANUAL_OPEN', 'MANUAL_CLOSED'], {
    errorMap: () => ({ message: 'Mode must be AUTOMATIC_WEEKEND, MANUAL_OPEN, or MANUAL_CLOSED' }),
  }),
  note: z.string().max(300, 'Notice note cannot exceed 300 characters').optional(),
});
