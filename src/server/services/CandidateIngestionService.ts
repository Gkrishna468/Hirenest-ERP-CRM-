import { submissionService } from "./SubmissionService.js";
import { requirementMatchParser } from "../ai/parsers/RequirementMatch.js";
import { CandidateRepository, candidateRepository } from "../repositories/CandidateRepository.js";
import { getAdminDb } from "../utils/firebaseAdmin.js";
import { DomainEventPublisher } from "../events/DomainEventPublisher.js";
import { FieldValue } from "firebase-admin/firestore";
import { executeServerAITask } from "../controllers/aiGateway.js";
import { resumeParser } from "../ai/parsers/ResumeParser.js";

// Strict Deterministic Screening Engine Imports
import { DocumentIntelligenceService } from "./document/DocumentIntelligenceService.js";
import { PureResumeParser } from "./screening/PureResumeParser.js";
import { ExperienceCalculator } from "./screening/ExperienceCalculator.js";
import { SkillEvidenceEngine } from "./screening/SkillEvidenceEngine.js";
import { TimelineConsistencyEngine } from "./screening/TimelineConsistencyEngine.js";
import { ScreeningProfileService } from "./screening/ScreeningProfileService.js";
import { PureMatchingEngine } from "./screening/PureMatchingEngine.js";
import { ScreeningDecisionEngine } from "./screening/ScreeningDecisionEngine.js";
import { ScreeningReportService } from "./screening/ScreeningReportService.js";
import { ScreeningAuditService } from "./screening/ScreeningAuditService.js";
import { LinkedInVerification } from "./screening/LinkedInVerification.js";

