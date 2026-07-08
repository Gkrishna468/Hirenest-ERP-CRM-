const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  'import { requireAuth } from "./src/server/controllers/authMiddleware";',
  'import { requireAuth } from "./src/server/controllers/authMiddleware";\nimport healthRouter from "./src/server/routers/health";\nimport vendorsRouter from "./src/server/routers/vendors";'
);
code = code.replace(
  '// 1. Health check\napp.all("/api/health", async (req, res) => {\n   if (req.query.action || (req.body && req.body.action)) {\n    try {\n      await healthHandler(req as any, res as any);\n    } catch (error) {\n      console.error("[Health Error]", error);\n      res.status(500).json({ error: "Internal Server Error" });\n    }\n  } else {\n    res.json({ status: "ok", service: "hirenest-backend" });\n  }\n});',
  '// 1. Health check\napp.use("/api/health", healthRouter);'
);
code = code.replace(
  'app.use("/api", requireAuth);',
  'app.use("/api", requireAuth);\n\n// New REST endpoints\napp.use("/api/vendors", vendorsRouter);'
);
fs.writeFileSync('server.ts', code);
