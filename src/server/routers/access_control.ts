import { Router } from "express";
import { accessControlService } from "../services/AccessControlService";
import { requireAuth } from "../controllers/authMiddleware";

export const accessControlRouter = Router();

// Protect all access control routes with authentication & permission checks inside services
accessControlRouter.use(requireAuth);

// List Users (requires users.read)
accessControlRouter.get("/users", async (req, res) => {
  try {
    const users = await accessControlService.listUsers((req as any).user);
    res.status(200).json(users);
  } catch (error: any) {
    res.status(error.message?.includes("Forbidden") ? 403 : 500).json({ error: error.message });
  }
});

// Create / Invite User (requires users.create)
accessControlRouter.post("/users", async (req, res) => {
  try {
    const performedBy = (req as any).user?.email || "Admin";
    const user = await accessControlService.createUser(req.body.payload || req.body, performedBy, (req as any).user);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(error.message?.includes("Forbidden") ? 403 : 500).json({ error: error.message });
  }
});

// Update User (requires users.update)
accessControlRouter.put("/users/:id", async (req, res) => {
  try {
    const performedBy = (req as any).user?.email || "Admin";
    const user = await accessControlService.updateUser(req.params.id, req.body.payload || req.body, performedBy, (req as any).user);
    res.status(200).json(user);
  } catch (error: any) {
    res.status(error.message?.includes("Forbidden") ? 403 : 500).json({ error: error.message });
  }
});

// Get Automation Policies (requires audit.read)
accessControlRouter.get("/policies", async (req, res) => {
  try {
    const policies = await accessControlService.getAutomationPolicies((req as any).user);
    res.status(200).json(policies);
  } catch (error: any) {
    res.status(error.message?.includes("Forbidden") ? 403 : 500).json({ error: error.message });
  }
});

// Update Automation Policy (requires roles.manage)
accessControlRouter.put("/policies/:id", async (req, res) => {
  try {
    const performedBy = (req as any).user?.email || "Admin";
    const { mode, approvalRole } = req.body.payload || req.body;
    const result = await accessControlService.updateAutomationPolicy(req.params.id, mode, approvalRole, performedBy, (req as any).user);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.message?.includes("Forbidden") ? 403 : 500).json({ error: error.message });
  }
});
