import { z } from 'zod';

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: z.string().min(12).max(128),
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
}).strict();

export const emailSchemaBody = z.object({ email: emailSchema }).strict();
export const tokenSchema = z.object({ token: z.string().min(20).max(500) }).strict();
export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(500),
  password: z.string().min(12).max(128),
}).strict();
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
}).strict();
