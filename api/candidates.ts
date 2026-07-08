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
function computeIdentityHash(identityData: any, fallbackHash: string) {
  const emailRaw = identityData.email || "";
  const phoneRaw = identityData.phone || "";
  const emailClean = emailRaw.trim().toLowerCase();
  const phoneClean = phoneRaw.replace(/[^0-9]/g, ''); // Extract only digits
  
  let rawString = "";
  if (emailClean && phoneClean) {
    rawString = `${emailClean}|${phoneClean}`;
  } else if (emailClean) {
    rawString = emailClean;
  } else if (phoneClean) {
    rawString = phoneClean;
  } else {
    // If no identity data, fallback to provided hash (could be resume hash)
    rawString = fallbackHash;
  }

  return crypto.createHash("sha256").update(rawString).digest("hex");
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

      // 1. Ensure reliable identityHash (Law 2: SSOT)
      const reliableHash = computeIdentityHash(identityData, candidateHash || "NO_HASH");

      // 2. FIRESTORE TRANSACTION FLOW (Law 1 & Law 5)
      // Upload -> AI Parsing (done by frontend) -> Extract Identity -> Lookup Identity Vault
      const vaultRef = db.collection("candidate_identity_vault");
      const result = await db.runTransaction(async (transaction) => {
        const existingQuery = await transaction.get(vaultRef.where("candidateHash", "==", reliableHash).limit(1));
        
        let existingVaultDoc: any = null;
        if (!existingQuery.empty) {
          existingVaultDoc = { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() };
        }

        // [Same Vendor? -> Update Candidate/Availability/Resume Version -> Success]
        // [No? -> Ownership Exists? -> [Yes -> Conflict] OR [No -> Create Candidate/Vendor Pool -> Success]]
        
        if (existingVaultDoc) {
          if (existingVaultDoc.vendorId !== vendorId) {
            // Ownership Conflict (Conflict Flow)
            return {
              status: 409,
              data: { 
                duplicate: true,
                reason: "ownership_conflict",
                existingVendorId: existingVaultDoc.vendorId,
                action: "manual_review_required",
                error: "Candidate Ownership Conflict", 
                message: `This profile is already locked under prior registry claims by another vendor.` 
              }
            };
          }
          // Same vendor - proceed to update/re-submit
        }

        // Fetch Requirement for BDM Routing
        let jobTitle = "General Talent Pool";
        let jobDescription = "Sourcing general talent pool candidates.";
        let jobSkills: string[] = [];
        let clientName = "Open Network";
        let jobLocation = "Remote";
        const reqId = requirementId || "UNKNOWN";

        if (reqId !== "UNKNOWN") {
          const jobDoc = await transaction.get(db.collection("requirements_private").doc(reqId));
          if (jobDoc.exists) {
            const jd = jobDoc.data();
            jobTitle = jd?.title || "Sourced Role";
            jobDescription = jd?.description || jd?.client || "";
            jobSkills = jd?.skills || [];
            clientName = jd?.client || "Enterprise Client";
            jobLocation = jd?.location || "Remote";
          }
        }

        // BDM Routing
        let assignedBdm = "Ravi";
        const lowerTitle = jobTitle.toLowerCase();
        const lowerClient = clientName.toLowerCase();
        if (lowerClient.includes("deloitte") || lowerTitle.includes("deloitte")) assignedBdm = "Rahul";
        else if (lowerClient.includes("accenture") || lowerTitle.includes("accenture")) assignedBdm = "Priya";
        else if (jobLocation.toLowerCase().includes("bangalore")) assignedBdm = "Priya";

        // AI Match (Simulated if already evaluated or if gateway fails, but here we usually get it from frontend evaluation if available)
        // For simplicity in transaction, we use defaults or pre-extracted data
        const aiMatchScore = identityData.aiMatchScore || 75;
        const aiSummary = identityData.aiSummary || "Vetted profile awaiting BDM review.";
        const fraudDetected = !!identityData.fraudDetected;
        const skillsList = identityData.skills || [];

        const candRef = db.collection("candidates").doc();
        const candidateId = candRef.id;

        // Create Candidate
        transaction.set(candRef, {
          name: candidateName,
          vendorId: vendorId,
          vendor_company_id: vendorId,
          stage: "submission",
          source: "vendor_submit",
          created_at: new Date().toISOString(),
          assignedBdm,
          aiMatchScore,
          fraudDetected,
          notes: aiSummary,
          skills: skillsList,
          organizationId: vendorId,
          ownerType: "Vendor",
          ownerUserId: vendorId,
          submittedVia: "Vendor Portal",
          ownershipLocked: true,
          candidateHash: reliableHash,
          ...identityData
        });

        if (!existingVaultDoc) {
          // Lock Ownership
          const newVaultRef = db.collection("candidate_identity_vault").doc();
          transaction.set(newVaultRef, {
            candidateHash: reliableHash,
            vendorId,
            candidateName,
            candidateId,
            ownershipLocked: true,
            createdAt: new Date().toISOString()
          });
          
          // Ownership log
          transaction.set(db.collection("candidateOwnership").doc(), {
            candidateHash: reliableHash,
            vendorId,
            candidateName,
            createdAt: new Date().toISOString(),
            source: "vendor",
            identityData,
          });
        }

        // Ledger entries (Batch-like within transaction)
        transaction.set(db.collection("submission_ledger").doc(), {
          requirementId: reqId,
          candidateId,
          vendorId,
          ownershipHash: reliableHash,
          submittedAt: new Date().toISOString(),
          status: "submitted",
          assignedBdm,
          aiMatchScore
        });

        return { status: 200, data: { success: true, candidateId, assignedBdm, aiMatchScore } };
      });

      return res.status(result.status).json(result.data);

    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  } else if (action === "submitVendorCandidatePool") {
    try {
      if (!db) throw new Error("Database not initialized");

      const { candidateHash, vendorId, candidateName, identityData } = req.body;

      if (!vendorId || !candidateName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1. Ensure reliable identityHash (Law 2: SSOT)
      const reliableHash = computeIdentityHash(identityData, candidateHash || "NO_HASH");

      // 2. FIRESTORE TRANSACTION FLOW (Law 1 & Law 5)
      const vaultRef = db.collection("candidate_identity_vault");
      
      const result = await db.runTransaction(async (transaction) => {
        const existingQuery = await transaction.get(vaultRef.where("candidateHash", "==", reliableHash).limit(1));
        
        let existingVaultDoc = null;
        if (!existingQuery.empty) {
          existingVaultDoc = { id: existingQuery.docs[0].id, ...existingQuery.docs[0].data() };
        }

        if (existingVaultDoc) {
          if (existingVaultDoc.vendorId !== vendorId) {
            // Ownership Conflict
            return {
              status: 409,
              data: { 
                duplicate: true,
                reason: "ownership_conflict",
                existingVendorId: existingVaultDoc.vendorId,
                action: "manual_review_required",
                error: "Candidate Ownership Conflict", 
                message: "This profile is already locked under prior registry claims by another vendor." 
              }
            };
          }
        }

        const parsedTitle = identityData.current_title || identityData.currentTitle || "Software Engineer";
        const parsedSkills = identityData.skills || [];
        const parsedSummary = identityData.cover_note || "Vetted talent pool candidate.";
        const fraudDetected = !!identityData.fraudDetected;

        let candidateId = existingVaultDoc ? existingVaultDoc.candidateId : null;

        if (!candidateId) {
           const candRef = db.collection("candidates").doc();
           candidateId = candRef.id;
           transaction.set(candRef, {
             name: candidateName,
             vendorId: vendorId,
             vendor_company_id: vendorId,
             stage: "Available",
             source: "vendor_pool",
             created_at: new Date().toISOString(),
             updatedAt: new Date().toISOString(),
             assignedBdm: "Ravi",
             aiMatchScore: 85,
             fraudDetected,
             notes: parsedSummary,
             skills: parsedSkills,
             organizationId: vendorId,
             ownerType: "Vendor",
             ownerUserId: vendorId,
             submittedVia: "Vendor Pool",
             ownershipLocked: true,
             candidateHash: reliableHash,
             syncVersion: 1,
             ...identityData
           });
        } else {
           transaction.update(db.collection("candidates").doc(candidateId), {
             name: candidateName,
             skills: parsedSkills,
             currentTitle: parsedTitle,
             updatedAt: new Date().toISOString(),
             syncVersion: FieldValue.increment(1),
             ...identityData
           });
        }

        if (!existingVaultDoc) {
          const newVaultRef = db.collection("candidate_identity_vault").doc();
          transaction.set(newVaultRef, {
            candidateHash: reliableHash,
            vendorId,
            candidateName,
            candidateId,
            ownershipLocked: true,
            createdAt: new Date().toISOString()
          });
          
          transaction.set(db.collection("candidateOwnership").doc(), {
            candidateHash: reliableHash,
            vendorId,
            candidateName,
            createdAt: new Date().toISOString(),
            source: "vendor",
            identityData,
          });
        } else if (!existingVaultDoc.candidateId) {
           transaction.update(db.collection("candidate_identity_vault").doc(existingVaultDoc.id), {
             candidateId,
             updatedAt: new Date().toISOString()
           });
        }

        // Sync to Vendor Pool
        transaction.set(db.collection("vendor_candidate_pool").doc(candidateId), {
          name: candidateName,
          vendorId,
          stage: "Available",
          currentTitle: parsedTitle,
          skills: parsedSkills,
          updatedAt: new Date().toISOString(),
          candidateId,
          candidateHash: reliableHash,
          syncVersion: FieldValue.increment(1),
          ...identityData
        }, { merge: true });

        // Ledger Entry
        transaction.set(db.collection("system_events").doc(), {
          type: "CANDIDATE_POOL_SYNCED",
          message: "Vendor synced candidate " + candidateName + " in Talent Pool.",
          timestamp: new Date().toISOString(),
          entityType: "vendor_candidate",
          entityId: candidateId,
          data: { candidateName, vendorId, candidateHash: reliableHash }
        });

        return { status: 200, data: { success: true, candidateId } };
      });

      return res.status(result.status).json(result.data);

    } catch (e) {
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
