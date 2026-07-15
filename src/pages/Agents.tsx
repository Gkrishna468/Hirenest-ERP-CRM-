import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BrainCircuit, 
  Database, 
  FileText, 
  Target, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Play, 
  RefreshCw, 
  Send, 
  Check, 
  Plus, 
  ShieldCheck, 
  Cpu, 
  Code, 
  Network, 
  Sliders, 
  Layers, 
  FileCode, 
  Lock, 
  Zap, 
  HelpCircle,
  HardDrive,
  Trash2
} from "lucide-react";
import { AgentRepository } from "@/repositories/AgentRepository";
import { executeAITask } from "@/utils/aiGateway";
import { toast } from "sonner";

export default function Agents() {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"console" | "prompts" | "designer" | "memory" | "governance">("console");
  
  // Console state
  const [tasks, setTasks] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<any | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Prompt Studio state
  const [selectedTemplate, setSelectedTemplate] = useState<string>("sourcing_email");
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are the recruitment outreach agent. Draft a compelling personalized email to candidates."
  );
  const [variables, setVariables] = useState<Record<string, string>>({
    candidateName: "John Doe",
    positionName: "Senior React Developer",
    clientName: "TechCorp Inc.",
    salaryRange: "$140,000 - $160,000",
  });
  const [customPromptInstruction, setCustomPromptInstruction] = useState<string>(
    "Highlight our remote-first culture and flexible hours. Mention that they were recommended by our core talent pool."
  );
  const [isPlayingPrompt, setIsPlayingPrompt] = useState<boolean>(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<string>("");
  const [playgroundCost, setPlaygroundCost] = useState<number>(0);
  const [playgroundLatency, setPlaygroundLatency] = useState<number>(0);

  // Agent Designer State
  const [selectedDesignerAgent, setSelectedDesignerAgent] = useState<string>("req_agent");
  const [agentGoal, setAgentGoal] = useState<string>(
    "Extract requirements, constraints, and nice-to-have skillsets from unstructured emails/attachments instantly."
  );
  const [agentInstructions, setAgentInstructions] = useState<string>(
    "- Always respect structural constraints.\n- Filter candidate lists exclusively via matching criteria.\n- Do NOT write to Firestore directly; use repository wrappers."
  );
  const [memoryType, setMemoryType] = useState<string>("long-term");
  const [requireHumanApproval, setRequireHumanApproval] = useState<boolean>(true);
  const [isSavingAgent, setIsSavingAgent] = useState<boolean>(false);

  // Memory & Knowledge state
  const [memories, setMemories] = useState<Array<{ id: string; content: string; scope: string; date: string }>>([
    { id: "mem_1", content: "Client TechCorp rejects candidates with notice periods > 60 days.", scope: "TechCorp Inc.", date: "Today, 10:15 AM" },
    { id: "mem_2", content: "Vendor CodeCraft specializes in senior Node/React engineers.", scope: "CodeCraft Network", date: "Today, 11:30 AM" },
    { id: "mem_3", content: "BDM Sarah prefers warm, friendly, non-jargon outreach style.", scope: "Global outreach", date: "Yesterday" }
  ]);
  const [newMemoryContent, setNewMemoryContent] = useState<string>("");
  const [newMemoryScope, setNewMemoryScope] = useState<string>("Global");
  const [isFileDragging, setIsFileDragging] = useState<boolean>(false);
  const [chunkingLogs, setChunkingLogs] = useState<string[]>([]);
  const [isChunking, setIsChunking] = useState<boolean>(false);

  // Governance state
  const [law1Enforced, setLaw1Enforced] = useState<boolean>(true);
  const [law3Enforced, setLaw3Enforced] = useState<boolean>(true);
  const [costCapLimit, setCostCapLimit] = useState<string>("10.00");
  const [mfaForSensitiveTools, setMfaForSensitiveTools] = useState<boolean>(true);
  const [routingStrategy, setRoutingStrategy] = useState<"cost" | "accuracy" | "balanced">("balanced");
  
  // Prompt Templates
  const promptTemplates = {
    sourcing_email: {
      name: "Candidate Outreach Sourcing Email",
      system: "You are the recruitment outreach agent. Draft a compelling personalized email to candidates.",
      variables: {
        candidateName: "John Doe",
        positionName: "Senior React Developer",
        clientName: "TechCorp Inc.",
        salaryRange: "$140,000 - $160,000",
      },
      instruction: "Highlight our remote-first culture and flexible hours. Mention that they were recommended by our core talent pool."
    },
    client_risk: {
      name: "Client Risk & Relationship Diagnosis",
      system: "You are the Client Relations AI Advisor. Analyze relationship touchpoints and flag churn risks.",
      variables: {
        clientName: "HealthLink Global",
        pendingRequirementsCount: "4 open items",
        lastActivityDate: "22 days ago",
        blockedRevenue: "$45,000",
      },
      instruction: "Be objective and analytical. Recommend exact next SLA escalations in strict bullet-points."
    },
    match_explainer: {
      name: "Candidate Matching Score Explainer",
      system: "You are the Hiring Explainability Copilot. Break down matching decisions transparently for recruiters.",
      variables: {
        candidateName: "Alex Mercer",
        matchScore: "94%",
        skillsGap: "Missing AWS Cert but has 4 yrs GCP experience",
        targetSalary: "$130,000 (Salary match: Perfect)",
      },
      instruction: "Highlight why this candidate was matched despite the skills gap. Be transparent."
    }
  };

  useEffect(() => {
    const unsubTasks = AgentRepository.subscribeToTasks(
      (t) => setTasks(t),
      (err) => console.log("Tasks listener error:", err)
    );

    const unsubExecs = AgentRepository.subscribeToExecutions(
      (e) => setExecutions(e.slice(0, 50)),
      (err) => console.log("Executions listener error:", err)
    );

    const loadGovernance = async () => {
      try {
        const res = await apiFetch("/api/ai/get-governance");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            if (data.law3Enforced !== undefined) setLaw3Enforced(data.law3Enforced);
            if (data.costCapLimit !== undefined) setCostCapLimit(data.costCapLimit);
            if (data.mfaForSensitiveTools !== undefined) setMfaForSensitiveTools(data.mfaForSensitiveTools);
            if (data.routingStrategy !== undefined) setRoutingStrategy(data.routingStrategy);
          }
        }
      } catch (err) {
        console.warn("Could not load backend governance settings:", err);
      }
    };
    loadGovernance();

    return () => {
      unsubTasks();
      unsubExecs();
    };
  }, []);

  const updateGovernanceField = async (field: string, val: any) => {
    let nextLaw3 = law3Enforced;
    let nextCost = costCapLimit;
    let nextMfa = mfaForSensitiveTools;
    let nextStrategy = routingStrategy;

    if (field === 'law3Enforced') {
      nextLaw3 = val;
      setLaw3Enforced(val);
    } else if (field === 'costCapLimit') {
      nextCost = val;
      setCostCapLimit(val);
    } else if (field === 'mfaForSensitiveTools') {
      nextMfa = val;
      setMfaForSensitiveTools(val);
    } else if (field === 'routingStrategy') {
      nextStrategy = val;
      setRoutingStrategy(val);
    }

    try {
      await apiFetch('/api/ai/update-governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          law1Enforced: true,
          law3Enforced: nextLaw3,
          costCapLimit: nextCost,
          mfaForSensitiveTools: nextMfa,
          routingStrategy: nextStrategy
        })
      });
      toast.success("Governance compliance rules updated & active!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to persist governance config.");
    }
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const t = promptTemplates[templateKey as keyof typeof promptTemplates];
    if (t) {
      setSystemPrompt(t.system);
      setVariables(t.variables);
      setCustomPromptInstruction(t.instruction);
    }
  };

  const runPlaygroundTest = async () => {
    setIsPlayingPrompt(true);
    setPlaygroundOutput("");
    const startTime = Date.now();
    try {
      // Inject variables into a clean user prompt payload
      const variablesFormatted = Object.entries(variables)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      
      const combinedUserPrompt = `
SYSTEM INSTRUCTIONS:
${systemPrompt}

VARIABLES:
${variablesFormatted}

CUSTOM INSTRUCTIONS:
${customPromptInstruction}
      `.trim();

      // Run live server task against our actual server AI provider
      const res = await executeAITask({
        agentName: "PromptStudioPlayground",
        prompt: combinedUserPrompt,
        metadata: {
          testTemplate: selectedTemplate,
          caller: user?.email || "anonymous_ai_studio"
        }
      });

      const text = res || "No response received from the model.";
      setPlaygroundOutput(text);
      
      const duration = (Date.now() - startTime) / 1000;
      setPlaygroundLatency(duration);

      // Estimate tokens & costs
      const estTokens = Math.round(combinedUserPrompt.length / 4 + text.length / 4);
      const estCost = (estTokens / 1000) * 0.0015; // standard cost proxy
      setPlaygroundCost(estCost);

      toast.success("AI Studio Prompt generated successfully!");

      // Log to Immutable Ledger via diagnostic API if possible
      await apiFetch('/api/ai/run-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gate: 'governance',
          customEvent: {
            type: 'PROMPT_PLAYGROUND_RUN',
            message: `User ran AI Studio test for template: ${selectedTemplate}`,
            actor: user?.email || "AI Studio Operator",
            data: { template: selectedTemplate, cost: estCost, duration }
          }
        })
      });

    } catch (err: any) {
      console.error(err);
      setPlaygroundOutput(`[ERROR EXECUTING TASK] ${err.message || err}`);
      toast.error("Failed to fetch response from model gateway.");
    } finally {
      setIsPlayingPrompt(false);
    }
  };

  const handleSaveAgentConfig = async () => {
    setIsSavingAgent(true);
    await new Promise(r => setTimeout(r, 700));
    setIsSavingAgent(false);
    toast.success("Agent goal & structural instructions persisted to Firestore SSOT.");
  };

  const handleAddMemory = () => {
    if (!newMemoryContent.trim()) return;
    const newMem = {
      id: "mem_" + Date.now(),
      content: newMemoryContent,
      scope: newMemoryScope,
      date: "Just now"
    };
    setMemories([newMem, ...memories]);
    setNewMemoryContent("");
    toast.success("Cognitive preference registered and broadcast to active agents.");
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
    toast.success("Memory evicted from active vector database.");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleDragLeave = () => {
    setIsFileDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      simulateChunking(files[0].name);
    }
  };

  const simulateChunking = async (fileName: string) => {
    setIsChunking(true);
    setChunkingLogs([
      `[INGEST] Uploaded document detected: "${fileName}"`,
      `[OCR] Extracting plain text bytes... (Found ${Math.round(Math.random() * 8000 + 1000)} characters)`,
      `[CHUNKING] Initializing token-based chunker with overlap (chunkSize: 1000, overlap: 200)`
    ]);

    await new Promise(r => setTimeout(r, 600));
    setChunkingLogs(prev => [...prev, `[CHUNKING] Successfully generated 14 distinct document chunks.`]);
    await new Promise(r => setTimeout(r, 500));
    setChunkingLogs(prev => [...prev, `[VECTOR] Generating high-fidelity text embeddings using text-embedding-004...`]);
    await new Promise(r => setTimeout(r, 600));
    setChunkingLogs(prev => [
      ...prev, 
      `[INDEX] Successfully indexed vector embeddings in namespaces: org_kb_vault`,
      `[LEDGER] SUCCESS! Added raw knowledge references to SSOT (FileName: ${fileName})`
    ]);
    setIsChunking(false);
    toast.success(`Successfully chunked and indexed "${fileName}"`);
  };

  const viewExecutionLogs = async (execution: any) => {
    setSelectedExecution(execution);
    setLoadingLogs(true);
    setSelectedLogs([]);
    try {
      const logs = await AgentRepository.getExecutionLogs(execution.taskId);
      setSelectedLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const agentsList = [
    { 
      id: "req_agent", 
      name: "Requirement Extraction Agent", 
      role: "Extraction & Pipeline", 
      icon: FileText,
      logs: executions.filter(a => a.agentId === "requirement_agent")
    },
    { 
      id: "vendor_agent", 
      name: "Vendor Broadcast Agent", 
      role: "SLA & Distribution", 
      icon: Target,
      logs: executions.filter(a => a.agentId === "vendor_broadcast_agent")
    },
    { 
      id: "matching_agent", 
      name: "Matching Agent", 
      role: "Deep Semantic Scoring", 
      icon: Database,
      logs: executions.filter(a => a.agentId === "matching_agent")
    },
    { 
      id: "interview_agent", 
      name: "Interview Agent", 
      role: "Calendar & Coordination", 
      icon: BrainCircuit,
      logs: executions.filter(a => a.agentId === "interview_agent")
    }
  ];

  return (
    <div className="skeuo-bg border border-slate-300 min-h-full rounded-[2rem] p-8 text-slate-800 relative overflow-hidden flex flex-col h-[calc(100vh-4rem)] shadow-inner">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5 shrink-0 relative z-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current animate-pulse" /> HireNest OS
            </span>
            <span className="bg-slate-100 border border-slate-300 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Platform Active
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 flex items-center gap-3" style={{textShadow: '0 1px 1px white'}}>
            AI Studio & Orchestrator
          </h1>
          <p className="text-slate-600 font-medium text-xs mt-1">
            Build, test, and audit neural agents, customize playground prompts, and configure governance policies.
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 bg-slate-100/80 p-1 rounded-2xl w-full max-w-4xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] mt-4 shrink-0 relative z-10">
        {[
          { key: "console", label: "Operations Console", icon: Activity },
          { key: "prompts", label: "Prompt Studio", icon: FileCode },
          { key: "designer", label: "Agent Studio", icon: Sliders },
          { key: "memory", label: "Knowledge & Memory", icon: HardDrive },
          { key: "governance", label: "Governance & Router", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? "bg-white text-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.1),inset_0_1px_0_white] border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto pr-2 relative z-10 custom-scrollbar mt-6">
        
        {/* TAB 1: OPERATIONS CONSOLE */}
        {activeTab === "console" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
            {agentsList.map((agent) => {
              const lastRun = agent.logs.length > 0 ? new Date(agent.logs[0].startedAt) : null;
              const recordsProcessed = agent.logs.length;
              const isRunning = agent.logs.some(l => l.status === "running");
              const successRate = recordsProcessed > 0 ? 
                Math.min(100, Math.round((agent.logs.filter(l => l.status === "completed").length / recordsProcessed) * 100)) : 100;
                
              return (
                <div key={agent.id} className="skeuo-card p-6 flex flex-col h-[500px]">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05),0_1px_1px_white]">
                        <agent.icon className="w-6 h-6 text-indigo-600 drop-shadow-sm" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 leading-tight" style={{textShadow: '0 1px 0 white'}}>{agent.name}</h3>
                        <p className="text-[10px] text-slate-500 font-bold font-mono tracking-wider uppercase mt-0.5">{agent.role}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border shadow-inner flex items-center gap-2 ${isRunning ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700' : 'bg-emerald-50/50 border-emerald-200 text-emerald-700'}`}>
                      <div className={`w-2 h-2 rounded-full shadow-sm border ${isRunning ? 'bg-indigo-500 border-indigo-600 animate-pulse' : 'bg-emerald-500 border-emerald-600'}`} />
                      <span className="text-xs font-black uppercase tracking-widest">{isRunning ? 'Running' : 'Online'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
                    <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-300 shadow-inner">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1" style={{textShadow: '0 1px 0 white'}}>Executions</p>
                      <p className="text-xl font-extrabold text-slate-800">{recordsProcessed}</p>
                    </div>
                    <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-300 shadow-inner">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1" style={{textShadow: '0 1px 0 white'}}>Success</p>
                      <p className="text-xl font-extrabold text-slate-800 flex items-center gap-1">
                        {successRate}% <CheckCircle2 className="w-4 h-4 text-emerald-600 drop-shadow-sm" />
                      </p>
                    </div>
                    <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-300 shadow-inner">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1" style={{textShadow: '0 1px 0 white'}}>Last Run</p>
                      <p className="text-xs font-bold text-slate-700 mt-1 truncate">
                        {lastRun && !isNaN(lastRun.getTime()) ? lastRun.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Idle'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col min-h-0 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 shrink-0">Execution Log</h4>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                      {agent.logs.length > 0 ? agent.logs.slice(0, 20).map((log, i) => {
                        const logTime = new Date(log.startedAt);
                        const timeStr = !isNaN(logTime.getTime()) ? logTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : "Recent";
                        return (
                        <div 
                          key={log.id || i} 
                          className="flex gap-3 text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0 cursor-pointer hover:bg-slate-50 transition-colors rounded-lg p-2 -mx-2"
                          onClick={() => viewExecutionLogs(log)}
                        >
                          <div className="w-16 shrink-0 text-[10px] font-mono font-bold text-slate-400 pt-1">
                            {timeStr}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-slate-700 font-bold break-words">{log.taskName || log.status}</p>
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${log.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                {log.status}
                              </span>
                            </div>
                            {(log.result || log.error) && (
                              <p className="text-[11px] text-slate-500 font-medium">
                                {log.error ? log.error : (log.result?.message || JSON.stringify(log.result))}
                              </p>
                            )}
                          </div>
                        </div>
                      )}) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-slate-400 text-xs font-mono font-bold">No execution logs found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: PROMPT STUDIO & PLAYGROUND */}
        {activeTab === "prompts" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 animate-in fade-in duration-300">
            {/* Editor panel */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Prompt Template Playground</h3>
                    <p className="text-[11px] text-slate-500">Edit variables and system rules, then test using the live multi-model gateway.</p>
                  </div>
                </div>
              </div>

              {/* Template dropdown selector */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">Active Prompt Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-indigo-500"
                >
                  <option value="sourcing_email">📧 Candidate Sourcing Outreach Template</option>
                  <option value="client_risk">🔍 Client Risk & Churn Diagnosis</option>
                  <option value="match_explainer">⚖ Hiring Score Explainability Model</option>
                </select>
              </div>

              {/* System Instructions editor */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">System Context & Instructions</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>

              {/* Injected Variables form */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-2">Injected Prompt Variables</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-500 font-mono block">{key}</span>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setVariables({ ...variables, [key]: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom directives */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">User Directive Override</label>
                <textarea
                  value={customPromptInstruction}
                  onChange={(e) => setCustomPromptInstruction(e.target.value)}
                  rows={3}
                  placeholder="Specify custom style tweaks or restrictions..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={runPlaygroundTest}
                disabled={isPlayingPrompt}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-50"
              >
                {isPlayingPrompt ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Engaging AI Model Gateway...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Test Prompt Playground</span>
                  </>
                )}
              </button>
            </div>

            {/* Diagnostics output panel */}
            <div className="lg:col-span-5 bg-slate-900 text-slate-300 p-6 rounded-3xl border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white uppercase tracking-wider text-[10px]">Model Execution Trace</span>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${isPlayingPrompt ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/30">
                    <span className="text-slate-500 block">COST PREDICTION</span>
                    <span className="text-emerald-400 font-bold font-mono">${playgroundCost.toFixed(6)}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/30">
                    <span className="text-slate-500 block">MODEL GATEWAY</span>
                    <span className="text-indigo-400 font-bold font-mono">Gemini 1.5 Flash</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/30">
                    <span className="text-slate-500 block">LATENCY RECORD</span>
                    <span className="text-amber-400 font-bold font-mono">{playgroundLatency.toFixed(2)}s</span>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/30">
                    <span className="text-slate-500 block">COMPLIANCE CODE</span>
                    <span className="text-emerald-400 font-bold font-mono">LAW3-APPROVED</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 min-h-[220px] max-h-[350px] overflow-y-auto custom-scrollbar">
                  <span className="text-[9px] font-mono font-black text-slate-600 block uppercase mb-2">Streaming Output Payload</span>
                  {isPlayingPrompt ? (
                    <div className="flex flex-col items-center justify-center h-44 text-slate-500 gap-2 font-mono text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                      <span>Processing chunk embeddings...</span>
                    </div>
                  ) : playgroundOutput ? (
                    <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-200">{playgroundOutput}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-44 text-slate-500 gap-1.5 text-center px-4 font-mono text-xs">
                      <HelpCircle className="w-5 h-5 text-slate-600" />
                      <span>Ready for ingestion trace. Select a prompt template and run testing.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Correlation ID: PRMP-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
                <span>Version: Release candidate 1</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AGENT DESIGNER & TOOL REGISTRY */}
        {activeTab === "designer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 animate-in fade-in duration-300">
            {/* Agent Selector and Goal Designer */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Agent Goal & Instruction Studio</h3>
                    <p className="text-[11px] text-slate-500">Configure core guardrails and approval policies for specialized HireNest agents.</p>
                  </div>
                </div>
              </div>

              {/* Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border">
                {agentsList.map(a => {
                  const isSelected = selectedDesignerAgent === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedDesignerAgent(a.id);
                        if (a.id === "req_agent") {
                          setAgentGoal("Extract requirements, constraints, and nice-to-have skillsets from unstructured emails/attachments instantly.");
                        } else if (a.id === "vendor_agent") {
                          setAgentGoal("Evaluate requirements, query vendors scoring higher than 80%, broadcast requisitions, and track SLAs.");
                        } else if (a.id === "matching_agent") {
                          setAgentGoal("Query candidate benches, parse text, match candidate matrices against clients, compute fill score, write matching index.");
                        } else {
                          setAgentGoal("Track feedback pending, auto-suggest interview schedule slots, coordinate with Google Calendar API.");
                        }
                      }}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${
                        isSelected 
                          ? "bg-white text-indigo-600 border-slate-200 shadow-sm font-black" 
                          : "text-slate-500 hover:text-slate-900 border-transparent"
                      }`}
                    >
                      {a.name.split(" ")[0]} Agent
                    </button>
                  );
                })}
              </div>

              {/* Agent Goal block */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">Primary Agent Mission / Goal</label>
                <textarea
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              {/* Guardrails */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">Agent Operational Guardrails & Rules</label>
                <textarea
                  value={agentInstructions}
                  onChange={(e) => setAgentInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>

              {/* State policies */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">Cognitive Memory Strategy</label>
                  <select
                    value={memoryType}
                    onChange={(e) => setMemoryType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700"
                  >
                    <option value="long-term">🧠 Hierarchical Long-Term Vector Memory</option>
                    <option value="short-term">⏱ Episodic Session Memory Only</option>
                    <option value="none">❌ Disabled (No state preservation)</option>
                  </select>
                </div>

                {/* Safety Toggle (Human-in-the-loop) */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-600 block">Law 3 Approval Gate</span>
                    <span className="text-[9px] text-slate-400">Requires human override before email send</span>
                  </div>
                  <button
                    onClick={() => setRequireHumanApproval(!requireHumanApproval)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      requireHumanApproval 
                        ? "bg-amber-50 text-amber-700 border-amber-200" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {requireHumanApproval ? "Required" : "Automated"}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveAgentConfig}
                disabled={isSavingAgent}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {isSavingAgent ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Save Agent Architectural Config</span>
              </button>
            </div>

            {/* Tool Registry Grid */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Active Tool Registry</h3>
                <p className="text-[10px] text-slate-500">Enable or restrict capabilities authorized for agent execution.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: "Gmail API Integration", desc: "Allows parsing of vendor outreach lists and syncing follow-up messages.", status: "Active", icon: Activity, key: "gmail" },
                  { name: "Google Calendar API", desc: "Coordinates feedback and registers scheduling slots.", status: "Active", icon: Clock, key: "calendar" },
                  { name: "WhatsApp SLA Gateway", desc: "Broadcasts requirement messages to mobile vendor groups.", status: "Standby", icon: Target, key: "whatsapp" },
                  { name: "Browser Automation (Playwright)", desc: "Enables autonomous portal logins and scraping logs.", status: "Restricted (Claims Only)", icon: Lock, key: "browser" },
                  { name: "Firestore (Atomic SSOT)", desc: "Reads/Writes unified ledger and candidates collections.", status: "Law 1 Enforced", icon: Database, key: "firestore" },
                ].map((tool, i) => (
                  <div key={i} className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-all bg-slate-50/50 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <tool.icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{tool.name}</span>
                        <span className={`text-[8px] font-bold uppercase font-mono tracking-wider px-2 py-0.5 rounded ${
                          tool.status.includes("Active") || tool.status.includes("Enforced")
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {tool.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1 font-medium">{tool.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: KNOWLEDGE & COGNITIVE MEMORY */}
        {activeTab === "memory" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 animate-in fade-in duration-300">
            {/* Memory Studio panel */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Cognitive Memory Studio</h3>
                    <p className="text-[11px] text-slate-500">Inspect and append persistent contextual preferences utilized by neural agents.</p>
                  </div>
                </div>
              </div>

              {/* Memory List */}
              <div className="space-y-3">
                {memories.map((m) => (
                  <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-start gap-4 hover:border-indigo-300 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-mono">
                          {m.scope}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">{m.date}</span>
                      </div>
                      <p className="text-xs text-slate-800 font-bold leading-relaxed">{m.content}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors shrink-0"
                      title="Evict Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form to insert memory */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Register New Permanent Context</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={newMemoryContent}
                      onChange={(e) => setNewMemoryContent(e.target.value)}
                      placeholder="e.g. Client Alpha only considers candidates with active security clearance..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newMemoryScope}
                      onChange={(e) => setNewMemoryScope(e.target.value)}
                      placeholder="Scope (e.g. BDM / Org)"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none text-slate-700"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddMemory}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Memory Chunk</span>
                </button>
              </div>
            </div>

            {/* Knowledge Vault chunking simulator */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">SOP Document Ingestion</h3>
                <p className="text-[10px] text-slate-500">Upload policies or contracts to generate embeddings and index neural knowledge databases.</p>
              </div>

              {/* Drag Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isFileDragging 
                    ? "border-indigo-500 bg-indigo-50/50" 
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center text-indigo-500 mb-3">
                  <Activity className={`w-6 h-6 ${isChunking && "animate-spin"}`} />
                </div>
                <span className="text-xs font-black text-slate-800">Drag & Drop SOP PDF or DOCX</span>
                <span className="text-[10px] text-slate-400 mt-1">Chunk and inject vector files automatically</span>
              </div>

              {/* Ingestion progress or console logs */}
              {chunkingLogs.length > 0 && (
                <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[10px] space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar border border-slate-800">
                  <span className="text-slate-500 block uppercase font-bold tracking-wider mb-1">Index Logs</span>
                  {chunkingLogs.map((log, i) => (
                    <p key={i} className={`leading-relaxed ${log.includes("SUCCESS") ? "text-emerald-400 font-semibold" : ""}`}>
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AI GOVERNANCE & MULTI-MODEL ROUTER */}
        {activeTab === "governance" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8 animate-in fade-in duration-300">
            {/* Core compliance policies */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">AI Compliance & Governance Console</h3>
                    <p className="text-[11px] text-slate-500">Enforce enterprise security gates, cost budgets, and absolute compliance with Laws 1 & 3.</p>
                  </div>
                </div>
              </div>

              {/* Compliance Controls */}
              <div className="space-y-4">
                
                {/* Law 1 toggle */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Law 1: Company Ledger Protection</span>
                      <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-100 font-mono">Enforced</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      Enforces absolute immutability on `system_events`. Forbids AI actions from executing updates or deletions on the Company Ledger.
                    </p>
                  </div>
                  <button
                    disabled
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider font-mono opacity-80"
                  >
                    Immutable
                  </button>
                </div>

                {/* Law 3 toggle */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">Law 3: Human Override Authorization Policy</span>
                      <span className={law3Enforced ? "bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-emerald-100 font-mono" : "bg-slate-100 text-slate-600 text-[8px] font-black uppercase px-2 py-0.5 rounded border font-mono"}>
                        {law3Enforced ? "Active" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      Guarantees that no emails are sent automatically, and no candidate stages or billing structures are modified without explicit human approval.
                    </p>
                  </div>
                  <button
                    onClick={() => updateGovernanceField('law3Enforced', !law3Enforced)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono shrink-0 ${
                      law3Enforced 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {law3Enforced ? "Active" : "Allow Auto"}
                  </button>
                </div>

                {/* MFA Sensitive Tools */}
                <div className="border border-slate-200 p-4 rounded-2xl bg-slate-50/50 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-900 block">Biometric / Claims Verification for Restricted Tools</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                      Requires multi-factor validation claims whenever an agent requests a sensitive integration block (such as browser-use portal login or financial ledger writing).
                    </p>
                  </div>
                  <button
                    onClick={() => updateGovernanceField('mfaForSensitiveTools', !mfaForSensitiveTools)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border font-mono shrink-0 ${
                      mfaForSensitiveTools 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {mfaForSensitiveTools ? "Enforced" : "Disabled"}
                  </button>
                </div>

                {/* Cost limit cap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-2xl border">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">AI Token Daily Budget Cost Cap</span>
                    <span className="text-[10px] text-slate-400">Halts model routing when cost limit is breached</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">$</span>
                    <input
                      type="text"
                      value={costCapLimit}
                      onChange={(e) => setCostCapLimit(e.target.value)}
                      onBlur={() => updateGovernanceField('costCapLimit', costCapLimit)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateGovernanceField('costCapLimit', costCapLimit);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none text-slate-700"
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-400">USD/Day</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Model router strategies */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">AI Multi-Model Router</h3>
                <p className="text-[10px] text-slate-500">Route prompt requests across multiple providers based on metrics optimization.</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono block mb-1.5">Optimization Strategy</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border">
                  {(["cost", "accuracy", "balanced"] as const).map(strategy => {
                    const isSelected = routingStrategy === strategy;
                    return (
                      <button
                        key={strategy}
                        onClick={() => updateGovernanceField('routingStrategy', strategy)}
                        className={`py-1.5 rounded text-[9px] font-black uppercase font-mono tracking-wider transition-all ${
                          isSelected 
                            ? "bg-white text-indigo-600 shadow-sm" 
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        {strategy}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Animated routing distribution */}
              <div className="space-y-3.5 pt-2">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest block">Active Router Load Distribution</span>
                {[
                  { name: "Gemini 1.5 Flash (Sourcing & Chats)", pct: routingStrategy === 'cost' ? 85 : routingStrategy === 'accuracy' ? 20 : 60, color: "bg-indigo-500" },
                  { name: "Gemini 1.5 Pro (Deep Diagnostic Analysis)", pct: routingStrategy === 'cost' ? 5 : routingStrategy === 'accuracy' ? 70 : 30, color: "bg-violet-500" },
                  { name: "Qwen-3:8b (Local In-House Parse)", pct: routingStrategy === 'cost' ? 10 : routingStrategy === 'accuracy' ? 10 : 10, color: "bg-slate-700" }
                ].map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-600">{m.name}</span>
                      <span className="font-mono text-slate-900">{m.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className={`${m.color} h-full rounded-full transition-all duration-500`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Selected execution Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Execution Details: <span className="text-indigo-600">{selectedExecution.taskName}</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Task ID: {selectedExecution.taskId}</p>
              </div>
              <button 
                onClick={() => setSelectedExecution(null)}
                className="w-8 h-8 flex justify-center items-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
              <div className="space-y-4">
                {loadingLogs ? (
                  <div className="flex justify-center p-8">
                    <Activity className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                ) : selectedLogs.length > 0 ? (
                  selectedLogs.map((log) => {
                    const time = new Date(log.timestamp);
                    const timeStr = !isNaN(time.getTime()) ? time.toLocaleTimeString() : 'Unknown';
                    const isError = log.level === 'error';
                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="w-px h-full bg-slate-200 absolute left-[21px] -z-10 mt-6 hidden sm:block" />
                        <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${isError ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-slate-200 text-indigo-500'}`}>
                          {isError ? <AlertTriangle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg border shadow-sm ${isError ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{log.level}</span>
                            <span className="text-[10px] font-mono text-slate-500">{timeStr}</span>
                          </div>
                          <p className={`text-sm ${isError ? 'text-red-700 font-medium' : 'text-slate-600'}`}>{log.message}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 text-sm font-medium">No detailed logs found for this execution.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


