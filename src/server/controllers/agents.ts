import { VercelRequest, VercelResponse } from "@vercel/node";
import * as dotenv from "dotenv";

import { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.body;

  if (action === "vendor_broadcast") {
    try {
      if (!getAdminDb()) throw new Error("Database not initialized");

      const { requirementId } = req.body;

      if (!requirementId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // 1. Get requirement
      const reqRef = await getAdminDb().collection("requirements").doc(requirementId).get();
      if (!reqRef.exists) {
        return res.status(404).json({ error: "Requirement not found" });
      }
      
      const requirementTitle = reqRef.data()?.title || "Requirement";

      // 2. Fetch active vendors from canonical vendors collection with legacy fallback
      let vendorsQuery = await getAdminDb().collection("vendors").get();
      let vendors = vendorsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (vendors.length === 0) {
        const fallbackQuery = await getAdminDb().collection("clients").where("isVendor", "==", true).get();
        vendors = fallbackQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // 3. For each vendor, create broadcast_deliveries and vendor_broadcasts entries
      const batch = getAdminDb().batch();
      let sentCount = 0;

      for (const vendor of vendors) {
        // 1. RC-1/RC-2 compliant broadcast_deliveries record
        const deliveryRef = getAdminDb().collection("broadcast_deliveries").doc();
        batch.set(deliveryRef, {
          id: deliveryRef.id,
          broadcastId: `BRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          requirementId,
          requirementTitle,
          vendorId: vendor.id,
          vendorName: (vendor as any).name || (vendor as any).company || "",
          channel: "whatsapp",
          deliveryType: "WHATSAPP",
          sentAt: new Date().toISOString(),
          status: "sent",
          source: "mailos"
        });

        // 2. Backward compatible vendor_broadcasts record
        const broadcastRef = getAdminDb().collection("vendor_broadcasts").doc();
        batch.set(broadcastRef, {
          id: broadcastRef.id,
          broadcastId: `BRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          requirementId,
          requirementTitle,
          channel: "whatsapp",
          vendorId: vendor.id,
          vendorName: (vendor as any).name || (vendor as any).company || "",
          sentAt: new Date().toISOString(),
          status: "sent",
          source: "mailos"
        });
        
        sentCount++;
      }

      // 4. Create Activity Ledger Entry
      const activityRef = getAdminDb().collection("activity_ledger").doc();
      batch.set(activityRef, {
        entityType: "requirement_broadcast",
        entityId: requirementId,
        event: "broadcast_sent",
        performedBy: "vendor_broadcast_agent",
        timestamp: new Date().toISOString(),
        metadata: {
          vendorsTargeted: sentCount,
          channel: "whatsapp"
        }
      });

      // 5. Update agent_activities
      const agentRef = getAdminDb().collection("agent_activities").doc();
      batch.set(agentRef, {
        agent: "Vendor Broadcast Agent",
        status: `Broadcast to ${sentCount} vendors via WhatsApp.`,
        state: "completed",
        timestamp: new Date().toISOString(),
        metadata: {
          requirementId,
          sentCount
        }
      });
      
      // Update requirement metrics
      const requirementUpdateRef = getAdminDb().collection("requirements").doc(requirementId);
      batch.update(requirementUpdateRef, {
         broadcastsSent: (reqRef.data()?.broadcastsSent || 0) + sentCount
      });

      await batch.commit();

      return res.status(200).json({ success: true, count: sentCount });
    } catch (e: any) {
      console.error("Vendor Broadcast Error:", e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "Invalid action" });
}
