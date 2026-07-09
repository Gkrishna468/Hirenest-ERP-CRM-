import { Router } from "express";
import { dealService } from "../services/DealService";
import { populateBaseFields, populateUpdateFields } from "../utils/entityUtils";

const router = Router();

router.get("/", async (req: any, res: any) => {
  try {
    const list = await dealService.list(req.user);
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const data = await dealService.getById(req.params.id, req.user);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res: any) => {
  try {
    const baseData = populateBaseFields(req.body.payload || req.body, req);
    const performedBy = baseData.createdBy;
    const data = await dealService.create(baseData, performedBy, req.user);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res: any) => {
  try {
    const updateData = populateUpdateFields(req.body.payload || req.body, req);
    const performedBy = updateData.updatedBy;
    await dealService.update(req.params.id, updateData, performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  try {
    const performedBy = req.body.performedBy || req.headers['x-user-id'] || 'system';
    await dealService.delete(req.params.id, performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
