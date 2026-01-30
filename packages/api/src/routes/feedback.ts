import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  // クライアント環境情報（オプション）
  userAgent: z.string().optional(),
  platform: z.string().optional(),
  screenSize: z.string().optional(),
  language: z.string().optional(),
});

export const feedbackRoutes = new Hono<Env>().post('/', async (c) => {
  try {
    const { id, email } = c.get('user');
    const rawBody = await c.req.json();
    const data = feedbackSchema.parse(rawBody);

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_FEEDBACK_REPO;

    if (!githubToken || !githubRepo) {
      console.error('Feedback config missing:', { hasToken: !!githubToken, hasRepo: !!githubRepo });
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Feedback system not configured' } },
        500,
      );
    }

    // 環境情報セクションを構築（メールは含めない）
    const envInfo = [
      data.userAgent && `**User Agent:** ${data.userAgent}`,
      data.platform && `**Platform:** ${data.platform}`,
      data.screenSize && `**Screen:** ${data.screenSize}`,
      data.language && `**Language:** ${data.language}`,
    ]
      .filter(Boolean)
      .join('\n');

    const issueBody = `**Type:** ${data.type}\n**User ID:** ${id}\n\n${data.body}${envInfo ? `\n\n---\n### Environment\n${envInfo}` : ''}`;

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[${data.type}] ${data.title}`,
        body: issueBody,
        labels: ['user-feedback', data.type],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to submit feedback' } },
        500,
      );
    }

    return c.json({ data: { message: 'Feedback submitted' } }, 201);
  } catch (error) {
    console.error('Feedback error:', error);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      500,
    );
  }
});
