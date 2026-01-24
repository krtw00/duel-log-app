import { z } from 'zod';

/** ページネーション情報 */
export const paginationSchema = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

/** エラー詳細（バリデーションエラー用） */
export const errorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

/** エラーレスポンス */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(errorDetailSchema).optional(),
  }),
});

/** 単一リソースレスポンス */
export const singleResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ data: dataSchema });

/** リストレスポンス */
export const listResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: paginationSchema,
  });
