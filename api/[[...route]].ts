import { handle } from 'hono/vercel';
import app from '../packages/api/src/index.ts';

export default handle(app);
