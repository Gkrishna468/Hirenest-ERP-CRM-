import { Router } from 'express';
import candidatesHandler from '../controllers/candidates';
import { candidateService } from '../services/CandidateService';

const router = Router();

router.post('/pool', async (req, res) => {
  req.query.action = 'submitVendorCandidatePool';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.error("[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/requirement', async (req, res) => {
  req.query.action = 'submitVendorCandidate';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.error("[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/reprocess', async (req, res) => {
  req.query.action = 'reprocessAiQueue';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.error("[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/rotation', async (req, res) => {
  req.query.action = 'triggerAiRotation';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.error("[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/validate', async (req, res) => {
  req.query.action = 'validateCandidates';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.error("[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get("/", async (req: any, res: any) => {
  try {
    const list = await candidateService.list(req.user);
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const data = await candidateService.getById(req.params.id, req.user);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res: any) => {
  try {
    const data = await candidateService.create(req.body.payload || req.body, req.body.performedBy, req.user);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res: any) => {
  try {
    await candidateService.update(req.params.id, req.body.payload || req.body, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  try {
    await candidateService.delete(req.params.id, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
