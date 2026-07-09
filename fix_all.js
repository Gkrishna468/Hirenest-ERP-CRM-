import fs from 'fs';
import path from 'path';

const controllersDir = 'src/server/controllers';
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files that don't have this pattern
  if (!content.includes('firebase-admin/app')) continue;

  console.log(`Processing ${file}...`);

  // We want to remove the initializeApp block and replace it with imports
  const lines = content.split('\n');
  const newLines = [];
  let inFirebaseInit = false;
  let hasReplaced = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip old firebase imports
    if (line.includes('firebase-admin/app') || 
        line.includes('firebase-admin/firestore') || 
        line.includes('firebase-admin/auth')) {
      continue;
    }

    if (line.startsWith('let db: Firestore | null = null;') || 
        line.startsWith('let adminApp: any = null;') ||
        line.startsWith('if (!getApps()?.length)') ||
        line.startsWith('if (!getApps().length)')) {
      inFirebaseInit = true;
    }

    if (inFirebaseInit) {
      if (line.startsWith('} else {') || line.startsWith('  } catch(err) {') || line.startsWith('  try {') || line.startsWith('    const configPath =') || line.startsWith('    const firebaseConfig =') || line.startsWith('    db = getFirestore(adminApp);') || line.startsWith('  }')) {
        // still in the block
        continue;
      }
      
      // Wait, let's just find the first line after the initialization block that looks like actual code.
      // E.g. "const ALGORITHM =", "export default", "export function", "export const"
      if (line.startsWith('const ') || line.startsWith('export ') || line.startsWith('function ')) {
        inFirebaseInit = false;
        if (!hasReplaced) {
          newLines.push('import { getAdminApp, getAdminDb, getAdminAuthClient } from "../utils/firebaseAdmin";');
          hasReplaced = true;
        }
      } else {
        continue;
      }
    }

    // if we encounter references to db, adminApp, or getAdminAuth, we need to handle them inside the functions
    // actually, let's just push the lines and we'll do string replacements later
    if (!inFirebaseInit) {
        newLines.push(line);
    }
  }

  let finalContent = newLines.join('\n');
  
  // Replace instances of `db = getFirestore(...)` or `getAdminAuth(adminApp)` 
  // Wait, if we use `getAdminDb()` and `getAdminAuthClient()`, we need to change the function calls.
  
  // Actually, some functions might expect a global `db` variable!
  // Let's add:
  // const db = getAdminDb();
  // const adminApp = getAdminApp();
  // where needed? No, that's top-level await which isn't allowed in some setups, but `db` is just a getter!
  
}
