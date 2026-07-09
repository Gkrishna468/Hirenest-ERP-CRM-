import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import * as fs from "fs";
import * as path from "path";

let adminApp: any = null;
let db: Firestore | null = null;

export function getAdminApp() {
  if (adminApp) return adminApp;
  if (!getApps()?.length) {
    try {
      const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
      let projectId = process.env.FIREBASE_PROJECT_ID;
      try {
        const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!projectId) projectId = firebaseConfig.projectId;
      } catch (e) {}

      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        adminApp = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        adminApp = initializeApp({
          credential: applicationDefault(),
          projectId: projectId,
        });
      }
    } catch (error) {
      console.error("Firebase admin init error", error);
    }
  } else {
    adminApp = getApps()[0];
  }
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (db) return db;
  const app = getAdminApp();
  db = getFirestore(app);
  return db;
}

export function getAdminAuthClient() {
  const app = getAdminApp();
  return getAuth(app);
}
