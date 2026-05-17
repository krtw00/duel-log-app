import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthUser } from '../middleware/auth.js';

type Env = { Variables: { user: AuthUser } };

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other']),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  steps: z.string().max(5000).optional(),
  expected: z.string().max(2000).optional(),
  actual: z.string().max(2000).optional(),
  useCase: z.string().max(2000).optional(),
  userAgent: z.string().optional(),
  platform: z.string().optional(),
  screenSize: z.string().optional(),
  language: z.string().optional(),
});

const typeToPriority = (type: z.infer<typeof feedbackSchema>['type']): 'high' | 'medium' =>
  type === 'bug' ? 'high' : 'medium';

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const nl2br = (s: string): string => escapeHtml(s).replace(/\n/g, '<br>');

export const feedbackRoutes = new Hono<Env>().post('/', async (c) => {
  try {
    const { id } = c.get('user');
    const rawBody = await c.req.json();
    const data = feedbackSchema.parse(rawBody);

    const planeToken = process.env.PLANE_API_TOKEN;
    const planeProjectId = process.env.PLANE_PROJECT_ID;
    const planeWorkspace = process.env.PLANE_WORKSPACE_SLUG ?? 'codenica';
    const planeBaseUrl = process.env.PLANE_BASE_URL ?? 'https://plane.codenica.dev';

    if (!planeToken || !planeProjectId) {
      console.error('Feedback config missing:', {
        hasToken: !!planeToken,
        hasProject: !!planeProjectId,
      });
      return c.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Feedback system not configured' } },
        500,
      );
    }

    const envItems = [
      data.userAgent && `<li><strong>User Agent:</strong> ${escapeHtml(data.userAgent)}</li>`,
      data.platform && `<li><strong>Platform:</strong> ${escapeHtml(data.platform)}</li>`,
      data.screenSize && `<li><strong>Screen:</strong> ${escapeHtml(data.screenSize)}</li>`,
      data.language && `<li><strong>Language:</strong> ${escapeHtml(data.language)}</li>`,
    ]
      .filter(Boolean)
      .join('');

    const extraSections = [
      data.steps && `<h3>Reproduction Steps</h3><p>${nl2br(data.steps)}</p>`,
      data.expected && `<h3>Expected</h3><p>${nl2br(data.expected)}</p>`,
      data.actual && `<h3>Actual</h3><p>${nl2br(data.actual)}</p>`,
      data.useCase && `<h3>Use Case</h3><p>${nl2br(data.useCase)}</p>`,
    ]
      .filter(Boolean)
      .join('');

    const descriptionHtml =
      `<p><strong>Type:</strong> ${escapeHtml(data.type)}<br>` +
      `<strong>User ID:</strong> ${escapeHtml(id)}</p>` +
      `<p>${nl2br(data.body)}</p>` +
      extraSections +
      (envItems ? `<hr><h3>Environment</h3><ul>${envItems}</ul>` : '');

    const response = await fetch(
      `${planeBaseUrl}/api/v1/workspaces/${planeWorkspace}/projects/${planeProjectId}/intake-issues/`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': planeToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issue: {
            name: `[${data.type}] ${data.title}`,
            description_html: descriptionHtml,
            priority: typeToPriority(data.type),
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Plane intake API error:', response.status, errorText);
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
