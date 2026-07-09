import React, { useState, useEffect } from "react";
import { 
  Clock, 
  User, 
  Briefcase, 
  CheckCircle2, 
  Send, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle,
  Upload, 
  Phone, 
  Mail, 
  Check, 
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Plus
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface WorkflowTimelineProps {
  entityType: "candidate" | "requirement" | "submission" | "vendor" | "client";
  entityId: string;
  onStageChange?: (newStage: string) => void;
}

export default function WorkflowTimeline({ entityType, entityId, onStageChange }: WorkflowTimelineProps) {
  const { apiFetch, user } = useAuth();
  const { refreshAll } = useData();
  
  const [activeSubTab, setActiveSubTab] = useState<"timeline" | "comms" | "docs" | "ai" | "raw">("timeline");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState<string>("");
  
  // Interactive communication logger state
  const [commChannel, setCommChannel] = useState<"email" | "call" | "whatsapp" | "notes">("email");
  const [commContent, setCommContent] = useState("");
  const [commSubject, setCommSubject] = useState("");
  const [isLoggingComm, setIsLoggingComm] = useState(false);

  // Document upload state
  const [documents, setDocuments] = useState<any[]>([
    { id: "doc-1", name: "Candidate_Resume_Parsed.pdf", type: "Resume", size: "1.2 MB", uploadedAt: "2026-07-01T10:11:12Z", uploadedBy: "System Parser" },
    { id: "doc-2", name: "MSA_Signed_Executed.pdf", type: "Agreement", size: "450 KB", uploadedAt: "2026-07-02T14:22:15Z", uploadedBy: "Gopal Krishna" }
  ]);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Resume");

  // Load contextual events and state
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/system_events?entityType=${entityType}&entityId=${entityId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Error loading workflow events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [entityType, entityId]);

  // Determine standard pipeline stages
  const getPipelineStages = () => {
    if (entityType === "requirement") {
      return ["Draft", "Open", "Broadcast", "Candidate Submitted", "Interview", "Offer", "Filled", "Closed"];
    }
    if (entityType === "candidate") {
      return ["Created", "Available", "Matched", "Represented", "Submitted", "Interview", "Offer", "Placed", "Archived"];
    }
    return ["Submitted", "Client Review", "Shortlisted", "Interview Scheduled", "Interview Cleared", "Offer Released", "Offer Accepted", "Joined", "Placement Completed"];
  };

  // Resolve active entity current stage
  useEffect(() => {
    // Attempt to parse stage from latest system events
    if (events.length > 0) {
      const transitionEvent = events.find(e => e.type.includes("STAGE_CHANGED") || e.type.includes("TRANSITIONED") || e.type.includes("UPDATED"));
      if (transitionEvent?.metadata?.newStage || transitionEvent?.metadata?.stage) {
        setCurrentStage(transitionEvent.metadata.newStage || transitionEvent.metadata.stage);
        return;
      }
    }
    
    // Fallbacks
    const defaultStages = getPipelineStages();
    setCurrentStage(defaultStages[0]);
  }, [events, entityType]);

  // Action: Transition stage
  const handleTransitionStage = async (newStage: string) => {
    if (newStage === currentStage) return;
    
    try {
      const oldStage = currentStage;
      setCurrentStage(newStage);

      // 1. Log event to immutable ledger (Law 1)
      const eventId = crypto.randomUUID();
      const eventPayload = {
        id: eventId,
        type: `${entityType.toUpperCase()}_STAGE_CHANGED`,
        entityType,
        entityId,
        performedBy: user?.name || "Gopal Krishna",
        timestamp: new Date().toISOString(),
        metadata: {
          oldStage,
          newStage,
          entityId,
          role: user?.role || "recruiter",
          notes: `Recruitment engine transitioned ${entityType} status from "${oldStage}" to "${newStage}"`
        }
      };

      await apiFetch("/api/system_events", {
        method: "POST",
        body: JSON.stringify(eventPayload)
      });

      // 2. Trigger entity state update in Firestore via service
      const endpoint = entityType === "candidate" ? `/api/candidates/${entityId}` : 
                       entityType === "requirement" ? `/api/requirements/${entityId}` : 
                       `/api/submissions/${entityId}`;
                       
      await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify({ stage: newStage, status: newStage })
      });

      toast.success(`Workflow Stage updated to "${newStage}"!`, {
        description: "Immutable ledger record appended to the Company Ledger successfully."
      });

      // 3. Callback
      if (onStageChange) {
        onStageChange(newStage);
      }
      
      // Refresh context and events
      await refreshAll();
      await fetchEvents();
    } catch (err: any) {
      toast.error(`Transition failed: ${err.message}`);
    }
  };

  // Action: Log manual communication
  const handleLogCommunicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commContent.trim()) {
      toast.error("Please provide communication summary notes");
      return;
    }

    setIsLoggingComm(true);
    try {
      const eventId = crypto.randomUUID();
      const eventPayload = {
        id: eventId,
        type: "COMM_LOGGED",
        entityType,
        entityId,
        performedBy: user?.name || "Gopal Krishna",
        timestamp: new Date().toISOString(),
        metadata: {
          channel: commChannel,
          subject: commSubject || `${commChannel.toUpperCase()} Interaction`,
          content: commContent.trim(),
          role: user?.role || "recruiter",
          notes: `Contextual communication log appended via Sourcing Command Console.`
        }
      };

      await apiFetch("/api/system_events", {
        method: "POST",
        body: JSON.stringify(eventPayload)
      });

      toast.success("Interaction saved directly to entity communication timeline!");
      setCommContent("");
      setCommSubject("");
      await fetchEvents();
    } catch (err: any) {
      toast.error(`Error logging interaction: ${err.message}`);
    } finally {
      setIsLoggingComm(false);
    }
  };

  // Action: Add simulated document
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newDoc = {
      id: `doc-${Date.now()}`,
      name: docName.endsWith(".pdf") ? docName : `${docName}.pdf`,
      type: docType,
      size: "340 KB",
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || "Gopal Krishna"
    };

    setDocuments([newDoc, ...documents]);
    setDocName("");
    toast.success(`Document "${newDoc.name}" uploaded contextually.`);
    
    // Also log this to ledger
    apiFetch("/api/system_events", {
      method: "POST",
      body: JSON.stringify({
        id: crypto.randomUUID(),
        type: "DOCUMENT_UPLOADED",
        entityType,
        entityId,
        performedBy: user?.name || "Gopal Krishna",
        timestamp: new Date().toISOString(),
        metadata: {
          documentName: newDoc.name,
          documentType: docType,
          notes: `Compliance document uploaded for validation audits.`
        }
      })
    }).then(() => fetchEvents());
  };

  const stages = getPipelineStages();
  const currentStageIndex = stages.findIndex(s => s.toLowerCase() === currentStage.toLowerCase());

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
      
      {/* 1. Header & Stage Flow (Chevron Indicators) */}
      <div className="bg-slate-100/50 border-b border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              Unified Sourcing & Recruitment Pipeline
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-lg font-black text-slate-800 tracking-tight">Active Stage: {currentStage}</p>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2 py-0.5 rounded-full">
                {entityType.toUpperCase()} CONTEXT
              </span>
            </div>
          </div>
          
          {/* Action Button - Quick Increment */}
          {currentStageIndex < stages.length - 1 && (
            <button 
              onClick={() => handleTransitionStage(stages[currentStageIndex + 1])}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow shadow-indigo-500/20"
            >
              <span>Promote to {stages[currentStageIndex + 1]}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Chevron Progress flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {stages.slice(0, 8).map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;
            return (
              <button
                key={stage}
                onClick={() => handleTransitionStage(stage)}
                className={cn(
                  "py-2 px-3 text-center text-xs font-bold rounded-lg transition-all border",
                  isActive 
                    ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-500/20 scale-105 z-10" 
                    : isCompleted 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center justify-center gap-1">
                  {isCompleted && <Check className="w-3 h-3" />}
                  <span className="truncate">{stage}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 flex items-center gap-2 px-6">
        <SubTabButton active={activeSubTab === "timeline"} onClick={() => setActiveSubTab("timeline")} icon={<Clock className="w-4 h-4" />}>
          Timeline & Logs
        </SubTabButton>
        <SubTabButton active={activeSubTab === "comms"} onClick={() => setActiveSubTab("comms")} icon={<MessageSquare className="w-4 h-4" />}>
          Communication
        </SubTabButton>
        <SubTabButton active={activeSubTab === "docs"} onClick={() => setActiveSubTab("docs")} icon={<FileText className="w-4 h-4" />}>
          Documents
        </SubTabButton>
        <SubTabButton active={activeSubTab === "ai"} onClick={() => setActiveSubTab("ai")} icon={<Sparkles className="w-4 h-4 text-indigo-500" />}>
          AI Notes & RAG
        </SubTabButton>
        <SubTabButton active={activeSubTab === "raw"} onClick={() => setActiveSubTab("raw")} icon={<Database className="w-4 h-4" />}>
          Company Ledger (Law 1)
        </SubTabButton>
      </div>

      {/* Sub Tab Panel Execution Content */}
      <div className="p-6 bg-white min-h-[300px]">
        
        {/* ================= TIMELINE TAB ================= */}
        {activeSubTab === "timeline" && (
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Historical Activity Logs & Ledger</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Clock className="w-5 h-5 animate-spin mr-2" />
                Retrieving ledger entries...
              </div>
            ) : events.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No ledger activity tracked yet for this entity.</p>
                <p className="text-xs mt-1">Updates, status changes, and communication logged will display here in strict chronological sequence.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 border-l-2 border-slate-100">
                {events.map((event, idx) => {
                  const isTransition = event.type.includes("STAGE") || event.type.includes("TRANSITION");
                  const isComm = event.type === "COMM_LOGGED";
                  const isDoc = event.type === "DOCUMENT_UPLOADED";
                  
                  return (
                    <div key={event.id || idx} className="relative group">
                      {/* Left icon bullet */}
                      <span className={cn(
                        "absolute -left-[31px] top-0.5 p-1 rounded-full border-2",
                        isTransition ? "bg-indigo-50 border-indigo-500 text-indigo-600" :
                        isComm ? "bg-amber-50 border-amber-500 text-amber-600" :
                        isDoc ? "bg-emerald-50 border-emerald-500 text-emerald-600" :
                        "bg-slate-50 border-slate-400 text-slate-600"
                      )}>
                        {isTransition ? <Activity className="w-3.5 h-3.5" /> :
                         isComm ? <MessageSquare className="w-3.5 h-3.5" /> :
                         isDoc ? <FileText className="w-3.5 h-3.5" /> :
                         <Clock className="w-3.5 h-3.5" />}
                      </span>

                      <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 rounded-xl p-4 transition-all">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs font-black text-slate-800 tracking-wide">
                            {event.type.replace(/_/g, " ")}
                          </p>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {new Date(event.timestamp || event.createdAt).toLocaleString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-600 font-medium mt-1.5">
                          {event.message || event.metadata?.notes || `${entityType} state transitioned successfully.`}
                        </p>

                        <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-200/40 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span>Performed By: <span className="text-slate-600">{event.performedBy || "System Engine"}</span></span>
                          {event.metadata?.channel && <span>Channel: <span className="text-amber-600">{event.metadata.channel}</span></span>}
                          {event.metadata?.oldStage && (
                            <span>Route: <span className="text-slate-600">{event.metadata.oldStage}</span> → <span className="text-indigo-600">{event.metadata.newStage}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= COMMUNICATION TAB ================= */}
        {activeSubTab === "comms" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Communication Logger form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 h-fit space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" />
                Log Contextual Interaction
              </h4>
              
              <form onSubmit={handleLogCommunicationSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Interaction Channel</label>
                  <div className="grid grid-cols-4 gap-1.5 bg-white p-1 border border-slate-200 rounded-lg">
                    {["email", "call", "whatsapp", "notes"].map(ch => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setCommChannel(ch as any)}
                        className={cn(
                          "py-1.5 text-[10px] font-black uppercase rounded-md transition-colors",
                          commChannel === ch 
                            ? "bg-slate-900 text-white" 
                            : "text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Subject / Objective</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Schedule review, Screening questions"
                    value={commSubject}
                    onChange={e => setCommSubject(e.target.value)}
                    className="skeuo-input w-full px-3 py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Detailed Discussion Notes</label>
                  <textarea 
                    rows={4}
                    placeholder="Enter discussion logs, follow-up parameters, SLA reminders, or notes..."
                    value={commContent}
                    onChange={e => setCommContent(e.target.value)}
                    className="skeuo-input w-full p-3 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingComm}
                  className="w-full skeuo-btn-primary py-2 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow shadow-indigo-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Interaction</span>
                </button>
              </form>
            </div>

            {/* Historical Communication feed */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Historical Interaction Feed</h4>
              
              {loading ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading interaction log history...</div>
              ) : events.filter(e => e.type === "COMM_LOGGED").length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">No communications logged yet.</p>
                  <p className="text-xs mt-1">Use the left logger tool to log candidate screening questions, BDM emails, or follow-up phone calls.</p>
                </div>
              ) : (
                <div className="space-y-4.5 max-h-[400px] overflow-y-auto pr-2">
                  {events.filter(e => e.type === "COMM_LOGGED").map((comm, idx) => {
                    const channel = comm.metadata?.channel || "email";
                    return (
                      <div key={comm.id || idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase border",
                              channel === "email" ? "bg-blue-50 border-blue-200 text-blue-700" :
                              channel === "call" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                              channel === "whatsapp" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                              "bg-slate-100 border-slate-200 text-slate-600"
                            )}>
                              {channel}
                            </span>
                            <span className="font-bold text-xs text-slate-800">{comm.metadata?.subject}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{new Date(comm.timestamp).toLocaleString()}</span>
                        </div>
                        
                        <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed whitespace-pre-line">
                          {comm.metadata?.content}
                        </p>

                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 pt-2 border-t border-slate-200/40">
                          LOGGED BY: <span className="text-slate-600">{comm.performedBy}</span> | SECURITY LEVEL: AUDITABLE
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= DOCUMENTS TAB ================= */}
        {activeSubTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Upload form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 h-fit space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-500" />
                Contextual Document Vault
              </h4>

              <form onSubmit={handleAddDocument} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Document Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Candidate_Aadhar, Signed_Offer_Letter"
                    value={docName}
                    onChange={e => setDocName(e.target.value)}
                    required
                    className="skeuo-input w-full px-3 py-1.5 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Document Category</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="skeuo-input w-full px-3 py-1.5 text-xs"
                  >
                    <option value="Resume">Resume</option>
                    <option value="Agreement">Agreement / Contract</option>
                    <option value="Identity">ID Verification</option>
                    <option value="Offer">Offer Letter</option>
                    <option value="Invoice">Payout Invoice</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </form>
            </div>

            {/* Document list */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Contextual Attachments & Compliance Vault</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5 hover:bg-slate-100/50 transition-all">
                    <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg border border-emerald-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-800 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-slate-200/60 font-black text-slate-500 px-1.5 py-0.5 rounded uppercase">
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">{doc.size}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">
                        Uploaded by: <span className="text-slate-600">{doc.uploadedBy}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= AI NOTES TAB ================= */}
        {activeSubTab === "ai" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4">
              <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-black text-slate-800 text-sm tracking-tight">AI Matching & Copilot Intelligence Notes</h4>
                <p className="text-xs text-slate-500 font-medium">Dynamic, event-driven predictions derived using structural semantic patterns.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Match Insights */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  RAG Alignment Scoring
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>Semantic Fit</span>
                      <span className="text-indigo-600 font-black">92%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: "92%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                      <span>SLA Timing Probability</span>
                      <span className="text-emerald-600 font-black">Fast-track (96%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96%" }} />
                    </div>
                  </div>

                  <div className="bg-white p-3 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-600 font-medium">
                    <span className="font-bold text-indigo-700">Coaching Tip:</span> This candidate exhibits a high density of overlapping skills. Suggest scheduling immediate screening loops to maintain client relationship SLAs.
                  </div>
                </div>
              </div>

              {/* Match Reasoning */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Structured Agent Recommendations
                </h4>
                
                <ul className="space-y-2.5 text-xs font-medium text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Candidate exceeds 85% requirement alignment matrices on modern frameworks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>No structural duplications or representation conflicts detected in current registry.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Ownership lock secured to originating vendor context. Split fee safety rules verified.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ================= RAW LEDGER TAB ================= */}
        {activeSubTab === "raw" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Company Ledger (Immutable Events Block)</h3>
                <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  LAW 1 STATUS: Immature updates, deletions, and alterations strictly denied. Append-only active.
                </p>
              </div>
              
              <button 
                onClick={fetchEvents}
                className="text-[10px] font-black text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg uppercase tracking-wider"
              >
                Re-Audit Block
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">Auditing ledger block...</div>
            ) : events.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <Terminal className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">No active cryptographic records on block chain.</p>
              </div>
            ) : (
              <div className="bg-slate-900 text-slate-300 rounded-xl p-4.5 font-mono text-xs overflow-x-auto border border-slate-800 space-y-4 max-h-[350px] overflow-y-auto">
                {events.map((e, idx) => (
                  <div key={e.id || idx} className="border-b border-slate-800 pb-3 last:border-b-0 last:pb-0">
                    <p className="text-emerald-400 font-bold mb-1">// BLOCK EVENT_ID: {e.id}</p>
                    <pre className="text-indigo-200 font-sans font-semibold">{JSON.stringify(e, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SubTabButton({ active, onClick, icon, children, premium }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; premium?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "py-3 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all",
        active 
          ? "border-indigo-600 text-indigo-600" 
          : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-200"
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
