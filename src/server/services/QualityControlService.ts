import { getAdminDb } from "../utils/firebaseAdmin.js";

export interface QualityDateFilter {
  dateRange?: "today" | "yesterday" | "last7days" | "last30days" | "thismonth" | "lastmonth" | "custom" | string;
  startDate?: string;
  endDate?: string;
  vendorId?: string;
  requirementId?: string;
  minTotalForDiscrepancy?: number;
  maxRelevantRatio?: number;
}

export interface RejectionCategoryStat {
  category: string;
  label: string;
  count: number;
  percentage: number;
  sampleReasons: string[];
}

export interface SkillEvidenceBreakdown {
  level: string;
  label: string;
  count: number;
  percentage: number;
}

export interface VendorQualitySummary {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  status: string;
  profilesSubmitted: number;
  profilesScreened: number;
  passed: number;
  review: number;
  rejected: number;
  passRate: number | null;
  avgMatchScore: number | null;
  shortlists: number;
  interviews: number;
  selections: number;
  placements: number;
  clientRejectionRate: number | null;
  qualityRating: "NOT_YET_RATED" | "A+" | "A" | "B" | "C" | "D";
  compositeScore: number | null;
  whyThisRank: {
    screeningWeight: number;
    screeningContribution: number;
    matchWeight: number;
    matchContribution: number;
    shortlistWeight: number;
    shortlistContribution: number;
    conversionWeight: number;
    conversionContribution: number;
    formulaExplanation: string;
  } | null;
  topRejectionReasons: { reason: string; count: number }[];
  actionableSummary: string;
  coachingFeedback: {
    subject: string;
    body: string;
    actionItems: string[];
  };
}

export interface ActionCenterAlert {
  id: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  targetType: "VENDOR" | "REQUIREMENT" | "SOURCING_POOL";
  targetId?: string;
  targetName?: string;
  reason: string;
  evidence: string;
  recommendedAction: string;
}

export interface RequirementQualitySummary {
  requirementId: string;
  title: string;
  clientName: string;
  status: string;
  broadcast: boolean;
  profilesReceived: number;
  profilesScreened: number;
  passed: number;
  review: number;
  rejected: number;
  passRate: number | null;
  avgMatchScore: number | null;
  shortlists: number;
  interviews: number;
  selections: number;
  placements: number;
  topRejectionReasons: { reason: string; count: number }[];
}

export interface ClientQualitySummary {
  clientId: string;
  clientName: string;
  activeRequirements: number;
  profilesSubmitted: number;
  shortlisted: number;
  interviews: number;
  selections: number;
  placements: number;
  rejections: number;
}

export interface QualityTrendPoint {
  period: string;
  label: string;
  profilesReceived: number;
  passed: number;
  rejected: number;
  passRate: number | null;
  avgMatchScore: number | null;
  shortlisted: number;
  placed: number;
}

export interface QualityControlOverview {
  dataPeriod: {
    filter: string;
    start: string;
    end: string;
    formatted: string;
  };
  kpis: {
    totalProfiles: number;
    screenedProfiles: number;
    passedProfiles: number;
    reviewProfiles: number;
    rejectedProfiles: number;
    screeningPassRate: number | null;
    averageMatchScore: number | null;
    totalSubmissions: number;
    clientShortlistCount: number;
    clientShortlistRate: number | null;
    interviewCount: number;
    interviewConversion: number | null;
    selectionCount: number;
    placementCount: number;
    placementConversion: number | null;
  };
  rejectionDiagnostics: {
    totalRejections: number;
    categories: RejectionCategoryStat[];
    topReasons: { reason: string; count: number; percentage: number }[];
  };
  experienceQuality: {
    averageTotalExperienceYears: number | null;
    averageRelevantExperienceYears: number | null;
    majorDiscrepancyCount: number;
    discrepancyThresholdUsed: {
      minTotalYears: number;
      maxRelevantRatio: number;
    };
    distribution: {
      under2Years: number;
      twoToFiveYears: number;
      fiveToEightYears: number;
      eightPlusYears: number;
    };
  };
  skillEvidenceQuality: {
    totalEvaluations: number;
    breakdown: SkillEvidenceBreakdown[];
    keywordOnlyProfilesCount: number;
    keywordOnlyPercentage: number;
  };
  vendorIntelligence: VendorQualitySummary[];
  actionCenterAlerts: ActionCenterAlert[];
  requirementQuality: RequirementQualitySummary[];
  clientQuality: ClientQualitySummary[];
  trends: QualityTrendPoint[];
}

export class QualityControlService {
  private static instance: QualityControlService;

  public static getInstance(): QualityControlService {
    if (!QualityControlService.instance) {
      QualityControlService.instance = new QualityControlService();
    }
    return QualityControlService.instance;
  }

  private getDateRangeBounds(filter: QualityDateFilter): { start: Date; end: Date; label: string } {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    let label = "Last 30 Days";

    const type = filter.dateRange || "last30days";

    switch (type) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        label = "Today";
        break;
      case "yesterday":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        label = "Yesterday";
        break;
      case "last7days":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        label = "Last 7 Days";
        break;
      case "thismonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        label = "This Month";
        break;
      case "lastmonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = "Last Month";
        break;
      case "custom":
        if (filter.startDate) {
          start = new Date(filter.startDate);
        } else {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        if (filter.endDate) {
          end = new Date(filter.endDate);
        }
        label = `Custom (${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]})`;
        break;
      case "last30days":
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        label = "Last 30 Days";
        break;
    }

    return { start, end, label };
  }

