import { requirementMatchParser } from "../ai/parsers/RequirementMatch.js";
import { CandidateRepository, candidateRepository } from "../repositories/CandidateRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { executeServerAITask } from "../controllers/aiGateway.js";

export class CandidateIngestionService {
  
  async submitCandidateToRequirement(vendorId: string, candidateName: string, requirementId: string, identityData: any, candidateHash?: string) {
    const db = getAdminDb();
    const existingVaultDoc = await candidateRepository.findIdentityByEmailOrPhone(identityData.email, identityData.phone);
    
    return await db.runTransaction(async (transaction) => {
      if (existingVaultDoc) {
        if (existingVaultDoc.vendorId !== vendorId) {
          return {
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
      const aiMatchScore = identityData.aiMatchScore || 75;
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

      transaction.set(db.collection("submission_ledger").doc(), {
        requirementId: reqId,
        candidateId,
        vendorId,
        submittedAt: new Date().toISOString(),
        status: "submitted",
        aiMatchScore
      });

      transaction.set(db.collection("system_events").doc(), {
        eventType: isUpdate ? "CANDIDATE_UPDATED" : "CANDIDATE_SUBMITTED",
        entityCollection: "candidates",
        entityId: candidateId,
        metadata: { vendorId, candidateName, requirementId: reqId },
        createdAt: new Date().toISOString()
      });

      return { 
        status: 200, 
        data: { 
          success: true, 
          action: isUpdate ? "UPDATED" : "CREATED",
          candidateId, 
          assignedBdm 
        } 
      };
    });
  }

  async submitToPool(vendorId: string, candidateName: string, identityData: any, resumeHash?: string) {
    const db = getAdminDb();
    const existingVaultDoc = await candidateRepository.findIdentityByEmailOrPhone(identityData.email, identityData.phone);
    
    return await db.runTransaction(async (transaction) => {
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
        transaction.update(db.collection("candidates").doc(candidateId), {
          ...identityData,
          name: candidateName,
          updatedAt: new Date().toISOString(),
          syncVersion: FieldValue.increment(1)
        });
      }

      transaction.set(db.collection("system_events").doc(), {
        eventType: "CANDIDATE_POOL_SYNCED",
        entityCollection: "candidates",
        entityId: candidateId,
        metadata: { vendorId, candidateName },
        createdAt: new Date().toISOString()
      });

      return { status: 200, data: { success: true, action: isUpdate ? "UPDATED" : "CREATED", candidateId } };
    });
  }

  async reprocessAiQueue() {
    const db = getAdminDb();
    const pendingItems = await candidateRepository.getAiReprocessingQueuePending(10);
    
    if (pendingItems.length === 0) {
      return { success: true, processedCount: 0, message: "No pending items in the AI reprocessing queue." };
    }
    
    let processedCount = 0;
    let successCount = 0;
    let failCount = 0;

    for (const queueData of pendingItems) {
      const { candidateId, candidateName, vendorId, candidateHash, identityData, attempts, id: queueDocId } = queueData;
      processedCount++;

      let parsedTitle = identityData?.current_title || identityData?.currentTitle || "Software Engineer";
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
        console.error(`AI Gateway reprocessing failed for candidate ${candidateId}:`, err);
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
