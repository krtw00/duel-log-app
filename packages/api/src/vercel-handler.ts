import app from './index.js';

function handler(req: any, res: any) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const bodyPromise = hasBody
    ? new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
      })
    : Promise.resolve(null);

  bodyPromise.then((body: Buffer | null) => {
    const request = new Request(url.toString(), {
      method,
      headers,
      body,
    });
    return app.fetch(request);
  }).then((response: any) => {
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => {
      res.setHeader(key, value);
    });
    return response.arrayBuffer();
  }).then((responseBody: any) => {
    res.end(Buffer.from(responseBody));
  }).catch((err: any) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  });
}

// @ts-ignore
module.exports = handler;
