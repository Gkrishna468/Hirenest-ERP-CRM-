import { Router } from 'express';
import candidatesHandler from '../controllers/candidates.js';
import { candidateService } from '../services/CandidateService.js';
import multer from 'multer';
import { candidateIngestionService } from '../services/CandidateIngestionService.js';
import { getAdminDb } from '../utils/firebaseAdmin.js';
import { ScreeningAuditService } from '../services/screening/ScreeningAuditService.js';

const rateLimits = new Map<string, { count: number; resetTime: number }>();

const rateLimiterMiddleware = (req: any, res: any, next: any) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30;

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

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Multi-source Resume Ingestion & Strict Deterministic Screening
 */
router.post('/ingest', rateLimiterMiddleware, upload.single('resume'), async (req: any, res: any) => {
  try {
    const file = req.file;
    const vendorId = req.body.vendorId || req.body.source || "DIRECT_CANDIDATE";
    const requirementId = req.body.requirementId;
    const isPool = req.body.isPool === 'true' || !requirementId;
    const source = req.body.source || (vendorId === "DIRECT_CANDIDATE" ? "DIRECT" : "Vendor");

    if (!file) {
      return res.status(400).json({ success: false, error: "No resume file provided. Please upload a .pdf or .docx file." });
    }

    const result = (await candidateIngestionService.ingestCandidateFile(
      vendorId, 
      requirementId, 
      file.buffer, 
      file.originalname, 
      file.mimetype, 
      isPool,
      source
    )) as any;

    return res.status(result.status || 200).json(result.data || result);
  } catch (error: any) {
    console.log("ERROR:", "[Candidates Ingest Error]", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin / Lead Screening Override
 */
router.post('/:id/override', async (req: any, res: any) => {
  try {
    const candidateId = req.params.id;
    const { requirementId, overrideReason, overrideBy } = req.body;

    if (!overrideReason) {
      return res.status(400).json({ error: "Mandatory override reason is required." });
    }

    const db = getAdminDb();
    await db.collection("candidates").doc(candidateId).update({
      "screeningResult.passed": true,
      "screeningResult.status": "PASS",
      "screeningResult.adminOverridden": true,
      "screeningResult.overrideReason": overrideReason,
      "screeningResult.overrideBy": overrideBy || req.user?.email || "Admin",
      "screeningResult.overrideAt": new Date().toISOString(),
      stage: "Submission Ready",
      updatedAt: new Date().toISOString()
    });

    await ScreeningAuditService.recordOverride(
      candidateId,
      requirementId || "GENERAL",
      overrideReason,
      overrideBy || req.user?.email || "Admin"
    );

    res.status(200).json({ success: true, message: "Screening decision successfully overridden to PASS." });
  } catch (error: any) {
    console.log("ERROR:", "[Candidates Override Error]", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetch Full Candidate Screening Report
 */
router.get('/:id/screening', async (req: any, res: any) => {
  try {
    const candidateId = req.params.id;
    const db = getAdminDb();
    const doc = await db.collection("candidate_screening_reports").doc(candidateId).get();
    
    if (!doc.exists) {
      const candDoc = await db.collection("candidates").doc(candidateId).get();
      if (candDoc.exists && candDoc.data()?.screeningResult) {
        return res.status(200).json({
          screeningId: candDoc.data()?.screeningReportId || "LEGACY-REPORT",
          candidateName: candDoc.data()?.name,
          overallScore: candDoc.data()?.screeningResult?.overallScore || candDoc.data()?.aiMatchScore || 85,
          decision: {
            status: candDoc.data()?.screeningResult?.status || "PASS",
            primaryReason: candDoc.data()?.screeningResult?.summary || "Legacy candidate verified."
          },
          screeningResult: candDoc.data()?.screeningResult
        });
      }
      return res.status(404).json({ error: "Screening report not found." });
    }

    res.status(200).json(doc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manual LinkedIn Verification
 */
router.post('/:id/linkedin_verify', async (req: any, res: any) => {
  try {
    const candidateId = req.params.id;
    const { status, notes, mismatchFields, verifiedBy } = req.body;

    const db = getAdminDb();
    const updatePayload = {
      "linkedinVerification.linkedinVerificationStatus": status || "CHECKED",
      "linkedinVerification.linkedinCheckedAt": new Date().toISOString(),
      "linkedinVerification.linkedinCheckedBy": verifiedBy || req.user?.email || "Recruiter",
      "linkedinVerification.notes": notes || "",
      "linkedinVerification.linkedinMismatchFields": Array.isArray(mismatchFields) ? mismatchFields : [],
      updatedAt: new Date().toISOString()
    };

    await db.collection("candidates").doc(candidateId).update(updatePayload);
    res.status(200).json({ success: true, updatePayload });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Candidate Quality Control Sourcing Dashboard & Vendor Leaderboard
 */
router.get('/quality_control/metrics', async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const candSnapshot = await db.collection("candidates").limit(500).get();
    
    let totalScreened = 0;
    let passedCount = 0;
    let reviewCount = 0;
    let rejectedCount = 0;
    let totalScoreSum = 0;

    const vendorStats: Record<string, { total: number; passed: number; rejected: number; review: number; scores: number[] }> = {};

    for (const doc of candSnapshot.docs) {
      const data = doc.data();
      const screening = data.screeningResult;
      if (screening) {
        totalScreened++;
        const score = screening.overallScore || 0;
        totalScoreSum += score;

        if (screening.status === "PASS") passedCount++;
        else if (screening.status === "REJECT") rejectedCount++;
        else reviewCount++;

        const vId = data.vendorId || data.source || "DIRECT";
        if (!vendorStats[vId]) {
          vendorStats[vId] = { total: 0, passed: 0, rejected: 0, review: 0, scores: [] };
        }
        vendorStats[vId].total++;
        vendorStats[vId].scores.push(score);
        if (screening.status === "PASS") vendorStats[vId].passed++;
        else if (screening.status === "REJECT") vendorStats[vId].rejected++;
        else vendorStats[vId].review++;
      }
    }

    const leaderboard = Object.entries(vendorStats).map(([vendor, stats]) => {
      const avgScore = stats.scores.length > 0 ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) : 0;
      const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      return {
        vendor,
        totalSubmitted: stats.total,
        passed: stats.passed,
        rejected: stats.rejected,
        review: stats.review,
        passRate,
        averageQualityScore: avgScore
      };
    }).sort((a, b) => b.passRate - a.passRate);

    res.status(200).json({
      totalScreened,
      passRate: totalScreened > 0 ? Math.round((passedCount / totalScreened) * 100) : 100,
      averageQualityScore: totalScreened > 0 ? Math.round(totalScoreSum / totalScreened) : 85,
      breakdown: {
        passed: passedCount,
        review: reviewCount,
        rejected: rejectedCount
      },
      vendorLeaderboard: leaderboard
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pool', async (req, res) => {
  req.query.action = 'submitVendorCandidatePool';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.log("ERROR:", "[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/requirement', async (req, res) => {
  req.query.action = 'submitVendorCandidate';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.log("ERROR:", "[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/reprocess', async (req, res) => {
  req.query.action = 'reprocessAiQueue';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.log("ERROR:", "[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/rotation', async (req, res) => {
  req.query.action = 'triggerAiRotation';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.log("ERROR:", "[Candidates Error]", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/validate', async (req, res) => {
  req.query.action = 'validateCandidates';
  try {
    await candidatesHandler(req as any, res as any);
  } catch (error) {
    console.log("ERROR:", "[Candidates Error]", error);
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
