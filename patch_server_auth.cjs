const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import authHandler from "./src/server/controllers/auth";',
  'import authRouter from "./src/server/routers/auth";\nimport authHandler from "./src/server/controllers/auth";'
);

code = code.replace(
  '// 3. Auth Gateway\napp.all("/api/auth", async (req, res) => {\n  try {\n    await authHandler(req as any, res as any);\n  } catch (error) {\n    console.error("[Auth Error]", error);\n    res.status(500).json({ error: "Internal Server Error" });\n  }\n});',
  '// 3. Auth Gateway\napp.use("/api/auth", authRouter);'
);

fs.writeFileSync('server.ts', code);
