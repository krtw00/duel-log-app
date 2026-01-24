import app from './index.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

async function handler(req: IncomingMessage, res: ServerResponse) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody
    ? await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
      })
    : null;

  const request = new Request(url.toString(), {
    method: req.method || 'GET',
    headers,
    body,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBody = await response.arrayBuffer();
  res.end(Buffer.from(responseBody));
}

// @ts-ignore
module.exports = handler;
