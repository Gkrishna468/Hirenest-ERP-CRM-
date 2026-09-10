import { Router } from "express";
import { qualityControlService } from "../services/QualityControlService.js";
import { getAdminDb } from "../utils/firebaseAdmin.js";
import { DomainEventPublisher } from "../events/DomainEventPublisher.js";

const router = Router();

/**
 * GET /api/quality-control/overview
 * Sourcing Head & Admin Quality Control Overview
 */
router.get("/overview", async (req: any, res: any) => {
  try {
    const user = req.user;
    const {
      dateRange,
      startDate,
      endDate,
      vendorId,
      requirementId,
      minTotalForDiscrepancy,
      maxRelevantRatio
    } = req.query;

    const filter = {
      dateRange: dateRange as string,
      startDate: startDate as string,
      endDate: endDate as string,
      vendorId: vendorId as string,
      requirementId: requirementId as string,
      minTotalForDiscrepancy: minTotalForDiscrepancy ? parseFloat(minTotalForDiscrepancy as string) : undefined,
      maxRelevantRatio: maxRelevantRatio ? parseFloat(maxRelevantRatio as string) : undefined
    };

    const overview = await qualityControlService.getOverview(filter, user);
    return res.status(200).json({ success: true, data: overview });
  } catch (error: any) {
    console.error("[QualityControlRouter] Overview Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quality-control/vendor-summary
 * Get vendor quality scorecard and deterministic coaching
 */
router.get("/vendor-summary", async (req: any, res: any) => {
  try {
    const user = req.user;
    const requestedVendorId = req.query.vendorId as string;

    // RBAC: Vendor can only request their own data
    let targetVendorId = requestedVendorId;
    if (user?.workspace === "Vendor" && user?.vendorId) {
      targetVendorId = user.vendorId;
    }

    if (!targetVendorId) {
      return res.status(400).json({ success: false, error: "vendorId parameter is required" });
    }

    const overview = await qualityControlService.getOverview(
      { vendorId: targetVendorId, dateRange: (req.query.dateRange as string) || "last30days" },
      user
    );

    const vendorSummary = overview.vendorIntelligence.find(v => v.vendorId === targetVendorId);
    if (!vendorSummary) {
      return res.status(404).json({ success: false, error: "Vendor quality profile not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        vendor: vendorSummary,
        dataPeriod: overview.dataPeriod,
        kpis: overview.kpis,
        rejectionDiagnostics: overview.rejectionDiagnostics,
        experienceQuality: overview.experienceQuality,
        skillEvidenceQuality: overview.skillEvidenceQuality
      }
    });
  } catch (error: any) {
    console.error("[QualityControlRouter] Vendor Summary Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/quality-control/candidates
 * Drill-down list of candidates matching screening filters
 */
router.get("/candidates", async (req: any, res: any) => {
  try {
    const db = getAdminDb();
    const user = req.user;
    const {
      vendorId,
      requirementId,
      decision, // PASS, REVIEW, REJECT
      rejectionCategory,
      keywordOnly
    } = req.query;

    let targetVendorId = vendorId as string;
    if (user?.workspace === "Vendor" && user?.vendorId) {
      targetVendorId = user.vendorId;
    }

    const [candidatesSnap, reportsSnap] = await Promise.all([
      db.collection("candidates").get(),
      db.collection("candidate_screening_reports").get()
    ]);

    const reportsMap = new Map<string, any>();
    reportsSnap.docs.forEach(doc => {
      reportsMap.set(doc.id, doc.data());
      if (doc.data().candidateId) reportsMap.set(doc.data().candidateId, doc.data());
    });

    const results: any[] = [];

    candidatesSnap.docs.forEach(doc => {
      const cand: any = { id: doc.id, ...doc.data() };
      const report = reportsMap.get(cand.id);
      const screeningResult = cand.screeningResult || report;
      const candDecision = screeningResult?.decision?.status || (cand.stage === "rejected" ? "REJECT" : (cand.aiMatchScore ? "PASS" : "LEGACY_UNSCREENED"));

      if (targetVendorId && cand.vendorId !== targetVendorId) return;
      if (requirementId && cand.jobId !== requirementId && cand.requirementId !== requirementId) return;
      if (decision && candDecision !== decision) return;

      if (keywordOnly === "true") {
        const isKwOnly = screeningResult?.evidenceEvaluation?.isKeywordOnlyProfile;
        if (!isKwOnly) return;
      }

      if (rejectionCategory) {
        const reasons: string[] = screeningResult?.decision?.rejectionReasons || [];
        if (reasons.length === 0 && screeningResult?.decision?.primaryReason) {
          reasons.push(screeningResult.decision.primaryReason);
        }
        const text = reasons.join(" ").toLowerCase();
        const cat = rejectionCategory.toLowerCase();
        let matches = false;
        if (cat.includes("experience") && (text.includes("experience") || text.includes("hands-on") || text.includes("deficit"))) matches = true;
        else if (cat.includes("skill") && (text.includes("skill") || text.includes("mandatory") || text.includes("absent"))) matches = true;
        else if (cat.includes("keyword") && (text.includes("keyword") || text.includes("evidence"))) matches = true;
        else if (cat.includes("timeline") && (text.includes("timeline") || text.includes("chronology"))) matches = true;
        else if (cat.includes("document") && (text.includes("document") || text.includes("unreadable"))) matches = true;
        else if (cat.includes("notice") && (text.includes("notice") || text.includes("joining"))) matches = true;
        else if (cat.includes("location") && (text.includes("location") || text.includes("mode"))) matches = true;
        else if (cat.includes("budget") && (text.includes("budget") || text.includes("ctc") || text.includes("salary"))) matches = true;
        else matches = true;

        if (!matches) return;
      }

      results.push({
        id: cand.id,
        name: cand.name,
        email: cand.email,
        phone: cand.phone,
        vendorId: cand.vendorId,
        vendorName: cand.vendorName,
        jobId: cand.jobId || cand.requirementId,
        jobTitle: cand.jobTitle,
        skills: cand.skills,
        experience: cand.experience,
        decision: candDecision,
        score: screeningResult?.overallScore ?? cand.aiMatchScore ?? null,
        primaryReason: screeningResult?.decision?.primaryReason || cand.notes || null,
        rejectionReasons: screeningResult?.decision?.rejectionReasons || [],
        reviewFlags: screeningResult?.decision?.reviewFlags || [],
        totalExperienceFormatted: screeningResult?.totalExperience?.formatted || null,
        relevantExperienceFormatted: screeningResult?.relevantExperience?.formatted || null,
        createdAt: cand.createdAt || cand.created_at
      });
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results.slice(0, 100) // Page size limit
    });
  } catch (error: any) {
    console.error("[QualityControlRouter] Candidates Drill-down Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/quality-control/send-coaching
 * Logs dispatched coaching memo to partner in the company ledger
 */
router.post("/send-coaching", async (req: any, res: any) => {
  try {
    const user = req.user;
    const { vendorId, vendorName, subject, body, actionItems } = req.body;

    if (!vendorId || !subject) {
      return res.status(400).json({ success: false, error: "vendorId and subject are required" });
    }

    const db = getAdminDb();
    const eventRef = db.collection("system_events").doc();
    const timestamp = new Date().toISOString();

    await eventRef.set({
      id: eventRef.id,
      type: "VENDOR_QUALITY_COACHING_DISPATCHED",
      entityType: "vendor",
      entityId: vendorId,
      performedBy: user?.email || user?.id || "Admin",
      timestamp,
      metadata: {
        vendorId,
        vendorName,
        subject,
        bodyPreview: (body || "").substring(0, 120),
        actionItemsCount: actionItems?.length || 0
      }
    });

    await DomainEventPublisher.publishDomainEvent({
      type: "VENDOR_QUALITY_COACHING_DISPATCHED",
      aggregateType: "Vendor",
      aggregateId: vendorId,
      organizationId: user?.organizationId || "default",
      actorId: user?.id || "Admin",
      actorRole: user?.role || "Admin",
      sourceApp: "CRM",
      sourceWorkspace: "Admin",
      payload: {
        vendorId,
        vendorName,
        subject,
        actionItems
      }
    });

    return res.status(200).json({
      success: true,
      message: `Quality coaching guidance successfully dispatched and recorded for ${vendorName || vendorId}.`,
      eventId: eventRef.id
    });
  } catch (error: any) {
    console.error("[QualityControlRouter] Send Coaching Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
