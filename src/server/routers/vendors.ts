import { Router } from 'express';
import { vendorOnboardingService } from '../services/VendorOnboardingService';

const router = Router();

router.post('/', async (req: any, res: any) => {
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

export default router;
