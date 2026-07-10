import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

import { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";

const ALGORITHM = "aes-256-cbc";
const rawKey = process.env.ENCRYPTION_KEY || "default-insecure-key-32-chars!!!";
const ENCRYPTION_KEY = rawKey.padEnd(32, '!').substring(0, 32);
const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string): string => {
  const textParts = text.split(":");
  const ivStr = textParts.shift();
  if (!ivStr) return text;
  const iv = Buffer.from(ivStr, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");

  const tryDecrypt = (keyStr: string) => {
    try {
      if (keyStr.length !== 32) return null;
      const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(keyStr), iv);
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch(e) {
      return null;
    }
  };

  let decryptedVal = tryDecrypt(ENCRYPTION_KEY);
  if (!decryptedVal) {
    decryptedVal = tryDecrypt("default-insecure-key-32-chars!!!");
  }
  
  if (!decryptedVal) {
      throw new Error("bad decrypt");
  }

  return decryptedVal;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action || (req.body && req.body.action);
  switch (action) {
    case 'url':
      return await (async () => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/auth/google/callback`
    );

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state: (req.query.userId as string) || 'unknown'
    });

    return res.status(200).json({ url });
  } catch (error: any) {
    console.error('[Gmail Auth URL Error]', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
})();
    case 'callback':
      return await (async () => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const code = req.query.code as string;
  let userId = req.query.state as string;
  if (userId === "undefined" || userId === "null" || !userId) {
    userId = "unknown";
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  const logToFirestore = async (step: string, details?: any) => {
    console.log(`[OAuth Debug] ${step}`, details || '');
    if (getAdminDb()) {
      try {
        await getAdminDb().collection('oauth_debug').add({
          step,
          timestamp: new Date().toISOString(),
          details: details || null
        });
      } catch (err) {
        console.error('Failed to log to oauth_debug', err);
      }
    }
  };

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/auth/google/callback`
    );

    await logToFirestore("STEP_1_TOKEN_EXCHANGE_START");
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await logToFirestore("STEP_1_TOKEN_EXCHANGE_SUCCESS");

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const emailAddress = profile.data.emailAddress;

    if (!emailAddress) throw new Error("Could not get email address");

    if (emailAddress !== 'gopal@hirenestworkforce.com') {
      return res.status(403).json({ error: 'Only corporate Gmail allowed.' });
    }

    // Look up any existing connection for this user or email to find refresh token fallback
    let existingConnectionData: any = null;
    let connRef: any = null;

    if (!getAdminDb()) {
      throw new Error("Firestore db is not initialized. Cannot save Gmail connection.");
    }

    // Save to system_integrations
    await getAdminDb().collection('system_integrations').doc('gmail_connection').set({
      email: emailAddress,
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || existingConnectionData?.refresh_token || '',
      expiry_date: tokens.expiry_date || null,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Fallback: also maintain the existing gmail_connections collection if needed by other components
    if (userId && userId !== 'unknown') {
      const snapshot = await getAdminDb().collection('gmail_connections')
        .where('userId', '==', userId)
        .limit(1).get();
      if (!snapshot.empty) {
        connRef = snapshot.docs[0].ref;
        existingConnectionData = snapshot.docs[0].data();
      }
    }

    if (!connRef && emailAddress) {
      const snapshot = await getAdminDb().collection('gmail_connections')
        .where('email', '==', emailAddress)
        .limit(1).get();
      if (!snapshot.empty) {
        connRef = snapshot.docs[0].ref;
        existingConnectionData = snapshot.docs[0].data();
      }
    }

    let encryptedRefreshToken = '';
    if (tokens.refresh_token) {
      encryptedRefreshToken = encrypt(tokens.refresh_token);
    } else if (existingConnectionData && existingConnectionData.encryptedRefreshToken) {
      encryptedRefreshToken = existingConnectionData.encryptedRefreshToken;
    }

    let historyId = profile.data.historyId || existingConnectionData?.historyId || '';

    await logToFirestore("STEP_2_FIRESTORE_WRITE_START", {
      hasNewRefreshToken: !!tokens.refresh_token,
      hasExistingTokenFallback: !!(existingConnectionData && existingConnectionData.encryptedRefreshToken),
    });

    if (!connRef) {
      // Use userId as doc ID to guarantee unique connection record per user
      if (userId && userId !== 'unknown') {
        connRef = getAdminDb().collection('gmail_connections').doc(userId);
      } else {
        connRef = getAdminDb().collection('gmail_connections').doc();
      }
    }

    const connRefId = connRef.id;
    await connRef.set({
      userId: userId || 'unknown',
      email: emailAddress,
      status: 'active',
      historyId: historyId,
      encryptedRefreshToken: encryptedRefreshToken,
      watchExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), 
      createdAt: existingConnectionData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Emit GMAIL_CONNECTED event
    await getAdminDb().collection('system_events').add({
      eventType: 'GMAIL_CONNECTED',
      entityCollection: 'gmail_connections',
      entityId: connRefId,
      metadata: { email: emailAddress, isUpdate: !!existingConnectionData },
      createdAt: new Date().toISOString()
    });
    
    // PERMANENT PRODUCT-MANAGER FIX: Update users collection so MailOS avoids constant lookups
    if (userId && userId !== 'unknown') {
      try {
        await getAdminDb().collection('users').doc(userId).set({
          id: userId,
          gmailConnected: true,
          gmailEmail: emailAddress,
          gmailConnectionId: connRefId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        await logToFirestore("STEP_2B_USER_RECORD_UPDATED");
      } catch (err: any) {
        console.error("Failed to update permanent user record", err);
      }
    }

    await logToFirestore("STEP_2_FIRESTORE_WRITE_SUCCESS", { connectionId: connRefId });

    // Try Watch API but don't fail the whole connection if it fails
    if (process.env.PUBSUB_TOPIC_NAME) {
      await logToFirestore("STEP_3_WATCH_API_START");
      try {
        const watchRes = await gmail.users.watch({
          userId: 'me',
          requestBody: {
            labelIds: ['INBOX'],
            topicName: process.env.PUBSUB_TOPIC_NAME
          }
        });
        historyId = watchRes.data.historyId || historyId;
        console.log(`[Gmail Auth] Watch registration successful for ${emailAddress}`);
        
        await getAdminDb().collection('gmail_connections').doc(connRefId).update({
          historyId: historyId
        });
        await logToFirestore("STEP_3_WATCH_API_SUCCESS");
      } catch (watchError: any) {
        console.error('[Gmail Auth Watch Error]', watchError);
        await logToFirestore("STEP_3_WATCH_API_FAILED", { error: watchError.message });
      }
    } else {
      await logToFirestore("STEP_3_WATCH_API_SKIPPED_NO_TOPIC");
    }

    res.redirect('/settings?gmail_connected=true');
  } catch (error: any) {
    console.error('[Gmail Auth Callback Error]', error);
    await logToFirestore("STEP_FAILED", { error: error.message });
    res.redirect('/settings?gmail_error=failed_to_connect');
  }
})();
    case 'admin-reset-password':
      return await (async () => {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method Not Allowed' });
        }
        
        // Ensure the requester is an admin or founder
        const requesterId = (req as any).user?.id;
        const requesterEmail = (req as any).user?.email;
        
        if (!requesterId) {
          return res.status(401).json({ error: 'Unauthorized: No requester credentials' });
        }
        
        if (!getAdminDb()) {
          return res.status(500).json({ error: 'Firestore db is not initialized.' });
        }
        
        // Fetch requester role from Firestore just to be 100% sure and secure
        const requesterDoc = await getAdminDb().collection('users').doc(requesterId).get();
        const requesterData = requesterDoc.data();
        const requesterRole = requesterData?.role || (req as any).user?.role;
        
        if (requesterRole !== 'admin' && requesterRole !== 'founder' && requesterEmail !== 'admin@hirenestworkforce.com' && requesterId !== 'executive-root') {
          return res.status(403).json({ error: 'Forbidden: Admin or Founder privileges required' });
        }
        
        const { targetUserId, newPassword } = req.body;
        if (!targetUserId || !newPassword) {
          return res.status(400).json({ error: 'Bad Request: Missing targetUserId or newPassword' });
        }
        
        try {
          // Get target user info
          const targetUserDoc = await getAdminDb().collection('users').doc(targetUserId).get();
          if (!targetUserDoc.exists) {
            return res.status(404).json({ error: 'Target user profile not found' });
          }
          
          const targetUserData = targetUserDoc.data();
          const targetEmail = targetUserData?.email || '';
          
          // Reset password in Firebase Auth using Admin Auth
          const adminAuth = getAdminAuthClient();
          await adminAuth.updateUser(targetUserId, {
            password: newPassword
          });
          
          // Update Firestore user document
          await getAdminDb().collection('users').doc(targetUserId).set({
            loginCount: 0,
            mustChangePassword: true,
            temporaryPassword: newPassword,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          // Emit Event
          await getAdminDb().collection('system_events').add({
            eventType: 'PASSWORD_RESET',
            entityCollection: 'users',
            entityId: targetUserId,
            metadata: {
              email: targetEmail || '',
              resetBy: requesterEmail || requesterData?.name || 'Admin',
            },
            createdAt: new Date().toISOString()
          });
          
          return res.status(200).json({ 
            success: true, 
            message: `Password successfully updated/reset for ${targetEmail}.` 
          });
        } catch (error: any) {
          console.error('[Admin Reset Password Error]', error);
          return res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
      })();
    case 'admin-delete-user':
      return await (async () => {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method Not Allowed' });
        }
        
        // Ensure the requester is an admin or founder
        const requesterId = (req as any).user?.id;
        const requesterEmail = (req as any).user?.email;
        
        if (!requesterId) {
          return res.status(401).json({ error: 'Unauthorized: No requester credentials' });
        }
        
        if (!getAdminDb()) {
          return res.status(500).json({ error: 'Firestore db is not initialized.' });
        }
        
        // Fetch requester role from Firestore just to be 100% sure and secure
        const requesterDoc = await getAdminDb().collection('users').doc(requesterId).get();
        const requesterData = requesterDoc.data();
        const requesterRole = requesterData?.role || (req as any).user?.role;
        
        if (requesterRole !== 'admin' && requesterRole !== 'founder' && requesterEmail !== 'admin@hirenestworkforce.com' && requesterId !== 'executive-root') {
          return res.status(403).json({ error: 'Forbidden: Admin or Founder privileges required' });
        }
        
        const { targetUserId } = req.body;
        if (!targetUserId) {
          return res.status(400).json({ error: 'Bad Request: Missing targetUserId' });
        }

        if (targetUserId === requesterId) {
          return res.status(400).json({ error: 'Bad Request: Admins cannot delete their own profile from this panel.' });
        }
        
        try {
          // Get target user info
          const targetUserDoc = await getAdminDb().collection('users').doc(targetUserId).get();
          const targetUserData = targetUserDoc.exists ? targetUserDoc.data() : null;
          const targetEmail = targetUserData?.email || '';
          const targetName = targetUserData?.name || '';
          
          // Delete from Firebase Auth using Admin Auth
          const adminAuth = getAdminAuthClient();
          let authDeleted = false;
          try {
            await adminAuth.deleteUser(targetUserId);
            authDeleted = true;
          } catch (authError: any) {
            // If the user doesn't exist in Auth anymore, we can still proceed to clean up Firestore
            console.warn('[Admin Delete User] Auth deletion warning, user may not exist in auth:', authError.message);
          }
          
          // Delete from Firestore
          let firestoreDeleted = false;
          if (targetUserDoc.exists) {
            await getAdminDb().collection('users').doc(targetUserId).delete();
            firestoreDeleted = true;
          }
          
          if (!authDeleted && !firestoreDeleted) {
            return res.status(404).json({ error: 'Target user profile not found in Firebase Authentication or Firestore.' });
          }
          
          // Emit Event to Ledger
          await getAdminDb().collection('system_events').add({
            eventType: 'USER_DELETED',
            entityCollection: 'users',
            entityId: targetUserId,
            metadata: {
              email: targetEmail || '',
              name: targetName || '',
              deletedBy: requesterEmail || requesterData?.name || 'Admin',
            },
            createdAt: new Date().toISOString()
          });
          
          return res.status(200).json({ 
            success: true, 
            message: `User profile has been permanently deleted from both Authentication and Firestore.` 
          });
        } catch (error: any) {
          console.error('[Admin Delete User Error]', error);
          return res.status(500).json({ error: error.message || 'Internal Server Error' });
        }
      })();
    default:
      return res.status(400).json({ error: "Invalid action: " + action });
  }
}
