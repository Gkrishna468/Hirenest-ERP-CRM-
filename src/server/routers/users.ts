import { Router } from "express";
import { userService } from "../services/UserService";
import { populateBaseFields, populateUpdateFields } from "../utils/entityUtils";
import { getAdminApp, getAdminDb, getApps } from "../utils/firebaseAdmin";

const router = Router();

router.get("/", async (req: any, res: any) => {
  try {
    const list = await userService.list();
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to diagnose environment issues
router.get("/debug/runtime", async (req: any, res: any) => {
  try {
    const adminApp = getAdminApp();
    const db = getAdminDb();
    
    const debugInfo = {
      projectId: adminApp?.options?.projectId || "unknown",
      firebaseInitialized: !!adminApp,
      initializedApps: getApps().length,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(debugInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    console.log(`[UsersRouter] GET /api/users/${req.params.id}`);
    const data = await userService.getById(req.params.id);
    
    if (!data) {
      console.log(`[UsersRouter] User ${req.params.id} not found`);
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    
    res.status(200).json(data);
  } catch (error: any) {
    console.error(`[UsersRouter] Error fetching user ${req.params.id}:`, error);
    // Return structured error
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR",
      message: error.message 
    });
  }
});

router.get("/email/:email", async (req: any, res: any) => {
  try {
    const data = await userService.getByEmail(req.params.email);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res: any) => {
  try {
    // Some users might be created without organizationId initially, but we enforce it in BaseFields.
    // If it's a completely new root user without org, they might pass 'default-org' temporarily.
    const rawData = req.body.payload || req.body;
    let baseData = rawData;
    try {
      baseData = populateBaseFields(rawData, req);
    } catch (e) {
      // Fallback for user creation if org is truly missing and we need to bootstrap
      baseData = {
         ...rawData,
         id: rawData.id || require("crypto").randomUUID(),
         organizationId: rawData.organizationId || 'bootstrap-org',
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      }
    }
    const performedBy = baseData.createdBy || 'system';
    const data = await userService.create(baseData, performedBy);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res: any) => {
  try {
    const updateData = populateUpdateFields(req.body.payload || req.body, req);
    const performedBy = updateData.updatedBy;
    await userService.update(req.params.id, updateData, performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  try {
    const performedBy = req.body.performedBy || req.headers['x-user-id'] || 'system';
    await userService.delete(req.params.id, performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
