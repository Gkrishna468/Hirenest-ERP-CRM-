import { Router } from "express";
import { requirementService } from "../services/RequirementService";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import { getAdminDb } from "../utils/firebaseAdmin";

export const requirementsRouter = Router();

requirementsRouter.get("/", async (req, res) => {
  try {
    const list = await requirementService.list((req as any).user);
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

requirementsRouter.get("/:id", async (req, res) => {
  try {
    const data = await requirementService.getById(req.params.id, (req as any).user);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

requirementsRouter.post("/", async (req, res) => {
  try {
    const data = await requirementService.create(req.body.payload || req.body, req.body.performedBy, (req as any).user);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

requirementsRouter.put("/:id", async (req, res) => {
  try {
    await requirementService.update(req.params.id, req.body.payload || req.body, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

requirementsRouter.post("/:id/broadcast", async (req, res) => {
  try {
    const { settings, targetVendors, performedBy } = req.body;
    const reqId = req.params.id;
    const userContext = (req as any).user;

    // 1. Validate requirement
    const requirement = await requirementService.getById(reqId, userContext);
    if (!requirement) {
      return res.status(404).json({ success: false, error: "Requirement not found" });
    }

    // 2. Apply business rules (e.g. C2C -> disable public link & linkedin, FTE/C2H -> enable public link)
    const finalSettings = { ...(settings || {}) };
    const reqType = requirement.pricing_data?.requirementType || requirement.type || "";
    
    if (reqType === "C2C") {
      finalSettings.linkedin = false;
      finalSettings.allowPublicApply = false;
    } else if (reqType === "FTE" || reqType === "C2H") {
      finalSettings.allowPublicApply = true;
    }

    // 3. Create a broadcast_jobs record
    const broadcastId = `BC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const db = getAdminDb();
    
    const jobRef = db.collection("broadcast_jobs").doc(broadcastId);
    await jobRef.set({
      id: broadcastId,
      requirementId: reqId,
      requirementTitle: requirement.title || "Requirement",
      status: "QUEUED",
      settings: finalSettings,
      targetVendors: targetVendors || 0,
      performedBy: performedBy || userContext?.userId || "System",
      organizationId: userContext?.organizationId || "default",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 4. Return HTTP 200 immediately
    res.status(200).json({
      success: true,
      broadcastId,
      status: "QUEUED",
      message: "Broadcast queued successfully"
    });

    // 5. Background Worker - run asynchronously
    (async () => {
      try {
        // Update job status to PROCESSING
        await jobRef.update({ status: "PROCESSING", updatedAt: new Date().toISOString() });

        // Update the requirement to show it was broadcasted
        await requirementService.update(reqId, { broadcasted: true, lastBroadcastAt: new Date().toISOString() }, performedBy);

        // Publish REQUIREMENT_BROADCAST_STARTED event to system_events
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_BROADCAST_STARTED",
          aggregateType: "Requirement",
          aggregateId: reqId,
          organizationId: userContext?.organizationId || "default",
          actorId: performedBy || "System",
          actorRole: "Recruiter",
          sourceApp: "CRM",
          sourceWorkspace: "Recruiter",
          payload: {
            broadcastId,
            targetVendorCount: targetVendors || 0,
            settings: finalSettings
          }
        });

        // Fetch active vendors
        const vendorsQuery = await db.collection("clients").where("isVendor", "==", true).get();
        const vendors = vendorsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let sentCount = 0;
        const batch = db.batch();

        for (const vendor of vendors) {
          const broadcastRef = db.collection("vendor_broadcasts").doc();
          batch.set(broadcastRef, {
            broadcastId: `BRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requirementId: reqId,
            requirementTitle: requirement.title || "Requirement",
            channel: "portal",
            vendorId: vendor.id,
            vendorName: (vendor as any).name || (vendor as any).company || "",
            sentAt: new Date().toISOString(),
            status: "sent",
            source: "crm_broadcast"
          });
          sentCount++;
        }

        // Create Activity Ledger Entry
        const activityRef = db.collection("activity_ledger").doc();
        batch.set(activityRef, {
          entityType: "requirement_broadcast",
          entityId: reqId,
          event: "broadcast_sent",
          performedBy: performedBy || "System",
          timestamp: new Date().toISOString(),
          metadata: {
            broadcastId,
            vendorsTargeted: sentCount,
            channel: "portal",
            settings: finalSettings
          }
        });

        // Update agent_activities
        const agentRef = db.collection("agent_activities").doc();
        batch.set(agentRef, {
          agent: "Vendor Broadcast Agent",
          status: `Broadcast to ${sentCount} vendors via Portal.`,
          state: "completed",
          timestamp: new Date().toISOString(),
          metadata: {
            broadcastId,
            requirementId: reqId,
            sentCount
          }
        });

        await batch.commit();

        // Mark job as COMPLETED
        await jobRef.update({
          status: "COMPLETED",
          processedVendors: sentCount,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      } catch (bgError: any) {
        console.error("[Background Broadcast Error]", bgError);
        try {
          await jobRef.update({
            status: "FAILED",
            error: bgError.message,
            updatedAt: new Date().toISOString()
          });
        } catch (writeErr) {
          console.error("[Failed to write background error to job]", writeErr);
        }
      }
    })();

  } catch (error: any) {
    console.error("[Broadcast Route Error]", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

requirementsRouter.delete("/:id", async (req, res) => {
  try {
    await requirementService.delete(req.params.id, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
