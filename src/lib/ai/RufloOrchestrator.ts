import { EventBus, DomainEvent } from "../events/EventBus";

export interface RufloAgent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "running" | "learning" | "federating";
  cognitiveLoad: number;
  tasksCompleted: number;
}

export interface RufloSwarm {
  id: string;
  name: string;
  agents: RufloAgent[];
  activeTaskCount: number;
}

class RufloMetaHarness {
  private swarms: Map<string, RufloSwarm> = new Map();
  private isInitialized = false;

  constructor() {
    this.swarms.set("recruitment-swarm", {
      id: "swarm-req-01",
      name: "Recruitment Coordination Swarm",
      activeTaskCount: 0,
      agents: [
        { id: "agent-01", name: "Alpha Matcher", role: "CV Analysis", status: "idle", cognitiveLoad: 12, tasksCompleted: 430 },
        { id: "agent-02", name: "Vendor Comm", role: "Outreach", status: "idle", cognitiveLoad: 4, tasksCompleted: 112 }
      ]
    });
    
    this.swarms.set("client-swarm", {
      id: "swarm-cli-01",
      name: "Client Intelligence Swarm",
      activeTaskCount: 0,
      agents: [
        { id: "agent-03", name: "SLA Monitor", role: "Feedback Tracking", status: "idle", cognitiveLoad: 24, tasksCompleted: 890 },
      ]
    });
  }

  public init() {
    if (this.isInitialized) return;
    
    console.log("[Ruflo] Initializing Agent Meta-Harness...");
    
    // Subscribe to EventBus
    EventBus.subscribe("RequirementCreated", async (event) => this.routeToSwarm("recruitment-swarm", event));
    EventBus.subscribe("CandidateSubmitted", async (event) => this.routeToSwarm("client-swarm", event));
    
    this.isInitialized = true;
    console.log("[Ruflo] Connected to HireNest Event Fabric.");
  }

  private routeToSwarm(swarmId: string, event: DomainEvent) {
    console.log(`[Ruflo Orchestrator] Routing event ${event.eventType} to swarm ${swarmId}...`);
    const swarm = this.swarms.get(swarmId);
    if (swarm) {
      swarm.activeTaskCount++;
      setTimeout(() => {
        swarm.activeTaskCount = Math.max(0, swarm.activeTaskCount - 1);
        console.log(`[Ruflo Learning Loop] Swarm ${swarmId} optimized workflow based on event ${event.eventId}`);
      }, 3000);
    }
  }

  public getSwarmStatus(): RufloSwarm[] {
    return Array.from(this.swarms.values());
  }
}

export const rufloOrchestrator = new RufloMetaHarness();

// Auto-initialize when file is imported
rufloOrchestrator.init();
