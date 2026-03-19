import { createServer } from 'node:http';
import { handleNodeRequest } from './node-adapter.js';

const port = Number(process.env.PORT || 8080);

createServer((req, res) => {
  handleNodeRequest(req, res).catch((err: unknown) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }));
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`[api] listening on :${port}`);
});
