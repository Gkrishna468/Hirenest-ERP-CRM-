import { Router } from 'express';
import { vendorOnboardingService } from '../services/VendorOnboardingService';
import { vendorService } from '../services/VendorService';
import { getAdminDb } from '../utils/firebaseAdmin';

const router = Router();

router.post('/public/signup', async (req: any, res: any) => {
  const { email, companyName, contactName, phone, password } = req.body;
  if (!email || !companyName || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    const db = getAdminDb();
    const vendorId = "VND-" + Date.now();
    
    // Create the vendor in Auth
    const result = await vendorOnboardingService.provisionVendorCredentials(
      email,
      companyName,
      vendorId,
      password,
      'self-signup'
    );
    
    // Create the Vendor document
    const vendorRef = db.collection('vendors').doc(vendorId);
    await vendorRef.set({
      id: vendorId,
      name: companyName,
      company: companyName,
      email,
      phone,
      contactPerson: contactName,
      type: 'agency',
      tier: 'tier-3',
      source: 'public_signup',
      status: 'active',
      vendorCode: vendorId,
      secretKey: password,
      ndaStatus: 'pending',
      ndaDay1Reminder: false,
      ndaDay3Reminder: false,
      ndaDay5Reminder: false,
      signupDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: vendorId,
      deleted: false
    });
    
    // Optionally create an event
    const eventRef = db.collection('system_events').doc();
    await eventRef.set({
      type: 'VENDOR_SIGNUP',
      message: `New vendor ${companyName} registered.`,
      timestamp: new Date().toISOString(),
      actor: email,
      data: { vendorId, companyName, email }
    });

    return res.status(200).json({ success: true, vendorId, userId: result.userId });
  } catch(e: any) {
    return res.status(500).json({ error: e.message });
  }
});

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
    const list = await vendorService.list(req.user);
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req: any, res: any) => {
  try {
    const data = await vendorService.getById(req.params.id, req.user);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res: any) => {
  try {
    const data = await vendorService.create(req.body.payload || req.body, req.body.performedBy, req.user);
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
