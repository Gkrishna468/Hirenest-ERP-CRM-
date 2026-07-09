import { Router } from "express";
import { clientService } from "../services/ClientService";

export const clientsRouter = Router();

clientsRouter.get("/", async (req, res) => {
  try {
    const list = await clientService.list((req as any).user);
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

clientsRouter.get("/:id", async (req, res) => {
  try {
    const data = await clientService.getById(req.params.id, (req as any).user);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

clientsRouter.post("/", async (req, res) => {
  try {
    const data = await clientService.create(req.body.payload || req.body, req.body.performedBy, (req as any).user);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

clientsRouter.put("/:id", async (req, res) => {
  try {
    await clientService.update(req.params.id, req.body.payload || req.body, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

clientsRouter.delete("/:id", async (req, res) => {
  try {
    await clientService.delete(req.params.id, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
