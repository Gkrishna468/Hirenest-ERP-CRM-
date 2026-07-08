import { VercelRequest, VercelResponse } from "@vercel/node";
import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { executeServerAITask } from "./aiGateway.js";
dotenv.config();

let db: Firestore | null = null;
let adminApp: any = null;

if (!getApps()?.length) {
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: projectId,
      });
    }
    db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    console.error("Firebase initialization error", error);
  }
} else {
  adminApp = getApps()[0];
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);
  } catch(err) {
    db = getFirestore(adminApp);
  }
}

// Initialize Cloud AI Client
const apiKey = (process.env.GEMINI_API_KEY || "").replace(/^"|"$/g, "").replace(/^'|'$/g, "");
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

export function fallbackExtractData(candidateName: string, identityData: any) {
  let title = identityData.current_title || identityData.currentTitle || "Software Engineer";
  let skills: string[] = identityData.skills || [];
  let summary = identityData.cover_note || "Vetted talent pool candidate registered for active rotation.";
  let fraud = false;

  const textToScan = `${candidateName} ${title} ${JSON.stringify(skills)} ${identityData.cover_note || ""} ${identityData.resume_url || ""}`.toLowerCase();

  // Basic skills extraction (safe)
  const commonSkills = [
    "React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "AWS", "Docker", "Kubernetes", "SQL",
    "PostgreSQL", "MongoDB", "Express", "Next.js", "Redux", "Tailwind", "Git", "DevOps", "CI/CD", "Angular",
    "Vue", "Spring Boot", "Django", "FastAPI", "Go", "Rust", "C++", "C#", "Azure", "GCP", "HTML", "CSS"
  ];

  if (skills.length === 0) {
    for (const skill of commonSkills) {
      if (textToScan.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }
  }

  // Prevent empty skills
  if (skills.length === 0) {
    skills = ["Software Engineering", "Full Stack Development"];
  }

  // Safe parameters extraction
  const noticePeriod = identityData.notice_period || identityData.noticePeriod || "Immediate";
  const location = identityData.location || "Bengaluru";
  const experience = identityData.experience || "Not Specified";

  // Obvious test emails or dummy numbers can be flagged as fraud, but avoid high-confidence fraud claims
  const email = (identityData.email || "").toLowerCase();
  const phone = (identityData.phone || "");
  if (email.includes("test@") || email.includes("example.com") || phone.includes("1234567890")) {
    fraud = true;
  }

  return { title, skills, summary, fraud, noticePeriod, location, experience };
}

// Helper for reliable identity resolution
async function resolveIdentity(db: Firestore, identityData: any) {
  const email = (identityData.email || "").trim().toLowerCase();
  const phone = (identityData.phone || "").replace(/[^0-9]/g, '');

  if (!email && !phone) return null;

  // Search vault by email or phone
  const identities = [];
  if (email) identities.push(email);
  if (phone) identities.push(phone);

  const vaultQuery = await db.collection("candidate_identity_vault")
    .where("identities", "array-contains-any", identities)
    .limit(1)
    .get();

  if (!vaultQuery.empty) {
    return { id: vaultQuery.docs[0].id, ...vaultQuery.docs[0].data() } as any;
  }

  return null;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.query;

  if (action === "submitVendorCandidate") {
    try {
      if (!db) throw new Error("Database not initialized");

      const { candidateHash, vendorId, candidateName, requirementId, identityData } = req.body;

      if (!vendorId || !candidateName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1. Resolve Identity (Law 2: SSOT)
      const existingVaultDoc = await resolveIdentity(db, identityData);

      // 2. FIRESTORE TRANSACTION FLOW
      const result = await db.runTransaction(async (transaction) => {
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

        // Fetch Requirement
        let jobTitle = "General Talent Pool";
        const reqId = requirementId || "UNKNOWN";
        if (reqId !== "UNKNOWN") {
          const jobDoc = await transaction.get(db.collection("requirements_private").doc(reqId));
          if (jobDoc.exists) {
            jobTitle = (jobDoc.data() as any)?.title || "Sourced Role";
          }
        }

        const assignedBdm = "Ravi"; 
        const aiMatchScore = identityData.aiMatchScore || 75;
        const skillsList = identityData.skills || [];

        let candidateId = existingVaultDoc?.candidateId;
        const isUpdate = !!candidateId;

        if (isUpdate) {
          // Update Existing Candidate
          const candRef = db.collection("candidates").doc(candidateId);
          transaction.update(candRef, {
            ...identityData,
            name: candidateName,
            updatedAt: new Date().toISOString(),
            lastSubmissionRequirementId: reqId,
            syncVersion: FieldValue.increment(1)
          });
        } else {
          // Create New Candidate
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

          // Create Vault Entry
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

        // Create Submission Record
        transaction.set(db.collection("submission_ledger").doc(), {
          requirementId: reqId,
          candidateId,
          vendorId,
          submittedAt: new Date().toISOString(),
          status: "submitted",
          aiMatchScore
        });

        // Emit Ledger Event
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

      return res.status(result.status).json(result.data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  } else if (action === "submitVendorCandidatePool") {
    try {
      if (!db) throw new Error("Database not initialized");

      const { vendorId, candidateName, identityData, resumeHash } = req.body;

      if (!vendorId || !candidateName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1. Resolve Identity
      const existingVaultDoc = await resolveIdentity(db, identityData);

      const result = await db.runTransaction(async (transaction) => {
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

        // Update Pool
        transaction.set(db.collection("vendor_candidate_pool").doc(candidateId), {
          ...identityData,
          name: candidateName,
          vendorId,
          candidateId,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Emit Ledger Event
        transaction.set(db.collection("system_events").doc(), {
          eventType: "CANDIDATE_POOL_SYNCED",
          entityCollection: "vendor_candidate_pool",
          entityId: candidateId,
          metadata: { vendorId, candidateName },
          createdAt: new Date().toISOString()
        });

        return { status: 200, data: { success: true, action: isUpdate ? "UPDATED" : "CREATED", candidateId } };
      });

      return res.status(result.status).json(result.data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  } else if (action === "reprocessAiQueue") {
    try {
      if (!db) throw new Error("Database not initialized");

      // Fetch pending items from queue
      const queueQuery = await db.collection("ai_reprocessing_queue")
        .where("status", "==", "pending")
        .limit(10) // Process in batches of 10 to keep API limits safe
        .get();

      if (queueQuery.empty) {
        return res.status(200).json({ success: true, processedCount: 0, message: "No pending items in the AI reprocessing queue." });
      }

      let processedCount = 0;
      let successCount = 0;
      let failCount = 0;

      for (const queueDoc of queueQuery.docs) {
        const queueData = queueDoc.data();
        const { candidateId, candidateName, vendorId, candidateHash, identityData, attempts } = queueData;

        processedCount++;

        // Execute Cloud AI
        let parsedTitle = identityData.current_title || identityData.currentTitle || "Software Engineer";
        let parsedSkills = identityData.skills || [];
        let parsedSummary = identityData.cover_note || "Talent Pool asset available for redeployment.";
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
            Notes: ${identityData.cover_note || ""}

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
        const queueDocRef = db.collection("ai_reprocessing_queue").doc(queueDoc.id);
        const candRef = db.collection("candidates").doc(candidateId);
        
        const poolQuery = await db.collection("vendor_candidate_pool")
          .where("candidateId", "==", candidateId)
          .limit(1)
          .get();

        const telRef = db.collection("ingestion_telemetry").doc("overall");

        if (aiPassed) {
          successCount++;
          // Update candidate as parsed
          batch.update(candRef, {
            currentTitle: parsedTitle,
            skills: parsedSkills,
            notes: parsedSummary,
            fraudDetected,
            aiStatus: "parsed",
            updatedAt: new Date().toISOString()
          });

          // Update vendor pool
          if (!poolQuery.empty) {
            batch.update(db.collection("vendor_candidate_pool").doc(poolQuery.docs[0].id), {
              currentTitle: parsedTitle,
              skills: parsedSkills,
              notes: parsedSummary,
              fraudDetected,
              aiStatus: "parsed",
              updatedAt: new Date().toISOString()
            });
          }

          // Mark queue item as completed
          batch.update(queueDocRef, {
            status: "completed",
            updatedAt: new Date().toISOString()
          });

          // Update Telemetry
          batch.set(telRef, {
            retryQueueSize: FieldValue.increment(-1),
            reprocessSuccessCount: FieldValue.increment(1)
          }, { merge: true });

          // Ledger event
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
            // Permanently fail this queue doc
            batch.update(queueDocRef, {
              status: "failed",
              attempts: nextAttempts,
              updatedAt: new Date().toISOString()
            });
            batch.set(telRef, {
              retryQueueSize: FieldValue.increment(-1),
              reprocessFailCount: FieldValue.increment(1)
            }, { merge: true });

            // Mark candidate aiStatus as failed
            batch.update(candRef, { aiStatus: "failed" });
            if (!poolQuery.empty) {
              batch.update(db.collection("vendor_candidate_pool").doc(poolQuery.docs[0].id), { aiStatus: "failed" });
            }
          } else {
            // Keep pending, increment attempts
            batch.update(queueDocRef, {
              attempts: nextAttempts,
              updatedAt: new Date().toISOString()
            });
          }
        }

        await batch.commit();
      }

      return res.status(200).json({
        success: true,
        processedCount,
        successCount,
        failCount,
        message: `Processed ${processedCount} queue items. Successes: ${successCount}, Failures: ${failCount}`
      });

    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  } else if (action === "triggerAiRotation") {
    try {
      if (!db) throw new Error("Database not initialized");

      const { vendorId } = req.body;
      if (!vendorId) {
        return res.status(400).json({ error: "Missing vendorId" });
      }

      // Fetch all "Available" candidates in vendor_candidate_pool for this vendor
      const poolQuery = await db.collection("vendor_candidate_pool")
        .where("vendorId", "==", vendorId)
        .where("stage", "==", "Available")
        .get();

      if (poolQuery.empty) {
        return res.status(200).json({ success: true, matches: [], message: "No active available candidates in your pool to rotate." });
      }

      // Fetch active requirements
      const reqQuery = await db.collection("requirements_private").get();
      const requirements: any[] = [];
      reqQuery.forEach(doc => {
        requirements.push({ id: doc.id, ...doc.data() });
      });

      const pubQuery = await db.collection("requirements_public").get();
      pubQuery.forEach(doc => {
        requirements.push({ id: doc.id, ...doc.data() });
      });

      if (requirements.length === 0) {
        return res.status(200).json({ success: true, matches: [], message: "No active job requirements found for matching." });
      }

      const matches: any[] = [];

      // Run rotation matcher for each candidate
      for (const candDoc of poolQuery.docs) {
        const candidate = { id: candDoc.id, ...candDoc.data() as any };

        for (const reqItem of requirements) {
          const candSkills = candidate.skills || [];
          const reqSkills = reqItem.skills || [];
          const overlap = candSkills.filter((s: string) => 
            reqSkills.some((rs: string) => rs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(rs.toLowerCase()))
          );

          let score = Math.round((overlap.length / Math.max(reqSkills.length, 1)) * 100);
          if (score < 40) {
            if (reqItem.title && candidate.currentTitle && reqItem.title.toLowerCase().includes(candidate.currentTitle.toLowerCase())) {
              score += 45;
            }
          }

          // If a solid candidate rotation match is identified
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

      // Update Vendor compliance and performance score for triggering active deployment!
      const vendorDoc = await db.collection("vendors").doc(vendorId).get();
      if (vendorDoc.exists) {
        const vData = vendorDoc.data() || {};
        const newScore = Math.min((vData.performanceScore || 85) + 3, 100);
        await db.collection("vendors").doc(vendorId).update({
          performanceScore: newScore,
          lastRotationTime: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        matches,
        message: `Successfully executed AI Candidate Rotation. Proposed ${matches.length} matches.`
      });

    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  } else if (action === "validateCandidates") {
    try {
      if (!db) throw new Error("Database not initialized");

      const { candidateIds, vendorId } = req.body;
      if (!Array.isArray(candidateIds) || !vendorId) {
        return res.status(400).json({ error: "Missing candidateIds or vendorId" });
      }

      for (const id of candidateIds) {
        const availQuery = await db.collection("candidate_availability")
          .where("candidateId", "==", id)
          .get();

        if (!availQuery.empty) {
          const docId = availQuery.docs[0].id;
          await db.collection("candidate_availability").doc(docId).update({
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

        await db.collection("vendor_candidate_pool").doc(id).update({
          updatedAt: new Date().toISOString()
        });
      }

      // Update Vendor performance score and response rate
      const vendorDoc = await db.collection("vendors").doc(vendorId).get();
      if (vendorDoc.exists) {
        const vData = vendorDoc.data() || {};
        const currentScore = vData.performanceScore || 85;
        const currentRate = vData.responseRate || 90;
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

      return res.status(200).json({
        success: true,
        message: `Successfully validated ${candidateIds.length} profiles and updated vendor compliance metrics.`
      });

    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "Invalid action" });
}