export class CandidateIngestionService {
  /**
   * Primary Entry Point for Candidate File Upload & Strict Deterministic Screening
   */
  async ingestCandidateFile(
    vendorId: string,
    requirementId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    isPool: boolean = false,
    source: string = "Vendor"
  ) {
    console.log("[IngestService] Starting strict deterministic screening for:", fileName, "Size:", fileBuffer?.length);
    try {
      // 1. File Validation (.pdf and .docx only)
      const isDocx = fileName.toLowerCase().endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isPdf = fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

      if (!isDocx && !isPdf) {
        return { 
          status: 400, 
          data: { 
            success: false, 
            error: "Unsupported file format. Only PDF and DOCX documents are accepted." 
          } 
        };
      }

      // 2. Document Extraction & OCR Quality Check
      const docResult = await DocumentIntelligenceService.extractDocument(fileBuffer, fileName, mimeType);
      if (!docResult.normalizedText || docResult.normalizedText.length < 40) {
        return {
          status: 400,
          data: {
            success: false,
            error: "Unable to extract readable text from resume. Please ensure the PDF or DOCX is not password-protected or empty."
          }
        };
      }

      // 3. Pure Deterministic Parsing (Offline & Non-LLM)
      const parsedResume = PureResumeParser.parse(docResult.normalizedText, fileName);

      // 4. Fetch Requirement Context (if linked)
      let requirementDoc: any = null;
      if (!isPool) {
        if (!requirementId || requirementId === "UNKNOWN" || requirementId === "POOL" || requirementId === "GENERAL") {
          return {
            status: 400,
            data: {
              success: false,
              error: "Submission Block: Every candidate submission must have a valid requirementId."
            }
          };
        }
        try {
          requirementDoc = await candidateRepository.getRequirement(requirementId);
        } catch (e) {
          console.warn("[IngestService] Could not fetch requirement doc:", e);
        }
        if (!requirementDoc) {
          return {
            status: 400,
            data: {
              success: false,
              error: `Submission Block: The provided requirementId "${requirementId}" is invalid or does not exist.`
            }
          };
        }
      } else {
        if (requirementId && requirementId !== "UNKNOWN" && requirementId !== "POOL") {
          try {
            requirementDoc = await candidateRepository.getRequirement(requirementId);
          } catch (e) {
            console.warn("[IngestService] Could not fetch requirement doc:", e);
          }
        }
      }

      // 5. Build Screening Profile
      const screeningProfile = ScreeningProfileService.getProfileForRequirement(requirementDoc);

      // 6. Experience Calculation (Total vs Relevant)
      const experienceBreakdown = ExperienceCalculator.calculate(
        parsedResume,
        screeningProfile.requiredSkills
      );

      // 7. Evidence Level Validation (0 to 4)
      const evidenceEvaluation = SkillEvidenceEngine.evaluateSkillsEvidence(
        parsedResume,
        screeningProfile.requiredSkills,
        screeningProfile.criticalSkills
      );

      // 8. Timeline Inconsistency & Risk Checks
      const consistencyEvaluation = TimelineConsistencyEngine.evaluate(parsedResume);

      // 9. LinkedIn Verification State
      const linkedinState = LinkedInVerification.createInitialState(parsedResume.linkedinUrl);

      // 10. Pure Matching Engine Score Calculation
      const matchResult = PureMatchingEngine.evaluate(
        parsedResume,
        evidenceEvaluation,
        experienceBreakdown,
        screeningProfile,
        requirementDoc?.location,
        requirementDoc?.noticePeriodDays
      );

      // 11. Screening Decision (PASS / REVIEW / REJECT)
      const screeningDecision = ScreeningDecisionEngine.evaluate(
        matchResult,
        evidenceEvaluation,
        consistencyEvaluation,
        experienceBreakdown,
        screeningProfile,
        docResult.extractionQuality
      );

      // 12. Create Comprehensive Candidate Screening Report
      const screeningReport = ScreeningReportService.createReport(
        parsedResume,
        docResult,
        evidenceEvaluation,
        experienceBreakdown,
        consistencyEvaluation,
        matchResult,
        screeningDecision,
        linkedinState,
        requirementDoc
      );

      const candidateName = parsedResume.name || fileName.replace(/\.[^/.]+$/, "");
      const candidateHash = DocumentIntelligenceService.computeIdentityHash(candidateName, parsedResume.email, parsedResume.phone);

      const identityPayload = {
        name: candidateName,
        email: parsedResume.email,
        phone: parsedResume.phone,
        location: parsedResume.location,
        currentTitle: parsedResume.currentTitle,
        currentCompany: parsedResume.currentCompany,
        experience: experienceBreakdown.totalExperienceFormatted,
        totalExperienceMonths: experienceBreakdown.totalExperienceMonths,
        totalExperienceFormatted: experienceBreakdown.totalExperienceFormatted,
        relevantExperienceMonths: experienceBreakdown.relevantExperienceMonths,
        relevantExperienceFormatted: experienceBreakdown.relevantExperienceFormatted,
        skillExperienceMap: experienceBreakdown.skillExperienceMap,
        skills: parsedResume.skills,
        primarySkills: parsedResume.primarySkills,
        noticePeriod: parsedResume.noticePeriod,
        currentCTC: parsedResume.currentCTC,
        expectedCTC: parsedResume.expectedCTC,
        linkedinUrl: parsedResume.linkedinUrl,
        linkedinVerification: linkedinState,
        resumeHash: docResult.fileHash,
        candidateHash,
        source,
        // Deterministic Screening Results
        screeningReportId: screeningReport.screeningId,
        screeningResult: {
          passed: screeningDecision.status === "PASS",
          status: screeningDecision.status,
          overallScore: screeningReport.overallScore,
          riskScore: consistencyEvaluation.riskScore,
          summary: screeningDecision.primaryReason,
          rejectionReasons: screeningDecision.rejectionReasons,
          reviewFlags: screeningDecision.reviewFlags,
          scoreBreakdown: matchResult.breakdown,
          evidenceScore: evidenceEvaluation.overallEvidenceScore,
          checks: [
            { 
              name: "Mandatory Identity & Contact", 
              passed: !!(parsedResume.name && (parsedResume.email || parsedResume.phone)), 
              score: 95, 
              detail: `Extracted name, email (${parsedResume.email || 'N/A'}), phone (${parsedResume.phone || 'N/A'}).` 
            },
            { 
              name: "Technical Skill Depth", 
              passed: matchResult.missingCriticalSkills.length === 0, 
              score: matchResult.breakdown.skills.percentage, 
              detail: `Matched ${matchResult.matchedSkills.length}/${screeningProfile.requiredSkills.length} required skills.` 
            },
            { 
              name: "Relevant Hands-on Experience", 
              passed: experienceBreakdown.relevantExperienceMonths >= (screeningProfile.minimumRelevantExperienceMonths || 12), 
              score: matchResult.breakdown.relevantExperience.percentage, 
              detail: `${experienceBreakdown.relevantExperienceFormatted} verified hands-on domain experience.` 
            },
            { 
              name: "Project Implementation Evidence", 
              passed: !evidenceEvaluation.isKeywordOnlyProfile, 
              score: evidenceEvaluation.overallEvidenceScore, 
              detail: evidenceEvaluation.isKeywordOnlyProfile ? "Keywords listed without implementation context" : "Documented production project evidence." 
            },
            { 
              name: "Timeline & Career Stability", 
              passed: !consistencyEvaluation.hasCriticalInconsistencies, 
              score: 100 - consistencyEvaluation.riskScore, 
              detail: consistencyEvaluation.hasCriticalInconsistencies ? "Chronology conflict flagged" : "Consistent employment timeline." 
            },
            { 
              name: "Document & Profile Quality", 
              passed: docResult.extractionQuality !== "DOCUMENT_QUALITY_REVIEW", 
              score: docResult.extractionQuality === "HIGH" ? 95 : 75, 
              detail: `Extraction quality: ${docResult.extractionQuality} (${docResult.ocrInfo.ocrUsed ? 'OCR processed' : 'Direct digital text'}).` 
            }
          ],
          skillEvidenceMap: evidenceEvaluation.skillEvidenceMap
        },
        aiMatchScore: isPool ? null : matchResult.overallScore,
        aiStatus: "screened"
      };

      // 13. Persist Candidate Record
      let result: any;
      if (isPool) {
        result = await this.submitToPool(vendorId, candidateName, identityPayload, docResult.fileHash);
      } else {
        result = await this.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityPayload, candidateHash);
      }

      // 14. Record Audit Event to Ledger and Screening Collections
      if (result?.data?.candidateId) {
        await ScreeningAuditService.recordScreening(
          result.data.candidateId,
          screeningReport,
          vendorId
        );
      }

      // 15. Attach screening decision & report to response
      if (result?.data) {
        result.data.screeningDecision = screeningDecision;
        result.data.screeningReport = screeningReport;
        result.data.screeningScore = matchResult.overallScore;
        result.data.status = screeningDecision.status;
      }

      return result;
    } catch (e: any) {
      console.log("ERROR:", "[CandidateIngestionService.ingestCandidateFile] Error:", e);
      return { status: 500, data: { success: false, error: e.message } };
    }
  }

  async submitCandidateToRequirement(vendorId: string, candidateName: string, requirementId: string, identityData: any, candidateHash?: string) {
    const db = getAdminDb();
    const existingVaultDoc = await candidateRepository.findIdentityByEmailOrPhone(identityData.email, identityData.phone);
    
    console.log("[IngestService] Running Transaction for Identity/Candidate...");
    const txResult = await db.runTransaction(async (transaction) => {
      if (existingVaultDoc) {
        if (existingVaultDoc.vendorId !== vendorId) {
          return {
            _conflict: true,
            status: 409,
            data: { 
              duplicate: true,
              reason: "OWNERSHIP_CONFLICT",
              ownerVendorId: existingVaultDoc.vendorId,
              action: "manual_review_required",
              message: `Ownership Conflict: This candidate is already registered by another partner.` 
            }
          };
        }
      }

      let jobTitle = "General Talent Pool";
      const reqId = requirementId || "UNKNOWN";
      if (reqId !== "UNKNOWN") {
        const jobDoc = await candidateRepository.getRequirement(reqId, transaction);
        if (jobDoc) {
          jobTitle = jobDoc.title || "Sourced Role";
        }
      }

      const assignedBdm = "Ravi"; 
      const aiMatchScore = identityData.aiMatchScore ?? identityData.screeningResult?.overallScore ?? null;
      const skillsList = identityData.skills || [];

      let candidateId = existingVaultDoc?.candidateId;
      const isUpdate = !!candidateId;

      if (isUpdate) {
        const candRef = db.collection("candidates").doc(candidateId);
        transaction.update(candRef, {
          ...identityData,
          name: candidateName,
          updatedAt: new Date().toISOString(),
          lastSubmissionRequirementId: reqId,
          syncVersion: FieldValue.increment(1)
        });
      } else {
        const candRef = db.collection("candidates").doc();
        candidateId = candRef.id;
        transaction.set(candRef, {
          name: candidateName,
          vendorId: vendorId,
          stage: "submission",
          created_at: new Date().toISOString(),
          assignedBdm,
          aiMatchScore,
          skills: skillsList,
          candidateHash: candidateHash || "NO_HASH",
          ...identityData
        });

        const identities = [];
        if (identityData.email) identities.push(identityData.email.trim().toLowerCase());
        if (identityData.phone) identities.push(identityData.phone.replace(/[^0-9]/g, ''));

        transaction.set(db.collection("candidate_identity_vault").doc(), {
          identities,
          vendorId,
          candidateId,
          createdAt: new Date().toISOString()
        });
      }
      return { candidateId, isUpdate, reqId, assignedBdm, aiMatchScore, skillsList, candidateName };
    });

    if (txResult._conflict) {
      return { status: txResult.status, data: txResult.data };
    }

    const candidateId = txResult.candidateId;
    const isUpdate = txResult.isUpdate;
    const reqId = txResult.reqId;
    const assignedBdm = txResult.assignedBdm;
    const aiMatchScore = txResult.aiMatchScore;
    const skillsList = txResult.skillsList;
    
    const dbAdmin = getAdminDb();
    
    const matchRef = await dbAdmin.collection("matches").add({
      requirementId: reqId,
      candidateId: candidateId,
      candidateName: candidateName,
      vendorId: vendorId,
      score: aiMatchScore,
      skills: skillsList,
      status: "Screened",
      createdAt: new Date().toISOString(),
      bdmMandate: assignedBdm,
      source: "Vendor Workspace"
    });

    await submissionService.create({
      requirementId: reqId,
      candidateId: candidateId,
      vendorId: vendorId,
      matchId: matchRef.id,
      status: "Submitted",
      createdAt: new Date().toISOString()
    }, vendorId, { workspace: "Vendor", vendorId });

    await DomainEventPublisher.publishDomainEvent({
      type: "CANDIDATE_SUBMITTED",
      aggregateType: "Candidate",
      aggregateId: candidateId,
      actorId: vendorId,
      actorRole: "Vendor",
      sourceApp: "OS",
      sourceWorkspace: "Vendor",
      organizationId: "bootstrap-org",
      payload: { requirementId: reqId, vendorId, matchScore: aiMatchScore }
    });

    return { 
      status: 200, 
      data: { 
        success: true, 
        action: isUpdate ? "UPDATED_AND_SUBMITTED" : "CREATED_AND_SUBMITTED", 
        candidateId, 
        assignedBdm 
      } 
    };
  }

  async submitToPool(vendorId: string, candidateName: string, identityData: any, resumeHash?: string) {
    const db = getAdminDb();
    const existingVaultDoc = await candidateRepository.findIdentityByEmailOrPhone(identityData.email, identityData.phone);
    
    const txResult = await db.runTransaction(async (transaction) => {
      if (existingVaultDoc && existingVaultDoc.vendorId !== vendorId) {
        return {
          status: 409,
          data: { 
            duplicate: true,
            reason: "OWNERSHIP_CONFLICT",
            message: "Candidate ownership belongs to another partner." 
          }
        };
      }

      let candidateId = existingVaultDoc?.candidateId;
      const isUpdate = !!candidateId;

      if (!isUpdate) {
        const candRef = db.collection("candidates").doc();
        candidateId = candRef.id;
        transaction.set(candRef, {
          name: candidateName,
          vendorId,
          stage: "Available",
          created_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...identityData
        });

        const identities = [];
        if (identityData.email) identities.push(identityData.email.trim().toLowerCase());
        if (identityData.phone) identities.push(identityData.phone.replace(/[^0-9]/g, ''));

        transaction.set(db.collection("candidate_identity_vault").doc(), {
          identities,
          vendorId,
          candidateId,
          createdAt: new Date().toISOString()
        });
      } else {
        const candRef = db.collection("candidates").doc(candidateId);
        transaction.update(candRef, {
          ...identityData,
          name: candidateName,
          updatedAt: new Date().toISOString(),
          syncVersion: FieldValue.increment(1)
        });
      }

      return {
        status: 200,
        data: {
          success: true,
          action: isUpdate ? "UPDATED_IN_POOL" : "ADDED_TO_POOL",
          candidateId
        }
      };
    });

    return txResult;
  }

  async reprocessAiQueue(limitCount: number = 10) {
    const db = getAdminDb();
    const queueSnapshot = await db
      .collection("ai_reprocessing_queue")
      .where("status", "in", ["pending", "retrying"])
      .limit(limitCount)
      .get();

    if (queueSnapshot.empty) {
      return { success: true, processedCount: 0, message: "Queue is empty." };
    }

    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    for (const doc of queueSnapshot.docs) {
      processedCount++;
      const queueItem = doc.data();
      const queueDocId = doc.id;
      const { candidateId, candidateName, vendorId, attempts, identityData } = queueItem;

      let parsedTitle = identityData?.title || "Software Professional";
      let parsedSkills = identityData?.skills || [];
      let parsedSummary = identityData?.cover_note || "Talent Pool asset available for redeployment.";
      let fraudDetected = false;
      let aiPassed = false;

      try {
        const extractionPrompt = `
          Act as the Staffing Intelligence Analyzer for HireNestOS.
          Extract key parameters from this candidate profile.

          CANDIDATE:
          Name: ${candidateName}
          Title: ${parsedTitle}
          Skills: ${JSON.stringify(parsedSkills)}
          Notes: ${identityData?.cover_note || ""}

          TASK:
          1. Suggest the best standardized Technical Job Title.
          2. Extract skills list as a JSON array of strings.
          3. Formulate a 2-3 sentence professional summary / profile highlights.
          4. Detect potential fraud markers (return true or false).

          RETURN ONLY VALID JSON:
          {
            "standardizedTitle": "e.g. Senior React Developer",
            "skills": ["skill1", "skill2"],
            "summary": "Summary text",
            "fraudDetected": false
          }
        `;

        const gatewayResult = await executeServerAITask({
          action: "candidate-reprocessing",
          prompt: extractionPrompt,
          responseFormatJson: true,
          complexity: "simple"
        });

        const cleanText = (gatewayResult.text || "")
          .replace(/\`\`\`json|\`\`\`/g, "")
          .trim();
        const parsed = JSON.parse(cleanText);

        if (parsed.standardizedTitle) parsedTitle = parsed.standardizedTitle;
        if (Array.isArray(parsed.skills)) parsedSkills = parsed.skills;
        if (parsed.summary) parsedSummary = parsed.summary;
        if (parsed.fraudDetected !== undefined) fraudDetected = !!parsed.fraudDetected;
        aiPassed = true;
      } catch (err) {
        console.log("ERROR:", `AI Gateway reprocessing failed for candidate ${candidateId}:`, err);
      }

      const batch = db.batch();
      const queueDocRef = db.collection("ai_reprocessing_queue").doc(queueDocId);
      const candRef = db.collection("candidates").doc(candidateId);
      const telRef = db.collection("ingestion_telemetry").doc("overall");

      if (aiPassed) {
        successCount++;
        batch.update(candRef, {
          currentTitle: parsedTitle,
          skills: parsedSkills,
          notes: parsedSummary,
          fraudDetected,
          aiStatus: "parsed",
          updatedAt: new Date().toISOString()
        });
        batch.update(queueDocRef, {
          status: "completed",
          updatedAt: new Date().toISOString()
        });
        batch.set(telRef, {
          retryQueueSize: FieldValue.increment(-1),
          reprocessSuccessCount: FieldValue.increment(1)
        }, { merge: true });

        const sysEventRef = db.collection("system_events").doc();
        batch.set(sysEventRef, {
          type: "CANDIDATE_REPROCESSED_SUCCESS",
          message: `AI Reprocessing successfully enriched Candidate ${candidateName} (ID: ${candidateId}).`,
          timestamp: new Date().toISOString(),
          entityType: "candidate",
          entityId: candidateId,
          role: "system",
          data: { candidateName, vendorId, standardizedTitle: parsedTitle }
        });
      } else {
        failCount++;
        const nextAttempts = (attempts || 0) + 1;
        if (nextAttempts >= 3) {
          batch.update(queueDocRef, {
            status: "failed",
            attempts: nextAttempts,
            updatedAt: new Date().toISOString()
          });
          batch.set(telRef, {
            retryQueueSize: FieldValue.increment(-1),
            reprocessFailCount: FieldValue.increment(1)
          }, { merge: true });
          batch.update(candRef, { aiStatus: "failed" });
        } else {
          batch.update(queueDocRef, {
            attempts: nextAttempts,
            updatedAt: new Date().toISOString()
          });
        }
      }
      await batch.commit();
    }

    return {
      success: true,
      processedCount,
      successCount,
      failCount,
      message: `Processed ${processedCount} queue items. Successes: ${successCount}, Failures: ${failCount}`
    };
  }

  async triggerAiRotation(vendorId: string) {
    const db = getAdminDb();
    const pool = await candidateRepository.getAvailableCandidatesForVendor(vendorId);
    
    if (pool.length === 0) {
      return { success: true, matches: [], message: "No active available candidates in your pool to rotate." };
    }

    const requirements = await candidateRepository.getActiveRequirements();
    if (requirements.length === 0) {
      return { success: true, matches: [], message: "No active job requirements found for matching." };
    }

    const matches: any[] = [];
    
    for (const candidate of pool) {
      for (const reqItem of requirements) {
        const candSkills = candidate.skills || [];
        const reqSkills = reqItem.skills || [];
        let score = 0;
        try {
          const aiMatch = await requirementMatchParser.match(candidate, reqItem);
          score = aiMatch.score;
        } catch (error) {
          console.warn("[CandidateIngestionService] AI match failed, falling back to basic matching", error);
          const overlap = candSkills.filter((s: string) => 
            reqSkills.some((rs: string) => rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase()))
          );
          score = Math.round((overlap.length / Math.max(reqSkills.length, 1)) * 100);
          if (score < 40 && reqItem.title && candidate.currentTitle && reqItem.title.toLowerCase().includes(candidate.currentTitle.toLowerCase())) {
            score += 45;
          }
        }

        if (score > 60) {
          const assignmentRef = await db.collection("candidate_assignments").add({
            candidateId: candidate.id,
            requirementId: reqItem.id,
            assignedBy: "AI_ROTATION_ENGINE",
            assignedAt: new Date().toISOString(),
            status: "Proposed",
            score: Math.min(score, 100)
          });

          await db.collection("candidate_activity").add({
            candidateId: candidate.id,
            activityType: "ROTATION_MATCHED",
            performedBy: "AI_ROTATION_ENGINE",
            description: `Candidate automatically matched and proposed to Requirement: "${reqItem.title}" (Match Score: ${score}%).`,
            timestamp: new Date().toISOString()
          });

          await db.collection("system_events").add({
            type: "CANDIDATE_ROTATION_PROPOSED",
            message: `AI Rotation Engine proposed Candidate ${candidate.name} for Requirement ${reqItem.title} with match score ${score}%.`,
            timestamp: new Date().toISOString(),
            entityType: "candidate_assignment",
            entityId: assignmentRef.id,
            role: "system",
            data: {
              candidateId: candidate.id,
              requirementId: reqItem.id,
              score
            }
          });

          matches.push({
            candidateId: candidate.id,
            candidateName: candidate.name,
            requirementId: reqItem.id,
            requirementTitle: reqItem.title,
            score: Math.min(score, 100)
          });
        }
      }
    }

    const vendorData = await candidateRepository.getVendor(vendorId);
    if (vendorData) {
      const newScore = Math.min((vendorData.performanceScore || 85) + 3, 100);
      await db.collection("vendors").doc(vendorId).update({
        performanceScore: newScore,
        lastRotationTime: new Date().toISOString()
      });
    }

    return {
      success: true,
      matches,
      message: `Successfully executed AI Candidate Rotation. Proposed ${matches.length} matches.`
    };
  }

  async validateCandidates(candidateIds: string[], vendorId: string) {
    const db = getAdminDb();
    
    for (const id of candidateIds) {
      const avail = await candidateRepository.getCandidateAvailability(id);
      if (avail) {
        await db.collection("candidate_availability").doc(avail.id).update({
          lastCheckedAt: new Date().toISOString()
        });
      } else {
        await db.collection("candidate_availability").add({
          candidateId: id,
          status: "Available",
          noticePeriod: "Immediate",
          lastCheckedAt: new Date().toISOString()
        });
      }

      await db.collection("candidate_activity").add({
        candidateId: id,
        activityType: "MONTHLY_VALIDATION",
        performedBy: vendorId,
        description: `Vendor manually validated candidate freshness and active availability.`,
        timestamp: new Date().toISOString()
      });

      await db.collection("candidates").doc(id).update({
        updatedAt: new Date().toISOString()
      });
    }

    const vendorData = await candidateRepository.getVendor(vendorId);
    if (vendorData) {
      const currentScore = vendorData.performanceScore || 85;
      const currentRate = vendorData.responseRate || 90;
      await db.collection("vendors").doc(vendorId).update({
        performanceScore: Math.min(currentScore + 4, 100),
        responseRate: Math.min(currentRate + 2, 100),
        lastValidationTime: new Date().toISOString()
      });
    }

    await db.collection("system_events").add({
      type: "VENDOR_COMPLIANCE_VALIDATED",
      message: `Vendor ${vendorId} validated freshness for ${candidateIds.length} candidate profiles in their Talent Pool.`,
      timestamp: new Date().toISOString(),
      entityType: "vendor",
      entityId: vendorId,
      role: "vendor",
      data: {
        count: candidateIds.length
      }
    });

    return {
      success: true,
      message: `Successfully validated ${candidateIds.length} profiles and updated vendor compliance metrics.`
    };
  }
}

export const candidateIngestionService = new CandidateIngestionService();
