import { z } from 'zod';

export const loginSchema = z.object({
  rollNumber: z.string().trim().optional(),
  staffId: z.string().trim().optional(),
  username: z.string().trim().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(
  (data) => Boolean(data.rollNumber || data.staffId || data.username),
  {
    message: 'Roll Number or Staff ID is required',
    path: ['username'],
  }
);

export type LoginInput = z.infer<typeof loginSchema>;
