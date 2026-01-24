import app from './index.js';

function handler(req: any, res: any) {
  // Diagnostic: return immediately to test if handler is called
  if (req.url === '/api/ping' || req.url === '/ping') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ping: 'pong', url: req.url, method: req.method }));
    return;
  }

  // Full handler with Hono
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const request = new Request(url.toString(), {
    method: req.method || 'GET',
    headers,
  });

  app.fetch(request).then((response: any) => {
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    return response.arrayBuffer();
  }).then((body: any) => {
    res.end(Buffer.from(body));
  }).catch((err: any) => {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  });
}

// @ts-ignore
module.exports = handler;
