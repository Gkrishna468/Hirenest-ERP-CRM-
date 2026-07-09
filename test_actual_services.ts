import { requirementService } from "./src/server/services/RequirementService";
import { candidateService } from "./src/server/services/CandidateService";
import { clientService } from "./src/server/services/ClientService";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";

async function run() {
  const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
  
  initializeApp({
    credential: applicationDefault(),
    projectId: config.projectId
  });

  const userContext = {
    userId: "0xpXdzSQE6V92xbnCkiczPHexiU2",
    email: "gopal@hirenestworkforce.com",
    role: "admin",
    organizationId: "ORG-GLOBAL-HQ",
    workspace: "Executive"
  };

  console.log("=== TESTING ACTUAL SERVER SERVICES WITH REAL CONTEXT ===");
  
  try {
    const clients = await clientService.list(userContext);
    console.log(`Clients list count: ${clients.length}`);
    if (clients.length > 0) {
      console.log(`First client: id=${clients[0].id}, company=${clients[0].company}, orgId=${clients[0].organizationId}`);
    }
  } catch (err: any) {
    console.error("ClientService list error:", err.message, err.stack);
  }

  try {
    const requirements = await requirementService.list(userContext);
    console.log(`Requirements list count: ${requirements.length}`);
    if (requirements.length > 0) {
      console.log(`First requirement: id=${requirements[0].id}, title=${requirements[0].title}, orgId=${requirements[0].organizationId}`);
    }
  } catch (err: any) {
    console.error("RequirementService list error:", err.message, err.stack);
  }

  try {
    const candidates = await candidateService.list(userContext);
    console.log(`Candidates list count: ${candidates.length}`);
    if (candidates.length > 0) {
      console.log(`First candidate: id=${candidates[0].id}, name=${candidates[0].name}, orgId=${candidates[0].organizationId}`);
    }
  } catch (err: any) {
    console.error("CandidateService list error:", err.message, err.stack);
  }

  console.log("=== TESTING COMPLETE ===");
}

run().catch(console.error);
