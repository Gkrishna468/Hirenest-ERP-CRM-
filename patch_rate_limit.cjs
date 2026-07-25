const fs = require('fs');
let content = fs.readFileSync('src/server/routers/candidates.ts', 'utf8');

const rateLimiterCode = `
const rateLimits = new Map<string, { count: number; resetTime: number }>();

const rateLimiterMiddleware = (req: any, res: any, next: any) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  let record = rateLimits.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
  } else {
    record.count++;
  }
  rateLimits.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  next();
};

`;

content = content.replace(
  'const router = Router();',
  rateLimiterCode + 'const router = Router();'
);

content = content.replace(
  'router.post(\'/ingest\', ',
  'router.post(\'/ingest\', rateLimiterMiddleware, '
);

fs.writeFileSync('src/server/routers/candidates.ts', content);
