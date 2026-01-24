import { handle } from 'hono/vercel';
import app from '../packages/api/dist/index.js';

export default handle(app);
