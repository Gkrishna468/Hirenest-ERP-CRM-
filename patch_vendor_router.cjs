const fs = require('fs');
let content = fs.readFileSync('src/server/routers/vendors.ts', 'utf8');

const rateLimitCode = `
import { rateLimit } from 'express-rate-limit';

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many signup requests from this IP, please try again after 15 minutes' }
});

router.post('/public/signup', signupLimiter, async (req: any, res: any) => {`;

content = content.replace(
  "router.post('/public/signup', async (req: any, res: any) => {",
  rateLimitCode
);

fs.writeFileSync('src/server/routers/vendors.ts', content);
