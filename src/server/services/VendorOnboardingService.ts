import { getAdminDb, getAdminAuthClient } from '../utils/firebaseAdmin';

export class VendorOnboardingService {
  async provisionVendorCredentials(email: string, companyName: string, vendorId: string, temporaryPassword: string, requesterEmail: string = 'Admin') {
    const db = getAdminDb();
    if (!db) throw new Error('Firestore db is not initialized.');
    
    const adminAuth = getAdminAuthClient();

    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(userRecord.uid, {
        password: temporaryPassword,
        displayName: companyName
      });
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
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

    const batch = db.batch();
    
    // Save profile in users collection
    const userRef = db.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
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
    const eventRef = db.collection('system_events').doc();
    batch.set(eventRef, {
      type: 'VENDOR_CREDENTIALS_PROVISIONED',
      message: `Secure Firebase Auth credentials provisioned for Delivery Partner ${companyName} (${email}).`,
      timestamp: new Date().toISOString(),
      actor: requesterEmail,
      data: { userId: userRecord.uid, email, vendorId, companyName }
    });

    await batch.commit();

    return {
      userId: userRecord.uid,
      message: 'Firebase Auth user and custom claims successfully provisioned for Vendor Partner.'
    };
  }
}

export const vendorOnboardingService = new VendorOnboardingService();
