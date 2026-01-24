import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
});

export const feedbackRoutes = new Hono<Env>().post('/', async (c) => {
  const { id, email } = c.get('user');
  const rawBody = await c.req.json();
  const data = feedbackSchema.parse(rawBody);

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_FEEDBACK_REPO;

  if (!githubToken || !githubRepo) {
    return c.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Feedback system not configured' } },
      500,
    );
  }

  const issueBody = `**Type:** ${data.type}\n**User:** ${email} (${id})\n\n${data.body}`;

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
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to submit feedback' } }, 500);
  }

  return c.json({ data: { message: 'Feedback submitted' } }, 201);
});
