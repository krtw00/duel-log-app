import type { IncomingMessage, ServerResponse } from 'node:http';
import app from './index.js';

export async function handleNodeRequest(req: IncomingMessage, res: ServerResponse) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const method = req.method || 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD';
  const body = hasBody
    ? await new Promise<Buffer>((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
      })
    : null;

  const request = new Request(url.toString(), {
    method,
    headers,
    body,
  });

  const response = await app.fetch(request);
  res.statusCode = response.status;
  // Headers.forEach は複数 Set-Cookie を 1 本にカンマ結合してしまうため、
  // Set-Cookie だけは getSetCookie() で配列のまま渡す（access/refresh/csrf の複数発行に必須）。
  const setCookies = response.headers.getSetCookie();
  response.headers.forEach((value: string, key: string) => {
    if (key.toLowerCase() === 'set-cookie') return;
    res.setHeader(key, value);
  });
  if (setCookies.length > 0) {
    res.setHeader('Set-Cookie', setCookies);
  }
  res.end(Buffer.from(await response.arrayBuffer()));
}
