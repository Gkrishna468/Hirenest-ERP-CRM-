const fs = require('fs');
const content = `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase with explicit config
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Graceful Auth initialization for iframe environments
let authInstance;
try {
  authInstance = getAuth(app);
} catch (error) {
  console.error("Firebase Auth initialization failed:", error);
  // Optional: Provide a dummy or minimal auth if it critically fails,
  // but it's better to just let it be null or throw safely later.
}
export const auth = authInstance;
`;
fs.writeFileSync('src/services/firebase/config.ts', content);
