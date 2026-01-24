export default async function handler(req: any, res: any) {
  try {
    const { handle } = await import('hono/vercel');
    const { default: app } = await import('../packages/api/src/index.ts');
    const webHandler = handle(app);
    const request = new Request(`https://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
    });
    const response = await webHandler(request);
    res.status(response.status);
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    const body = await response.text();
    res.end(body);
  } catch (e: any) {
    res.status(500).json({
      error: e.message,
      stack: e.stack?.split('\n').slice(0, 10),
    });
  }
}
