import { Router } from "express";
import { userService } from "../services/UserService";
import { populateBaseFields, populateUpdateFields } from "../utils/entityUtils";

const router = Router();

router.get("/", async (req: any, res: any) => {
  try {
    const list = await userService.list();
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const data = await userService.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