  public async getOverview(
    filter: QualityDateFilter = {},
    userContext?: any
  ): Promise<QualityControlOverview> {
    const db = getAdminDb();
    const { start, end, label } = this.getDateRangeBounds(filter);

    const minTotalYears = filter.minTotalForDiscrepancy ?? 5;
    const maxRelevantRatio = filter.maxRelevantRatio ?? 0.4;

    // RBAC: If user is a vendor, restrict to their vendorId
    let vendorFilter = filter.vendorId;
    if (userContext?.workspace === "Vendor" && userContext.vendorId) {
      vendorFilter = userContext.vendorId;
    }

    // 1. Fetch raw operational records in parallel
    const [candidatesSnap, reportsSnap, submissionsSnap, requirementsSnap, vendorsSnap, clientsSnap] = await Promise.all([
      db.collection("candidates").get().catch(() => ({ docs: [] as any[] })),
      db.collection("candidate_screening_reports").get().catch(() => ({ docs: [] as any[] })),
      db.collection("submissions").get().catch(() => ({ docs: [] as any[] })),
      db.collection("requirements").get().catch(() => ({ docs: [] as any[] })),
      db.collection("vendors").get().catch(() => ({ docs: [] as any[] })),
      db.collection("clients").get().catch(() => ({ docs: [] as any[] }))
    ]);

    // Map reports by candidateId
    const reportsMap = new Map<string, any>();
    reportsSnap.docs.forEach(doc => {
      const data = doc.data();
      reportsMap.set(doc.id, data);
      if (data.candidateId) reportsMap.set(data.candidateId, data);
    });

    // Map requirements by id
    const requirementsMap = new Map<string, any>();
    requirementsSnap.docs.forEach(doc => {
      requirementsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Map vendors by id
    const vendorsMap = new Map<string, any>();
    vendorsSnap.docs.forEach(doc => {
      vendorsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Map clients by id
    const clientsMap = new Map<string, any>();
    clientsSnap.docs.forEach(doc => {
      clientsMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Filter candidates within date range & vendor/requirement filters
    const filteredCandidates: any[] = [];
    candidatesSnap.docs.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const createdAtStr = data.createdAt || data.created_at;
      const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();

      if (createdAt >= start && createdAt <= end) {
        if (vendorFilter && data.vendorId !== vendorFilter) return;
        if (filter.requirementId && data.jobId !== filter.requirementId && data.requirementId !== filter.requirementId) return;
        filteredCandidates.push(data);
      }
    });

    // Filter submissions within date range
    const filteredSubmissions: any[] = [];
    submissionsSnap.docs.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const createdAtStr = data.createdAt || data.created_at;
      const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();

      if (createdAt >= start && createdAt <= end) {
        if (vendorFilter && data.vendorId !== vendorFilter) return;
        if (filter.requirementId && data.requirementId !== filter.requirementId && data.jobId !== filter.requirementId) return;
        filteredSubmissions.push(data);
      }
    });

    // 2. Compute Top KPI counts
    const totalProfiles = filteredCandidates.length;
    let screenedProfiles = 0;
    let passedProfiles = 0;
    let reviewProfiles = 0;
    let rejectedProfiles = 0;
    let matchScoreSum = 0;
    let matchScoreCount = 0;

    let totalExpMonthsSum = 0;
    let totalExpCount = 0;
    let relExpMonthsSum = 0;
    let relExpCount = 0;
    let majorDiscrepancyCount = 0;

    const expDistribution = {
      under2Years: 0,
      twoToFiveYears: 0,
      fiveToEightYears: 0,
      eightPlusYears: 0
    };

    const evidenceLevelCounts = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0
    };
    let keywordOnlyProfilesCount = 0;

    const rawRejectionReasons: string[] = [];
    const categoryCounts: Record<string, { count: number; label: string; samples: string[] }> = {
      INSUFFICIENT_RELEVANT_EXPERIENCE: { count: 0, label: "Insufficient Relevant Experience", samples: [] },
      MISSING_MANDATORY_SKILL: { count: 0, label: "Missing Mandatory Skills", samples: [] },
      KEYWORD_ONLY_EVIDENCE: { count: 0, label: "Keyword-Only / Low Skill Evidence", samples: [] },
      TIMELINE_INCONSISTENCY: { count: 0, label: "Timeline Inconsistency / Risk", samples: [] },
      DOCUMENT_QUALITY_FAILURE: { count: 0, label: "Document Quality Failure", samples: [] },
      NOTICE_PERIOD_MISMATCH: { count: 0, label: "Notice Period Mismatch", samples: [] },
      LOCATION_MISMATCH: { count: 0, label: "Location Mismatch", samples: [] },
      CTC_BUDGET_MISMATCH: { count: 0, label: "CTC / Budget Mismatch", samples: [] },
      TITLE_ROLE_MISMATCH: { count: 0, label: "Title / Role Mismatch", samples: [] },
      OTHER_REQUIREMENT_FAILURE: { count: 0, label: "Other Requirement Failure", samples: [] }
    };

    // Helper to categorize rejection reason
    const categorizeReason = (reason: string) => {
      const lower = reason.toLowerCase();
      if (lower.includes("experience") || lower.includes("hands-on") || lower.includes("deficit") || lower.includes("domain experience") || lower.includes("relevant")) {
        return "INSUFFICIENT_RELEVANT_EXPERIENCE";
      }
      if (lower.includes("critical required skills absent") || lower.includes("mandatory") || lower.includes("missing critical") || lower.includes("critical required skills")) {
        return "MISSING_MANDATORY_SKILL";
      }
      if (lower.includes("keyword") || lower.includes("without project") || lower.includes("implementation evidence") || lower.includes("evidence")) {
        return "KEYWORD_ONLY_EVIDENCE";
      }
      if (lower.includes("timeline") || lower.includes("chronology") || lower.includes("inconsistency") || lower.includes("career stability")) {
        return "TIMELINE_INCONSISTENCY";
      }
      if (lower.includes("unreadable") || lower.includes("corrupted") || lower.includes("document") || lower.includes("extraction quality")) {
        return "DOCUMENT_QUALITY_FAILURE";
      }
      if (lower.includes("notice") || lower.includes("joining timeline")) {
        return "NOTICE_PERIOD_MISMATCH";
      }
      if (lower.includes("location") || lower.includes("work mode") || lower.includes("relocation")) {
        return "LOCATION_MISMATCH";
      }
      if (lower.includes("budget") || lower.includes("salary") || lower.includes("ctc")) {
        return "CTC_BUDGET_MISMATCH";
      }
      if (lower.includes("title") || lower.includes("seniority") || lower.includes("role")) {
        return "TITLE_ROLE_MISMATCH";
      }
      return "OTHER_REQUIREMENT_FAILURE";
    };

    for (const cand of filteredCandidates) {
      const report = reportsMap.get(cand.id);
      const screeningResult = cand.screeningResult || report;
      const decision = screeningResult?.decision?.status || (cand.stage === "rejected" ? "REJECT" : (cand.aiMatchScore ? "PASS" : null));

      if (screeningResult || cand.aiMatchScore !== undefined || cand.aiMatchScore !== null) {
        screenedProfiles++;

        if (decision === "PASS") passedProfiles++;
        else if (decision === "REVIEW") reviewProfiles++;
        else if (decision === "REJECT") rejectedProfiles++;

        // Match score
        const score = screeningResult?.overallScore ?? screeningResult?.score ?? cand.aiMatchScore;
        if (typeof score === "number" && !isNaN(score)) {
          matchScoreSum += score;
          matchScoreCount++;
        }

        // Rejection reasons aggregation
        if (decision === "REJECT" || (screeningResult?.decision?.rejectionReasons?.length > 0)) {
          const reasons = screeningResult?.decision?.rejectionReasons || [];
          if (reasons.length === 0 && screeningResult?.decision?.primaryReason) {
            reasons.push(screeningResult.decision.primaryReason);
          }
          if (reasons.length === 0 && cand.notes && cand.notes.toLowerCase().includes("reject")) {
            reasons.push(cand.notes);
          }

          reasons.forEach((r: string) => {
            rawRejectionReasons.push(r);
            const cat = categorizeReason(r);
            categoryCounts[cat].count++;
            if (categoryCounts[cat].samples.length < 3 && !categoryCounts[cat].samples.includes(r)) {
              categoryCounts[cat].samples.push(r);
            }
          });
        }

        // Experience calculations
        const totalExpMonths = screeningResult?.totalExperience?.months ?? (typeof cand.yearsExperience === "number" ? cand.yearsExperience * 12 : null);
        const relExpMonths = screeningResult?.relevantExperience?.months ?? null;

        if (typeof totalExpMonths === "number" && !isNaN(totalExpMonths)) {
          totalExpMonthsSum += totalExpMonths;
          totalExpCount++;
          const years = totalExpMonths / 12;
          if (years < 2) expDistribution.under2Years++;
          else if (years < 5) expDistribution.twoToFiveYears++;
          else if (years < 8) expDistribution.fiveToEightYears++;
          else expDistribution.eightPlusYears++;
        }

        if (typeof relExpMonths === "number" && !isNaN(relExpMonths)) {
          relExpMonthsSum += relExpMonths;
          relExpCount++;
        }

        if (typeof totalExpMonths === "number" && typeof relExpMonths === "number") {
          const totalY = totalExpMonths / 12;
          const relY = relExpMonths / 12;
          if (totalY >= minTotalYears && (relY / totalY <= maxRelevantRatio || (totalY - relY) >= 3)) {
            majorDiscrepancyCount++;
          }
        }

        // Skill Evidence Quality aggregation
        const evidenceEval = screeningResult?.evidenceEvaluation || screeningResult?.screeningResult?.evidenceEvaluation;
        if (evidenceEval) {
          if (evidenceEval.isKeywordOnlyProfile) {
            keywordOnlyProfilesCount++;
          }
          if (evidenceEval.skillEvidenceMap) {
            Object.values(evidenceEval.skillEvidenceMap).forEach((ev: any) => {
              const lvl = ev.level as keyof typeof evidenceLevelCounts;
              if (evidenceLevelCounts[lvl] !== undefined) {
                evidenceLevelCounts[lvl]++;
              }
            });
          }
        }
      }
    }

    // Submissions conversion counts
    const totalSubmissions = filteredSubmissions.length;
    let clientShortlistCount = 0;
    let interviewCount = 0;
    let selectionCount = 0;
    let placementCount = 0;

    for (const sub of filteredSubmissions) {
      const st = (sub.status || "").toLowerCase();
      if (["shortlisted", "interview", "offered", "selected", "hired", "placed"].includes(st)) {
        clientShortlistCount++;
      }
      if (["interview", "offered", "selected", "hired", "placed"].includes(st)) {
        interviewCount++;
      }
      if (["offered", "selected", "hired", "placed"].includes(st)) {
        selectionCount++;
      }
      if (["hired", "placed"].includes(st)) {
        placementCount++;
      }
    }

    // Rates calculation
    const screeningPassRate = screenedProfiles > 0 ? Math.round((passedProfiles / screenedProfiles) * 1000) / 10 : null;
    const averageMatchScore = matchScoreCount > 0 ? Math.round((matchScoreSum / matchScoreCount) * 10) / 10 : null;
    const clientShortlistRate = totalSubmissions > 0 ? Math.round((clientShortlistCount / totalSubmissions) * 1000) / 10 : null;
    const interviewConversion = (clientShortlistCount > 0)
      ? Math.round((interviewCount / clientShortlistCount) * 1000) / 10
      : (totalSubmissions > 0 ? Math.round((interviewCount / totalSubmissions) * 1000) / 10 : null);
    const placementConversion = totalSubmissions > 0 ? Math.round((placementCount / totalSubmissions) * 1000) / 10 : null;

    // Rejection Diagnostics list
    const totalRejections = rejectedProfiles || Object.values(categoryCounts).reduce((acc, c) => acc + c.count, 0);
    const rejectionCategories: RejectionCategoryStat[] = Object.entries(categoryCounts)
      .filter(([_, data]) => data.count > 0)
      .map(([cat, data]) => ({
        category: cat,
        label: data.label,
        count: data.count,
        percentage: totalRejections > 0 ? Math.round((data.count / totalRejections) * 1000) / 10 : 0,
        sampleReasons: data.samples
      }))
      .sort((a, b) => b.count - a.count);

    // Top frequency reasons
    const reasonFrequency = new Map<string, number>();
    rawRejectionReasons.forEach(r => {
      const trimmed = r.trim();
      reasonFrequency.set(trimmed, (reasonFrequency.get(trimmed) || 0) + 1);
    });

    const topReasons = Array.from(reasonFrequency.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalRejections > 0 ? Math.round((count / totalRejections) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Evidence Breakdown
    const totalEvidenceCount = Object.values(evidenceLevelCounts).reduce((a, b) => a + b, 0);
    const evidenceLabels: Record<string, string> = {
      L0: "L0 Keyword Only",
      L1: "L1 Role / Title Mention",
      L2: "L2 Project Context",
      L3: "L3 Architecture & Ownership",
      L4: "L4 Measurable Production Impact"
    };

    const skillEvidenceBreakdown: SkillEvidenceBreakdown[] = Object.entries(evidenceLevelCounts).map(([level, count]) => ({
      level,
      label: evidenceLabels[level] || level,
      count,
      percentage: totalEvidenceCount > 0 ? Math.round((count / totalEvidenceCount) * 1000) / 10 : 0
    }));

    // 3. Vendor Intelligence Aggregation
    const vendorMapData = new Map<string, {
      vendorId: string;
      vendorName: string;
      vendorCode: string;
      status: string;
      submitted: number;
      screened: number;
      passed: number;
      review: number;
      rejected: number;
      scores: number[];
      rejections: Record<string, number>;
      rawReasons: string[];
      shortlists: number;
      interviews: number;
      selections: number;
      placements: number;
      clientRejections: number;
    }>();

    // Initialize with existing vendors
    vendorsSnap.docs.forEach(doc => {
      const v = doc.data();
      const id = doc.id;
      vendorMapData.set(id, {
        vendorId: id,
        vendorName: v.name || v.company || `Vendor ${id}`,
        vendorCode: v.vendorCode || id,
        status: v.status || "active",
        submitted: 0,
        screened: 0,
        passed: 0,
        review: 0,
        rejected: 0,
        scores: [],
        rejections: {},
        rawReasons: [],
        shortlists: 0,
        interviews: 0,
        selections: 0,
        placements: 0,
        clientRejections: 0
      });
    });

    // Populate from candidates
    for (const cand of filteredCandidates) {
      const vId = cand.vendorId;
      if (!vId) continue;

      let vEntry = vendorMapData.get(vId);
      if (!vEntry) {
        vEntry = {
          vendorId: vId,
          vendorName: cand.vendorName || `Vendor ${vId}`,
          vendorCode: cand.vendorCode || vId,
          status: "active",
          submitted: 0,
          screened: 0,
          passed: 0,
          review: 0,
          rejected: 0,
          scores: [],
          rejections: {},
          rawReasons: [],
          shortlists: 0,
          interviews: 0,
          selections: 0,
          placements: 0,
          clientRejections: 0
        };
        vendorMapData.set(vId, vEntry);
      }

      vEntry.submitted++;

      const rep = reportsMap.get(cand.id);
      const res = cand.screeningResult || rep;
      const dec = res?.decision?.status || (cand.stage === "rejected" ? "REJECT" : (cand.aiMatchScore ? "PASS" : null));

      if (res || cand.aiMatchScore !== undefined || cand.aiMatchScore !== null) {
        vEntry.screened++;
        if (dec === "PASS") vEntry.passed++;
        else if (dec === "REVIEW") vEntry.review++;
        else if (dec === "REJECT") vEntry.rejected++;

        const s = res?.overallScore ?? res?.score ?? cand.aiMatchScore;
        if (typeof s === "number" && !isNaN(s)) {
          vEntry.scores.push(s);
        }

        if (dec === "REJECT" || res?.decision?.rejectionReasons?.length > 0) {
          const reasons: string[] = res?.decision?.rejectionReasons || [];
          if (reasons.length === 0 && res?.decision?.primaryReason) {
            reasons.push(res.decision.primaryReason);
          }
          reasons.forEach(r => {
            const cat = categorizeReason(r);
            vEntry!.rejections[cat] = (vEntry!.rejections[cat] || 0) + 1;
            vEntry!.rawReasons.push(r);
          });
        }
      }
    }

    // Populate from submissions
    for (const sub of filteredSubmissions) {
      const vId = sub.vendorId;
      if (!vId) continue;

      const vEntry = vendorMapData.get(vId);
      if (vEntry) {
        const st = (sub.status || "").toLowerCase();
        if (["shortlisted", "interview", "offered", "selected", "hired", "placed"].includes(st)) vEntry.shortlists++;
        if (["interview", "offered", "selected", "hired", "placed"].includes(st)) vEntry.interviews++;
        if (["offered", "selected", "hired", "placed"].includes(st)) vEntry.selections++;
        if (["hired", "placed"].includes(st)) vEntry.placements++;
        if (st === "rejected") vEntry.clientRejections++;
      }
    }

    // Generate Vendor Quality Summaries & Deterministic Coaching
    const vendorIntelligenceList: VendorQualitySummary[] = Array.from(vendorMapData.values())
      .filter(v => {
        if (vendorFilter) return v.vendorId === vendorFilter;
        return true;
      })
      .map(v => {
        const hasData = v.screened > 0 || v.submitted > 0;
        const passRate = v.screened > 0 ? Math.round((v.passed / v.screened) * 1000) / 10 : null;
        const avgMatch = v.scores.length > 0 ? Math.round((v.scores.reduce((a, b) => a + b, 0) / v.scores.length) * 10) / 10 : null;
        const clientRejectionRate = (v.shortlists + v.clientRejections) > 0 ? Math.round((v.clientRejections / (v.shortlists + v.clientRejections)) * 1000) / 10 : null;

        // Transparent Composite Scoring:
        // Weights: Screening Pass Rate 35%, Match Score 25%, Shortlist 20%, Placement/Interview 20%
        let qualityRating: "NOT_YET_RATED" | "A+" | "A" | "B" | "C" | "D" = "NOT_YET_RATED";
        let compositeScore: number | null = null;
        let whyThisRank: any = null;

        if (hasData && v.screened >= 1) {
          const passPart = (passRate ?? 0) * 0.35;
          const matchPart = (avgMatch ?? 0) * 0.25;
          const shortlistRatio = v.submitted > 0 ? (v.shortlists / v.submitted) * 100 : 0;
          const shortlistPart = Math.min(100, shortlistRatio * 1.5) * 0.20;
          const convRatio = v.shortlists > 0 ? (v.placements / v.shortlists) * 100 : (v.placements > 0 ? 100 : 0);
          const convPart = Math.min(100, convRatio * 2) * 0.20;

          compositeScore = Math.round((passPart + matchPart + shortlistPart + convPart) * 10) / 10;

          if (compositeScore >= 85) qualityRating = "A+";
          else if (compositeScore >= 75) qualityRating = "A";
          else if (compositeScore >= 60) qualityRating = "B";
          else if (compositeScore >= 45) qualityRating = "C";
          else qualityRating = "D";

          whyThisRank = {
            screeningWeight: 35,
            screeningContribution: Math.round(passPart * 10) / 10,
            matchWeight: 25,
            matchContribution: Math.round(matchPart * 10) / 10,
            shortlistWeight: 20,
            shortlistContribution: Math.round(shortlistPart * 10) / 10,
            conversionWeight: 20,
            conversionContribution: Math.round(convPart * 10) / 10,
            formulaExplanation: "Composite Score = (Screening Pass Rate × 35%) + (Avg Match Score × 25%) + (Shortlist Rate × 20%) + (Placement Conversion × 20%)."
          };
        }

        // Top vendor rejection reasons
        const topRejectionReasons = Object.entries(v.rejections)
          .map(([cat, count]) => ({
            reason: categoryCounts[cat]?.label || cat,
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        // Actionable summary
        let actionableSummary = "";
        if (!hasData) {
          actionableSummary = "New partner. No submissions evaluated yet in this period.";
        } else if (v.rejected === 0 && v.passed > 0) {
          actionableSummary = `Excellent sourcing accuracy. 100% of screened candidates passed deterministic criteria with average match score of ${avgMatch}%.`;
        } else {
          const primaryIssue = topRejectionReasons[0]?.reason || "Technical alignment below benchmark";
          const rejectPct = v.screened > 0 ? Math.round((v.rejected / v.screened) * 100) : 0;
          actionableSummary = `${rejectPct}% of submitted profiles were rejected. The leading quality bottleneck was ${primaryIssue.toLowerCase()}.`;
        }

        // Coaching template
        const leadingReason = topRejectionReasons[0]?.reason || "Relevant Experience & Skill Validation";
        const actionItems: string[] = [
          "Verify hands-on project duration separately from total career experience.",
          "Ensure mandatory required skills are backed by verifiable project implementations.",
          "Avoid keyword-stuffing in resume skill summaries without detailed project context.",
          "Confirm candidate availability, work authorization, and compensation expectations prior to submission."
        ];

        if (topRejectionReasons.some(r => r.reason.toLowerCase().includes("mandatory"))) {
          actionItems.unshift("Cross-verify that all mandatory requirement skills are explicitly documented in candidate work history.");
        }

        const coachingFeedback = {
          subject: `Candidate Sourcing Quality Improvement — ${v.vendorName}`,
          body: `Our automated deterministic screening analysis for recent submissions indicates that the most frequent rejection factor is "${leadingReason}". Please review the action items below prior to your next batch of candidate submissions to ensure rapid shortlisting.`,
          actionItems
        };

        return {
          vendorId: v.vendorId,
          vendorName: v.vendorName,
          vendorCode: v.vendorCode,
          status: v.status,
          profilesSubmitted: v.submitted,
          profilesScreened: v.screened,
          passed: v.passed,
          review: v.review,
          rejected: v.rejected,
          passRate,
          avgMatchScore: avgMatch,
          shortlists: v.shortlists,
          interviews: v.interviews,
          selections: v.selections,
          placements: v.placements,
          clientRejectionRate,
          qualityRating,
          compositeScore,
          whyThisRank,
          topRejectionReasons,
          actionableSummary,
          coachingFeedback
        };
      })
      .sort((a, b) => {
        if (a.compositeScore === null && b.compositeScore === null) return 0;
        if (a.compositeScore === null) return 1;
        if (b.compositeScore === null) return -1;
        return b.compositeScore - a.compositeScore;
      });

    // 4. Requirement Quality Summary
    const reqQualityMap = new Map<string, RequirementQualitySummary>();
    requirementsSnap.docs.forEach(doc => {
      const r = doc.data();
      reqQualityMap.set(doc.id, {
        requirementId: doc.id,
        title: r.title || `Requirement ${doc.id}`,
        clientName: r.clientName || r.company || "Client",
        status: r.status || "open",
        broadcast: r.broadcast !== false && r.broadcast !== "false",
        profilesReceived: 0,
        profilesScreened: 0,
        passed: 0,
        review: 0,
        rejected: 0,
        passRate: null,
        avgMatchScore: null,
        shortlists: 0,
        interviews: 0,
        selections: 0,
        placements: 0,
        topRejectionReasons: []
      });
    });

    const reqRejectionCounts = new Map<string, Record<string, number>>();

    for (const cand of filteredCandidates) {
      const reqId = cand.jobId || cand.requirementId;
      if (!reqId) continue;

      let rEntry = reqQualityMap.get(reqId);
      if (!rEntry) {
        const reqDoc = requirementsMap.get(reqId);
        rEntry = {
          requirementId: reqId,
          title: reqDoc?.title || cand.jobTitle || `Requirement ${reqId}`,
          clientName: reqDoc?.clientName || "Client",
          status: reqDoc?.status || "open",
          broadcast: reqDoc?.broadcast !== false && reqDoc?.broadcast !== "false",
          profilesReceived: 0,
          profilesScreened: 0,
          passed: 0,
          review: 0,
          rejected: 0,
          passRate: null,
          avgMatchScore: null,
          shortlists: 0,
          interviews: 0,
          selections: 0,
          placements: 0,
          topRejectionReasons: []
        };
        reqQualityMap.set(reqId, rEntry);
      }

      rEntry.profilesReceived++;

      const rep = reportsMap.get(cand.id);
      const res = cand.screeningResult || rep;
      const dec = res?.decision?.status || (cand.stage === "rejected" ? "REJECT" : (cand.aiMatchScore ? "PASS" : null));

      if (res || cand.aiMatchScore !== undefined || cand.aiMatchScore !== null) {
        rEntry.profilesScreened++;
        if (dec === "PASS") rEntry.passed++;
        else if (dec === "REVIEW") rEntry.review++;
        else if (dec === "REJECT") rEntry.rejected++;

        if (dec === "REJECT" || res?.decision?.rejectionReasons?.length > 0) {
          if (!reqRejectionCounts.has(reqId)) {
            reqRejectionCounts.set(reqId, {});
          }
          const counts = reqRejectionCounts.get(reqId)!;
          const reasons: string[] = res?.decision?.rejectionReasons || [];
          if (reasons.length === 0 && res?.decision?.primaryReason) reasons.push(res.decision.primaryReason);
          reasons.forEach(r => {
            const cat = categorizeReason(r);
            counts[cat] = (counts[cat] || 0) + 1;
          });
        }
      }
    }

    for (const sub of filteredSubmissions) {
      const reqId = sub.requirementId || sub.jobId;
      if (!reqId) continue;
      const rEntry = reqQualityMap.get(reqId);
      if (rEntry) {
        const st = (sub.status || "").toLowerCase();
        if (["shortlisted", "interview", "offered", "selected", "hired", "placed"].includes(st)) rEntry.shortlists++;
        if (["interview", "offered", "selected", "hired", "placed"].includes(st)) rEntry.interviews++;
        if (["offered", "selected", "hired", "placed"].includes(st)) rEntry.selections++;
        if (["hired", "placed"].includes(st)) rEntry.placements++;
      }
    }

    const requirementQualityList: RequirementQualitySummary[] = Array.from(reqQualityMap.values())
      .filter(r => r.profilesReceived > 0 || r.profilesScreened > 0)
      .map(r => {
        const passRate = r.profilesScreened > 0 ? Math.round((r.passed / r.profilesScreened) * 1000) / 10 : null;
        const rejCounts = reqRejectionCounts.get(r.requirementId) || {};
        const topRejectionReasons = Object.entries(rejCounts)
          .map(([cat, count]) => ({
            reason: categoryCounts[cat]?.label || cat,
            count
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        return {
          ...r,
          passRate,
          topRejectionReasons
        };
      })
      .sort((a, b) => b.profilesReceived - a.profilesReceived);

    // 5. Client Quality Summary
    const clientQualityMap = new Map<string, ClientQualitySummary>();
    clientsSnap.docs.forEach(doc => {
      const c = doc.data();
      clientQualityMap.set(doc.id, {
        clientId: doc.id,
        clientName: c.company || c.name || `Client ${doc.id}`,
        activeRequirements: 0,
        profilesSubmitted: 0,
        shortlisted: 0,
        interviews: 0,
        selections: 0,
        placements: 0,
        rejections: 0
      });
    });

    requirementsSnap.docs.forEach(doc => {
      const r = doc.data();
      const cId = r.clientId;
      if (cId && clientQualityMap.has(cId)) {
        if (r.status === "open" || r.status === "broadcast") {
          clientQualityMap.get(cId)!.activeRequirements++;
        }
      }
    });

    filteredSubmissions.forEach(sub => {
      const cId = sub.clientId;
      if (cId) {
        let cEntry = clientQualityMap.get(cId);
        if (!cEntry) {
          cEntry = {
            clientId: cId,
            clientName: sub.clientName || `Client ${cId}`,
            activeRequirements: 0,
            profilesSubmitted: 0,
            shortlisted: 0,
            interviews: 0,
            selections: 0,
            placements: 0,
            rejections: 0
          };
          clientQualityMap.set(cId, cEntry);
        }
        cEntry.profilesSubmitted++;
        const st = (sub.status || "").toLowerCase();
        if (["shortlisted", "interview", "offered", "selected", "hired", "placed"].includes(st)) cEntry.shortlisted++;
        if (["interview", "offered", "selected", "hired", "placed"].includes(st)) cEntry.interviews++;
        if (["offered", "selected", "hired", "placed"].includes(st)) cEntry.selections++;
        if (["hired", "placed"].includes(st)) cEntry.placements++;
        if (st === "rejected") cEntry.rejections++;
      }
    });

    const clientQualityList = Array.from(clientQualityMap.values())
      .filter(c => c.profilesSubmitted > 0 || c.activeRequirements > 0)
      .sort((a, b) => b.profilesSubmitted - a.profilesSubmitted);

    // 6. Action Center Alerts (Deterministic)
    const actionCenterAlerts: ActionCenterAlert[] = [];

    // Vendor-specific alerts
    vendorIntelligenceList.forEach(v => {
      if (v.profilesScreened >= 5 && v.passRate !== null && v.passRate < 40) {
        actionCenterAlerts.push({
          id: `alert-vnd-pass-${v.vendorId}`,
          priority: "HIGH",
          title: `Low Sourcing Pass Rate (${v.passRate}%)`,
          targetType: "VENDOR",
          targetId: v.vendorId,
          targetName: v.vendorName,
          reason: `Partner ${v.vendorName} has a low screening pass rate (${v.passRate}%) across ${v.profilesScreened} screened candidates.`,
          evidence: `${v.rejected}/${v.profilesScreened} profiles rejected. Top cause: ${v.topRejectionReasons[0]?.reason || "Technical Discrepancy"}.`,
          recommendedAction: `Issue deterministic Vendor Quality Feedback memo and request pre-screening checklist confirmation before subsequent submissions.`
        });
      }

      if (v.topRejectionReasons.some(r => r.reason === "Missing Mandatory Skills" && r.count >= 3)) {
        actionCenterAlerts.push({
          id: `alert-vnd-skills-${v.vendorId}`,
          priority: "MEDIUM",
          title: "Missing Mandatory Skills in Submissions",
          targetType: "VENDOR",
          targetId: v.vendorId,
          targetName: v.vendorName,
          reason: `Multiple submissions from ${v.vendorName} are missing critical required technologies.`,
          evidence: `${v.topRejectionReasons.find(r => r.reason === "Missing Mandatory Skills")?.count} profiles rejected for missing mandatory skills.`,
          recommendedAction: `Clarify core skill matrices with partner and remind them that mandatory skills must have documented evidence.`
        });
      }
    });

    // Requirement bottleneck alerts
    requirementQualityList.forEach(r => {
      if (r.profilesScreened >= 5 && r.passRate !== null && r.passRate < 35) {
        actionCenterAlerts.push({
          id: `alert-req-bottle-${r.requirementId}`,
          priority: "HIGH",
          title: `Requirement Calibration Bottleneck (${r.title})`,
          targetType: "REQUIREMENT",
          targetId: r.requirementId,
          targetName: r.title,
          reason: `Very low pass rate (${r.passRate}%) for ${r.title} suggests either strict screening criteria or poorly calibrated vendor broadcast.`,
          evidence: `${r.rejected}/${r.profilesScreened} profiles rejected. Top rejection reason: ${r.topRejectionReasons[0]?.reason || "Experience mismatch"}.`,
          recommendedAction: `Review mandatory experience depth and required skills with hiring manager to verify market realism.`
        });
      }
    });

    // Sourcing pool keyword-only alert
    if (keywordOnlyProfilesCount >= 5 && (keywordOnlyProfilesCount / (screenedProfiles || 1)) >= 0.25) {
      actionCenterAlerts.push({
        id: `alert-pool-keyword`,
        priority: "MEDIUM",
        title: "Elevated Keyword-Only Profile Volume",
        targetType: "SOURCING_POOL",
        reason: `${Math.round((keywordOnlyProfilesCount / screenedProfiles) * 100)}% of screened resumes contain skills without project implementation evidence.`,
        evidence: `${keywordOnlyProfilesCount} candidates flagged with L0 keyword-only skill evidence.`,
        recommendedAction: `Notify sourcing channels that resumes must detail project-level contributions and architecture context.`
      });
    }

    // 7. Quality Trends (Weekly buckets)
    const trendsMap = new Map<string, QualityTrendPoint>();
    const bucketDays = 7;
    const bucketCount = 5;

    for (let i = bucketCount - 1; i >= 0; i--) {
      const bucketEnd = new Date(end.getTime() - i * bucketDays * 24 * 60 * 60 * 1000);
      const bucketStart = new Date(bucketEnd.getTime() - bucketDays * 24 * 60 * 60 * 1000);
      const periodKey = bucketStart.toISOString().split("T")[0];
      const label = `${bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${bucketEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      trendsMap.set(periodKey, {
        period: periodKey,
        label,
        profilesReceived: 0,
        passed: 0,
        rejected: 0,
        passRate: null,
        avgMatchScore: null,
        shortlisted: 0,
        placed: 0
      });
    }

    filteredCandidates.forEach(cand => {
      const cDate = new Date(cand.createdAt || cand.created_at || Date.now());
      for (const [key, point] of trendsMap.entries()) {
        const pStart = new Date(key);
        const pEnd = new Date(pStart.getTime() + bucketDays * 24 * 60 * 60 * 1000);
        if (cDate >= pStart && cDate < pEnd) {
          point.profilesReceived++;
          const rep = reportsMap.get(cand.id);
          const res = cand.screeningResult || rep;
          const dec = res?.decision?.status || (cand.stage === "rejected" ? "REJECT" : (cand.aiMatchScore ? "PASS" : null));
          if (dec === "PASS") point.passed++;
          if (dec === "REJECT") point.rejected++;
        }
      }
    });

    filteredSubmissions.forEach(sub => {
      const sDate = new Date(sub.createdAt || sub.created_at || Date.now());
      for (const [key, point] of trendsMap.entries()) {
        const pStart = new Date(key);
        const pEnd = new Date(pStart.getTime() + bucketDays * 24 * 60 * 60 * 1000);
        if (sDate >= pStart && sDate < pEnd) {
          const st = (sub.status || "").toLowerCase();
          if (["shortlisted", "interview", "offered", "selected", "hired", "placed"].includes(st)) point.shortlisted++;
          if (["hired", "placed"].includes(st)) point.placed++;
        }
      }
    });

    const trends = Array.from(trendsMap.values()).map(p => {
      const totalDecided = p.passed + p.rejected;
      const passRate = totalDecided > 0 ? Math.round((p.passed / totalDecided) * 1000) / 10 : null;
      return {
        ...p,
        passRate
      };
    });

    return {
      dataPeriod: {
        filter: filter.dateRange || "last30days",
        start: start.toISOString(),
        end: end.toISOString(),
        formatted: label
      },
      kpis: {
        totalProfiles,
        screenedProfiles,
        passedProfiles,
        reviewProfiles,
        rejectedProfiles,
        screeningPassRate,
        averageMatchScore,
        totalSubmissions,
        clientShortlistCount,
        clientShortlistRate,
        interviewCount,
        interviewConversion,
        selectionCount,
        placementCount,
        placementConversion
      },
      rejectionDiagnostics: {
        totalRejections,
        categories: rejectionCategories,
        topReasons
      },
      experienceQuality: {
        averageTotalExperienceYears: totalExpCount > 0 ? Math.round((totalExpMonthsSum / totalExpCount / 12) * 10) / 10 : null,
        averageRelevantExperienceYears: relExpCount > 0 ? Math.round((relExpMonthsSum / relExpCount / 12) * 10) / 10 : null,
        majorDiscrepancyCount,
        discrepancyThresholdUsed: {
          minTotalYears,
          maxRelevantRatio
        },
        distribution: expDistribution
      },
      skillEvidenceQuality: {
        totalEvaluations: totalEvidenceCount,
        breakdown: skillEvidenceBreakdown,
        keywordOnlyProfilesCount,
        keywordOnlyPercentage: screenedProfiles > 0 ? Math.round((keywordOnlyProfilesCount / screenedProfiles) * 1000) / 10 : 0
      },
      vendorIntelligence: vendorIntelligenceList,
      actionCenterAlerts,
      requirementQuality: requirementQualityList,
      clientQuality: clientQualityList,
      trends
    };
  }
}

export const qualityControlService = QualityControlService.getInstance();
