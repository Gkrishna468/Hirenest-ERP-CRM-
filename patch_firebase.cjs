const fs = require('fs');

const content = `import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence,
  getAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase with explicit config
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Graceful Auth initialization for iframe environments
let authInstance;
try {
  // Try default initialization which uses indexedDB/localStorage
  authInstance = getAuth(app);
} catch (error) {
  console.warn("Default Firebase Auth failed (likely iframe storage blocked). Trying fallback...", error);
  try {
    authInstance = initializeAuth(app, {
      persistence: inMemoryPersistence
    });
  } catch (innerError) {
    console.error("Critical Firebase Auth initialization failure:", innerError);
  }
}
export const auth = authInstance;
`;
fs.writeFileSync('src/services/firebase/config.ts', content);
