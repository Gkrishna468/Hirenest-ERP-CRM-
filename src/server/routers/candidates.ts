import { Router } from 'express';
import candidatesHandler from '../controllers/candidates';

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

export default router;
