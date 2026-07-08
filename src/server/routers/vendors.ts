import { Router } from 'express';
import { getAdminDb, getAdminAuthClient } from '../utils/firebaseAdmin';
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";

const router = Router();

router.post('/', async (req: any, res: any) => {
  // Ensure the requester is authenticated
  const requesterId = req.user?.id;
  const requesterEmail = req.user?.email;
  
  if (!requesterId) {
    return res.status(401).json({ error: 'Unauthorized: No requester credentials' });
  }
  
  const db = getAdminDb();
  if (!db) {
    return res.status(500).json({ error: 'Firestore db is not initialized.' });
  }
  
  const { email, companyName, vendorId, temporaryPassword } = req.body;
  if (!email || !companyName || !vendorId || !temporaryPassword) {
    return res.status(400).json({ error: 'Bad Request: Missing required parameters' });
  }
  
  try {
    const adminAuth = getAdminAuthClient();
    
    // Check if user already exists
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      // User exists, update password
      await adminAuth.updateUser(userRecord.uid, {
        password: temporaryPassword,
        displayName: companyName
      });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Create user
        userRecord = await adminAuth.createUser({
          email,
          password: temporaryPassword,
          displayName: companyName
        });
      } else {
        throw e;
      }
    }
    
    // Set Custom Claims for organization mapping and role mapping
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'vendor',
      organizationId: vendorId
    });
    
    // Save profile in users collection
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email,
      name: companyName,
      role: 'vendor',
      organizationId: vendorId,
      companyId: vendorId,
      status: 'active',
      mustChangePassword: true,
      temporaryPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    // Emit event
    await db.collection('system_events').add({
      type: 'VENDOR_CREDENTIALS_PROVISIONED',
      message: `Secure Firebase Auth credentials provisioned for Delivery Partner ${companyName} (${email}).`,
      timestamp: new Date().toISOString(),
      actor: requesterEmail || 'Admin',
      data: { userId: userRecord.uid, email, vendorId, companyName }
    });
    
    return res.status(200).json({
      success: true,
      userId: userRecord.uid,
      message: 'Firebase Auth user and custom claims successfully provisioned for Vendor Partner.'
    });
  } catch (error: any) {
    console.error('[Create Vendor Error]', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;
