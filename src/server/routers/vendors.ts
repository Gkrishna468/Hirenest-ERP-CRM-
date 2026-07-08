import { Router } from 'express';
import { vendorOnboardingService } from '../services/VendorOnboardingService';
import { vendorService } from '../services/VendorService';

const router = Router();

router.post('/provision', async (req: any, res: any) => {
  const requesterId = req.user?.id;
  const requesterEmail = req.user?.email;
  
  if (!requesterId) {
    return res.status(401).json({ error: 'Unauthorized: No requester credentials' });
  }
  
  const { email, companyName, vendorId, temporaryPassword } = req.body;
  
  if (!email || !companyName || !vendorId || !temporaryPassword) {
    return res.status(400).json({ error: 'Bad Request: Missing required parameters' });
  }
  
  try {
    const result = await vendorOnboardingService.provisionVendorCredentials(
      email, 
      companyName, 
      vendorId, 
      temporaryPassword, 
      requesterEmail
    );
    
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('[Create Vendor Error]', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});



router.get("/", async (req: any, res: any) => {
  try {
    const list = await vendorService.list();
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const data = await vendorService.getById(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res: any) => {
  try {
    const data = await vendorService.create(req.body.payload || req.body, req.body.performedBy);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res: any) => {
  try {
    await vendorService.update(req.params.id, req.body.payload || req.body, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res: any) => {
  try {
    await vendorService.delete(req.params.id, req.body.performedBy);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
