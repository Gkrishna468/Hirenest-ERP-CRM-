import { Request, Response } from "express";
import { getAdminDb } from "../utils/firebaseAdmin";

export default async function docusignWebhookHandler(req: Request, res: Response) {
  try {
    const payload = req.body;
    
    // In a real implementation, you would verify the HMAC signature from DocuSign here
    // const hmac = req.headers['x-docusign-signature-1'];
    // verifySignature(hmac, payload);
    
    // DocuSign Connect payload structure typically contains the envelope status
    const status = payload?.data?.envelopeSummary?.status || payload?.status;
    const vendorId = payload?.data?.envelopeSummary?.customFields?.textCustomFields?.find(
      (f: any) => f.name === 'vendorId'
    )?.value || payload?.vendorId; // mock fallback for testing
    
    console.log(`[DocuSign Webhook] Received status ${status} for Vendor ${vendorId}`);
    
    if (status === 'completed' && vendorId) {
      const db = getAdminDb();
      if (!db) throw new Error("Firestore not initialized");
      
      console.log(`[DocuSign Webhook] Marking NDA as signed for vendor: ${vendorId}`);
      
      const vendorRef = db.collection('vendors').doc(vendorId);
      
      await vendorRef.update({
        ndaStatus: 'signed',
        ndaSignedAt: new Date().toISOString(),
      });
      
      // Also emit a system event
      await db.collection('system_events').add({
        type: 'NDA_SIGNED',
        message: `Vendor ${vendorId} has signed the NDA via DocuSign.`,
        timestamp: new Date().toISOString(),
        actor: 'DocuSign System',
        data: { vendorId }
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[DocuSign Webhook Error]', error);
    return res.status(500).send('Internal Server Error');
  }
}
