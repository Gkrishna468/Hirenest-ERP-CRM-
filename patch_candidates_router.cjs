const fs = require('fs');
let code = fs.readFileSync('src/server/routers/candidates.ts', 'utf8');

code = code.replace(
  `router.post('/ingest', upload.single('resume'), async (req: any, res: any) => {`,
  `router.post('/ingest', (req, res, next) => {
    console.log("[Router] /ingest called. Content-Type:", req.headers['content-type']);
    next();
  }, upload.single('resume'), async (req: any, res: any) => {
    console.log("[Router] multer finished. file:", !!req.file, "body:", req.body);`
);

fs.writeFileSync('src/server/routers/candidates.ts', code);
