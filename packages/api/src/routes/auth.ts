import { Hono } from 'hono';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

export const authRoutes = new Hono<Env>()
  .post('/signout', (c) => {
    // クライアント側でSupabase SDK signOutを呼ぶため、
    // サーバー側は成功レスポンスのみ返す
    return c.json({ data: { message: 'Signed out' } });
  })
  .post('/refresh', (c) => {
    // トークン更新はSupabase SDK側で行うため、
    // サーバー側は現在のユーザー情報を返す
    const user = c.get('user');
    return c.json({ data: { id: user.id, email: user.email } });
  });
