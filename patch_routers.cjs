const fs = require('fs');

const crudTpl = (domain, service) => `

router.get("/all", async (req: any, res: any) => {
  try {
    const list = await ${service}.list();
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const data = await ${service}.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/create", async (req: any, res: any) => {
  try {
    const data = await ${service}.create(req.body.payload || req.body, req.body.performedBy);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res: any) => {
  try {
    await ${service}.update(req.params.id, req.body.payload || req.body, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  try {
    await ${service}.delete(req.params.id, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
`;

let vContent = fs.readFileSync('src/server/routers/vendors.ts', 'utf8');
vContent = vContent.replace("import { vendorOnboardingService } from '../services/VendorOnboardingService';", "import { vendorOnboardingService } from '../services/VendorOnboardingService';\nimport { vendorService } from '../services/VendorService';");
vContent = vContent.replace("export default router;", crudTpl('vendor', 'vendorService') + "\nexport default router;");
fs.writeFileSync('src/server/routers/vendors.ts', vContent);

let cContent = fs.readFileSync('src/server/routers/candidates.ts', 'utf8');
cContent = cContent.replace("import candidatesHandler from '../controllers/candidates';", "import candidatesHandler from '../controllers/candidates';\nimport { candidateService } from '../services/CandidateService';");
cContent = cContent.replace("export default router;", crudTpl('candidate', 'candidateService') + "\nexport default router;");
fs.writeFileSync('src/server/routers/candidates.ts', cContent);

const sContent = `import { Router } from "express";
import { submissionService } from "../services/SubmissionService";

export const submissionsRouter = Router();
const router = submissionsRouter;
${crudTpl('submission', 'submissionService')}
`;
fs.writeFileSync('src/server/routers/submissions.ts', sContent);

let serverContent = fs.readFileSync('server.ts', 'utf8');
if (!serverContent.includes('submissionsRouter')) {
  serverContent = serverContent.replace('import { clientsRouter } from "./src/server/routers/clients";', 'import { clientsRouter } from "./src/server/routers/clients";\nimport { submissionsRouter } from "./src/server/routers/submissions";');
  serverContent = serverContent.replace('app.use("/api/clients", clientsRouter);', 'app.use("/api/clients", clientsRouter);\n    app.use("/api/submissions", submissionsRouter);');
  fs.writeFileSync('server.ts', serverContent);
}

