with open('src/server/controllers/setupRuntime.ts', 'r') as f:
    content = f.read()

new_content = """import * as dotenv from "dotenv";
import { AgentRuntime } from "../../runtime/AgentRuntime";
import { getAdminDb } from "../utils/firebaseAdmin";

export function setupAgentRuntime() {
  try {
    const db = getAdminDb();
    if (db) {
      const runtime = new AgentRuntime(db);
      runtime.start();
    }
  } catch (err) {
    console.error("[AgentRuntime] Failed to start:", err);
  }
}
"""

with open('src/server/controllers/setupRuntime.ts', 'w') as f:
    f.write(new_content)
