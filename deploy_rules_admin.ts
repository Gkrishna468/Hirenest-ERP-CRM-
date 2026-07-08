import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getSecurityRules } from "firebase-admin/security-rules";
import * as fs from "fs";

async function run() {
  const rules = fs.readFileSync("firestore.rules", "utf8");
  const app = initializeApp({
    credential: applicationDefault(),
    projectId: "hirenest-os"
  });
  
  const rulesService = getSecurityRules(app);
  const ruleset = await rulesService.createFirestoreRuleset(rules);
  await rulesService.releaseFirestoreRuleset(ruleset);
  console.log("Rules deployed via Admin SDK successfully");
}

run().catch(console.error);
