import { z } from 'zod';
import { THEME_PREFERENCES, USER_STATUSES } from '../constants/index.js';

/** ユーザー（全フィールド） */
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  isAdmin: z.boolean(),
  isDebugger: z.boolean(),
  themePreference: z.enum(THEME_PREFERENCES),
  streamerMode: z.boolean(),
  enableScreenAnalysis: z.boolean(),
  status: z.enum(USER_STATUSES),
  statusReason: z.string().nullable(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** ユーザー更新（更新可能フィールドのみ） */
export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  themePreference: z.enum(THEME_PREFERENCES).optional(),
  streamerMode: z.boolean().optional(),
  enableScreenAnalysis: z.boolean().optional(),
});

/** 管理者によるステータス変更 */
export const updateUserStatusSchema = z.object({
  status: z.enum(USER_STATUSES),
  statusReason: z.string().max(500).optional(),
});
