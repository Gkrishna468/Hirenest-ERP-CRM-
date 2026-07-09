import * as dotenv from "dotenv";
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
