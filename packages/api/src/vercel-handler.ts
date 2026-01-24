import app from './index.js';

const handler = (req: Request) => app.fetch(req);

// esbuild CJS doesn't properly export default; assign explicitly
// @ts-ignore
module.exports = handler;
