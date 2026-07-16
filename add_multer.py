import re

with open('src/server/routers/candidates.ts', 'r') as f:
    content = f.read()

if 'import multer from "multer";' not in content:
    content = content.replace("import { candidateService } from '../services/CandidateService';", "import { candidateService } from '../services/CandidateService';\nimport multer from 'multer';\nimport { candidateIngestionService } from '../services/CandidateIngestionService';")

multer_code = '''
const upload = multer({ storage: multer.memoryStorage() });

router.post('/ingest', upload.single('resume'), async (req: any, res: any) => {
  try {
    const file = req.file;
    const vendorId = req.body.vendorId;
    const requirementId = req.body.requirementId;
    const isPool = req.body.isPool === 'true';

    if (!file) {
      return res.status(400).json({ success: false, error: "No resume file provided" });
    }
    if (!vendorId) {
      return res.status(400).json({ success: false, error: "Missing vendorId" });
    }

    const result = (await candidateIngestionService.ingestCandidateFile(vendorId, requirementId, file.buffer, file.originalname, file.mimetype, isPool)) as any;
    return res.status(result.status).json(result.data);
  } catch (error: any) {
    console.error("[Candidates Ingest Error]", error);
    res.status(500).json({ error: error.message });
  }
});
'''

if '/ingest' not in content:
    content = content.replace("const router = Router();", "const router = Router();\n" + multer_code)

with open('src/server/routers/candidates.ts', 'w') as f:
    f.write(content)
