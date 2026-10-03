import { Router } from "express";
import { revenueOSActionService } from "../services/RevenueOSActionService";

export const revenueOSRouter = Router();

// Secure Server-Side Scheduler Endpoint for External Cron Invocation (No Fallback Secret)
revenueOSRouter.post("/evaluate-dormant", async (req, res) => {
  try {
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret) {
      console.error("[RevenueOS Cron] CRON_SECRET is not configured in environment variables!");
      return res.status(500).json({ error: "Server Configuration Error: CRON_SECRET is required." });
    }

    const cronSecret = req.headers["x-cron-secret"] || req.headers["authorization"];
    let isAuthorized = false;

    if (cronSecret === expectedSecret || cronSecret === `Bearer ${expectedSecret}`) {
      isAuthorized = true;
    } else if ((req as any).user && ((req as any).user.role === "admin" || (req as any).user.role === "founder" || (req as any).user.userId === "executive-root")) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: "Forbidden: Invalid or missing cron secret." });
    }

    const systemUserContext = {
      userId: "executive-root",
      email: "system-scheduler@hirenestworkforce.com",
      role: "Super Admin",
      organizationId: "org_hirenest",
      permissions: ["revenue_os.execute"]
    };

    const result = await revenueOSActionService.evaluateDormantClients(systemUserContext);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BDM Daily Command Center
revenueOSRouter.get("/bdm-command-center", async (req, res) => {
  try {
    const data = await revenueOSActionService.getBdmDailyCommandCenter((req as any).user);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Inbound Communication / WhatsApp webhook boundary
revenueOSRouter.post("/inbound-communication", async (req, res) => {
  try {
    const result = await revenueOSActionService.handleInboundCommunication(req.body.payload || req.body, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
