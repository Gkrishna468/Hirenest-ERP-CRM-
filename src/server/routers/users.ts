import { Router } from "express";
import { userService } from "../services/UserService";
import { populateBaseFields, populateUpdateFields } from "../utils/entityUtils";
import { getAdminApp, getAdminDb, getApps } from "../utils/firebaseAdmin";

const router = Router();

router.get("/", async (req: any, res: any) => {
  try {
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ error: "Unauthorized: Missing authentication" });
    }

    const includeArchived = req.query.includeArchived === 'true';
    const list = await userService.list(includeArchived);
    
    // Organization scoping for non-exec-root admins/users
    const isSuperAdmin = caller.id === 'executive-root' || caller.role === 'founder' || caller.role === 'admin';
    if (!isSuperAdmin && caller.organizationId) {
      const filtered = list.filter((u: any) => u.organizationId === caller.organizationId);
      return res.status(200).json(filtered);
    }

    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to diagnose environment issues
router.get("/debug/runtime", async (req: any, res: any) => {
  try {
    const adminApp = getAdminApp();
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
    const data = await userService.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }
    
    // Tenant isolation check
    const caller = req.user;
    if (caller && caller.role !== 'admin' && caller.role !== 'founder' && caller.id !== 'executive-root') {
      if (data.organizationId && caller.organizationId && data.organizationId !== caller.organizationId) {
        return res.status(403).json({ error: "Forbidden: Cross-tenant user access denied" });
      }
    }

    res.status(200).json(data);
  } catch (error: any) {
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
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ error: "Unauthorized: Authentication required to provision users" });
    }

    const isAuthorized = caller.id === 'executive-root' || caller.role === 'admin' || caller.role === 'founder';
    if (!isAuthorized) {
      return res.status(403).json({ error: "Forbidden: Only administrators can provision users" });
    }

    const rawData = req.body.payload || req.body;
    if (!rawData.email) {
      return res.status(400).json({ error: "Email is required to create a user" });
    }

    // 1. Duplicate email prevention check
    const existingUser = await userService.getByEmail(rawData.email);
    if (existingUser && existingUser.id !== rawData.id) {
      return res.status(409).json({ error: "409 Conflict: A user with this email address already exists in the canonical directory" });
    }

    // 2. Organization scoping & tenant isolation
    let baseData = rawData;
    try {
      baseData = populateBaseFields(rawData, req);
    } catch (e) {
      baseData = {
         ...rawData,
         id: rawData.id || require("crypto").randomUUID(),
         organizationId: caller.organizationId || rawData.organizationId || 'bootstrap-org',
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
      };
    }

    // Force non-executive root admins to provision inside their own organization
    if (caller.id !== 'executive-root' && caller.organizationId) {
      baseData.organizationId = caller.organizationId;
    }

    // Prevent privilege escalation: non-founder admins cannot create 'founder' roles
    if (rawData.role === 'founder' && caller.role !== 'founder' && caller.id !== 'executive-root') {
      baseData.role = 'admin';
    }

    const performedBy = caller.email || caller.id || 'Admin';
    baseData.createdBy = performedBy;

    const data = await userService.create(baseData, performedBy);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/status", async (req: any, res: any) => {
  try {
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }

    const isAuthorized = caller.id === 'executive-root' || caller.role === 'admin' || caller.role === 'founder';
    if (!isAuthorized) {
      return res.status(403).json({ error: "Forbidden: Only administrators can modify user status" });
    }

    const { status } = req.body;
    if (!status || !['active', 'inactive', 'disabled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status parameter. Must be 'active', 'inactive', or 'disabled'" });
    }

    const targetUser = await userService.getById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Tenant isolation check for status update
    if (caller.id !== 'executive-root' && caller.organizationId && targetUser.organizationId !== caller.organizationId) {
      return res.status(403).json({ error: "Forbidden: Cannot alter user status in a different organization" });
    }

    const performedBy = caller.email || caller.id || 'Admin';
    await userService.update(req.params.id, { status, updatedAt: new Date().toISOString() }, performedBy);

    res.status(200).json({ success: true, id: req.params.id, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res: any) => {
  try {
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }

    const isAuthorized = caller.id === 'executive-root' || caller.role === 'admin' || caller.role === 'founder' || caller.id === req.params.id;
    if (!isAuthorized) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions to update user profile" });
    }

    const updateBody = req.body.payload || req.body;
    
    // Prevent non-admins from changing roles or organization
    if (caller.role !== 'admin' && caller.role !== 'founder' && caller.id !== 'executive-root') {
      delete updateBody.role;
      delete updateBody.organizationId;
    }

    const updateData = populateUpdateFields(updateBody, req);
    const performedBy = caller.email || caller.id || 'User';
    await userService.update(req.params.id, updateData, performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  try {
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isAuthorized = caller.id === 'executive-root' || caller.role === 'admin' || caller.role === 'founder';
    if (!isAuthorized) {
      return res.status(403).json({ error: "Forbidden: Only administrators can delete or archive users" });
    }

    const performedBy = caller.email || caller.id || 'Admin';
    await userService.delete(req.params.id, performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/restore", async (req: any, res: any) => {
  try {
    const caller = req.user;
    if (!caller) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isAuthorized = caller.id === 'executive-root' || caller.role === 'admin' || caller.role === 'founder';
    if (!isAuthorized) {
      return res.status(403).json({ error: "Forbidden: Only administrators can restore archived users" });
    }

    const performedBy = caller.email || caller.id || 'Admin';
    await userService.restore(req.params.id, performedBy);
    res.status(200).json({ success: true, id: req.params.id, status: 'active' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
