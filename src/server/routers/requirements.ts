import { Router } from "express";
import { requirementService } from "../services/RequirementService";

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

requirementsRouter.delete("/:id", async (req, res) => {
  try {
    await requirementService.delete(req.params.id, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
