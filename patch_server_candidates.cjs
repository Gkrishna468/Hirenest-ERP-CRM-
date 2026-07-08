const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'import candidatesHandler from "./src/server/controllers/candidates";',
  'import candidatesRouter from "./src/server/routers/candidates";\nimport candidatesHandler from "./src/server/controllers/candidates";'
);

code = code.replace(
  '// 5. Candidates Gateway\napp.all("/api/candidates", async (req, res) => {\n  try {\n    await candidatesHandler(req as any, res as any);\n  } catch (error) {\n    console.error("[Candidates Error]", error);\n    res.status(500).json({ error: "Internal Server Error" });\n  }\n});',
  '// 5. Candidates Gateway\napp.use("/api/candidates", candidatesRouter);'
);

fs.writeFileSync('server.ts', code);
