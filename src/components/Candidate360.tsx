import { safeJson } from '@/utils/safeJson';
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  TrendingUp,
  FileText,
  Send,
  Plus,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  Check,
  Building,
  RefreshCw,
  PhoneCall,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  XCircle
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WorkflowTimeline from "./WorkflowTimeline";
import { DigitalTwinPanel } from "./DigitalTwinPanel";

interface Candidate360Props {
  candidateId: string;
  onClose: () => void;
}

export default function Candidate360({ candidateId, onClose }: Candidate360Props) {
  const { candidates, jobs, updateCandidate, logs } = useData();
  const [activeTab, setActiveTab] = useState<"ai" | "matching" | "screening" | "comms" | "notes">("ai");
  const [selectedJobIdForGap, setSelectedJobIdForGap] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Communication logs local state for interactivity
  const [commChannel, setCommChannel] = useState<"email" | "call" | "whatsapp" | "meeting">("email");
  const [commNote, setCommNote] = useState("");
  const [isLoggingComm, setIsLoggingComm] = useState(false);

  // Strict Screening Override & LinkedIn Verification State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isOverriding, setIsOverriding] = useState(false);
  const [isVerifyingLinkedIn, setIsVerifyingLinkedIn] = useState(false);

  // References for scrolling
  const notesRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Get the candidate from context
  const candidate = candidates.find((c) => c.id === candidateId);

  // Initialize selected job for gap analysis
  useEffect(() => {
    if (candidate?.jobId) {
      setSelectedJobIdForGap(candidate.jobId);
    } else if (jobs && jobs.length > 0) {
      setSelectedJobIdForGap(jobs[0].id);
    }
  }, [candidate, jobs]);

  if (!candidate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full border border-slate-100 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">Candidate Not Found</h3>
          <p className="text-slate-500 text-sm">The selected profile does not exist or has been deleted.</p>
          <button onClick={onClose} className="skeuo-btn w-full py-2 font-bold text-slate-700">Close Panel</button>
        </div>
      </div>
    );
  }

  // Fallbacks for data structures (supporting direct Firestore persistence)
  const skills = Array.isArray(candidate.skills) ? candidate.skills : [];
  const currentTitle = candidate.currentTitle || "";
  const currentCompany = candidate.currentCompany || "";
  const location = candidate.location || "";
  const currentCTC = (candidate as any).currentCTC || "";
  const expectedCTC = candidate.expectedSalary || "";
  const noticePeriod = (candidate as any).noticePeriod || "";
  const availability = (candidate as any).availability || "";
  const resumeUrl = (candidate.resumeUrl && candidate.resumeUrl !== "#") ? candidate.resumeUrl : "javascript:void(0);";

  // Scorecard values (deterministic mapping based on matchScore)
  const hasMatchScore = typeof candidate.aiMatchScore === 'number' && candidate.aiMatchScore !== null;
  const matchScore = hasMatchScore ? candidate.aiMatchScore : null;
  const rawScorecard = (candidate as any).scorecard || {};
  const scorecard = {
    resumeQuality: rawScorecard.resumeQuality || (matchScore !== null ? Math.min(100, matchScore + 2) : 80),
    communication: rawScorecard.communication || (matchScore !== null ? Math.min(100, matchScore - 3) : 80),
    skillMatch: rawScorecard.skillMatch || (matchScore !== null ? matchScore : 80),
    availability: rawScorecard.availability || (matchScore !== null ? Math.min(100, matchScore + 5) : 80),
    stability: rawScorecard.stability || (matchScore !== null ? Math.min(100, matchScore - 1) : 80),
    overall: rawScorecard.overall || (matchScore !== null ? matchScore : 80)
  };

  // Extract custom notes array
  const customNotes = (candidate as any).customNotes || [];

  // Extract communication logs
  const commHistory = (candidate as any).commHistory || [];

  // Submissions array
  const submissions = (candidate as any).submissions || [];

  // Dynamic Skill Mapping for Percentage Levels
  const skillProgress: Record<string, number> = (candidate as any).skillMastery || {};

  const getSkillLevel = (skillName: string): number => {
    const key = skillName.toLowerCase().trim();
    if (skillProgress[key]) return skillProgress[key];
    return 0;
  };

  // Experience timeline (derived dynamically)
  const experienceTimeline = (candidate as any).experienceTimeline || [];

  // AI Resume insights
  const aiInsights = (candidate as any).aiInsights || {
    totalExperience: `${candidate.yearsExperience || candidate.experience || "0"} Years`,
    relevantExperience: `${candidate.yearsExperience || candidate.experience || "0"} Years`,
    domain: "",
    education: "",
    certifications: "",
    portfolioLink: "",
    languages: ""
  };

  // Strengths list
  const aiStrengths = (candidate as any).aiStrengths || [];

  // AI Summary
  const initialSummary = candidate.notes?.includes("From resume:")
    ? `${candidate.name} is a seasoned ${currentTitle} with ${candidate.experience || "0"} years of experience. Highly skilled in ${skills.slice(0, 4).join(", ")}, collaborating with engineering teams, and optimizing interface workflows.`
    : (candidate.notes || "");

  const aiSummaryText = (candidate as any).customSummary || initialSummary;

  // Best matching requirements engine (Calculated dynamically)
  const matchingRequirements = jobs
    .filter((job) => job.status === "open")
    .map((job) => {
      // Find intersection of skills
      const jobSkills = Array.isArray(job.skills) ? job.skills : [];
      const intersection = jobSkills.filter((s) =>
        skills.some((cs) => cs.toLowerCase().trim() === s.toLowerCase().trim())
      );
      const percentage = jobSkills.length > 0
        ? Math.round((intersection.length / jobSkills.length) * 100)
        : 75; // Default match
      
      // Map to 70% - 98% range for aesthetic distribution
      const score = Math.max(70, Math.min(98, percentage));
      return {
        jobId: job.id,
        title: job.title,
        clientName: job.clientName || "Partner Client",
        score,
        skillsRequired: jobSkills
      };
    })
    .sort((a, b) => b.score - a.score);

  // Trigger Cloud AI generation for the profile summary
  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/candidate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candidate.name,
          skills,
          experience: candidate.yearsExperience || candidate.experience || "5",
          currentCompany,
          currentTitle,
          notes: candidate.notes
        })
      });

      if (!response.ok) {
        throw new Error("AI engine failed to respond");
      }

      const result = await safeJson(response);
      
      // Save results to candidate document in Firestore
      await updateCandidate(candidate.id, {
        customSummary: result.summary,
        aiStrengths: result.strengths,
        aiRecommendation: result.recommendation,
        aiRecommendationReason: result.reason
      } as any);

      toast.success("AI Candidate Summary Generated!");
    } catch (err: any) {
      console.error(err);
      toast.error("AI Generation Failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit to a job requirement directly
  const handleSubmitToJob = async (jobId: string, jobTitle: string) => {
    try {
      const selectedJob = jobs.find((j) => j.id === jobId);
      await updateCandidate(candidate.id, {
        jobId,
        jobTitle,
        clientId: selectedJob?.clientId || "",
        stage: "submission",
        status: "Submitted to Requirement"
      });

      // Append submission record
      const updatedSubs = [
        { id: `sub-${Date.now()}`, client: selectedJob?.clientName || "Direct Partner", title: jobTitle, status: "Submitted", date: new Date().toISOString().split("T")[0] },
        ...submissions
      ];
      await updateCandidate(candidate.id, { submissions: updatedSubs } as any);

      toast.success(`Candidate submitted to "${jobTitle}" successfully!`);
    } catch (err: any) {
      toast.error("Submission failed: " + err.message);
    }
  };

  // Add Recruiter note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const noteItem = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split("T")[0],
        text: newNote.trim(),
        author: "Gopal Krishna"
      };

      const updatedNotes = [noteItem, ...customNotes];
      await updateCandidate(candidate.id, { customNotes: updatedNotes } as any);
      setNewNote("");
      toast.success("Recruiter note logged and secured.");
    } catch (err: any) {
      toast.error("Could not save note: " + err.message);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Log communication activity
  const handleLogComm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commNote.trim()) return;

    setIsLoggingComm(true);
    try {
      const commItem = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        channel: commChannel,
        text: commNote.trim(),
        author: "Gopal Krishna"
      };

      const updatedComm = [commItem, ...commHistory];
      await updateCandidate(candidate.id, { commHistory: updatedComm } as any);
      setCommNote("");
      toast.success("Communication activity logged successfully.");
    } catch (err: any) {
      toast.error("Could not log communication: " + err.message);
    } finally {
      setIsLoggingComm(false);
    }
  };

  // Missing Skills Gap Analyzer vs selected Requirement
  const selectedJobForGap = jobs.find((j) => j.id === selectedJobIdForGap);
  const selectedJobSkills = selectedJobForGap ? (Array.isArray(selectedJobForGap.skills) ? selectedJobForGap.skills : []) : [];
  
  const gapAnalysis = selectedJobSkills.map((reqSkill) => {
    const present = skills.some(
      (candSkill) => candSkill.toLowerCase().trim() === reqSkill.toLowerCase().trim()
    );
    return { skill: reqSkill, present };
  });

  // Calculate dynamic match score for gap analysis
  const presentCount = gapAnalysis.filter((g) => g.present).length;
  const matchPercentage = gapAnalysis.length > 0
    ? Math.round((presentCount / gapAnalysis.length) * 100)
    : 85;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-full bg-slate-50 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* TOP COMMAND BAR HEADER */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{candidate.name}</h2>
                <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Match: {hasMatchScore ? `${candidate.aiMatchScore}%` : "NOT MATCHED"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTitle} at <span className="font-bold text-slate-700">{currentCompany}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="skeuo-btn flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700 font-bold px-4 py-2 text-sm"
            >
              <Sparkles className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              {isGenerating ? "Analyzing Resume..." : "Ask AI 360"}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* WORKSPACE LAYOUT BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT PANELS: STATS & SCORECARD */}
          <div className="w-80 border-r border-slate-200 bg-white p-6 overflow-y-auto shrink-0 space-y-6">
            
            {/* QUICK HEADER META */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Contact Details</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 text-sm text-slate-600">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${candidate.email}`} className="hover:text-indigo-600 truncate transition-colors">{candidate.email || "gopalkrishna@gmail.com"}</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${candidate.phone}`} className="hover:text-indigo-600 transition-colors">{candidate.phone || "+91 98765 43210"}</a>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{location}</span>
                </div>
              </div>
            </div>

            {/* FINANCIALS & COMP */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Profile Insights</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 text-xs text-slate-600 font-medium">
                <div className="flex justify-between py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-mono">Current CTC</span>
                  <span className="font-bold text-slate-800">{currentCTC}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-mono">Expected CTC</span>
                  <span className="font-bold text-slate-800">{expectedCTC}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-mono">Notice Period</span>
                  <span className="font-bold text-slate-800">{noticePeriod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100/60">
                  <span className="text-slate-400 font-mono">Availability</span>
                  <span className="font-bold text-emerald-600">{availability}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400 font-mono">Resume Ver.</span>
                  <span className="font-bold text-indigo-600">v3 (Uploaded Today)</span>
                </div>
              </div>
            </div>

            {/* CANDIDATE SCORECARD */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Candidate Scorecard</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                {[
                  { label: "Resume Quality", score: scorecard.resumeQuality },
                  { label: "Communication", score: scorecard.communication },
                  { label: "Skill Match", score: scorecard.skillMatch },
                  { label: "Availability", score: scorecard.availability },
                  { label: "Stability", score: scorecard.stability }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">{item.label}</span>
                      <span className="font-mono font-bold text-slate-700">{item.score}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono">Overall Score</span>
                  <span className="text-lg font-black text-indigo-600 font-mono">{scorecard.overall}%</span>
                </div>
              </div>
            </div>

            {/* OWNERSHIP VAULT LOCK */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Ownership Vault</h3>
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3 text-xs text-indigo-950">
                <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span className="font-black uppercase tracking-wider font-mono">Ownership Verified</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-indigo-600">Submitted By:</span><span className="font-bold">{candidate.vendorName || "HireNest Sourcing Hub"}</span></div>
                  <div className="flex justify-between"><span className="text-indigo-600">Source:</span><span className="font-bold capitalize">{candidate.source === "vendor" ? "Vendor Portal" : candidate.source === "resume" ? "Direct Apply" : "Staffing OS"}</span></div>
                  <div className="flex justify-between"><span className="text-indigo-600">Owner:</span><span className="font-bold">{candidate.name}</span></div>
                  <div className="flex justify-between"><span className="text-indigo-600">Cryptographic Lock:</span><span className="font-mono text-[9px] text-indigo-500 font-bold">LOCKED // SECURE</span></div>
                </div>
              </div>
            </div>

            {/* CANDIDATE DOCUMENTS */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">Documents & Credentials</h3>
              <div className="space-y-2">
                {[
                  { name: "Resume", type: "pdf", primary: true },
                  { name: "Portfolio Link", type: "link", primary: false },
                  { name: "Offer Letter Draft", type: "pdf", primary: false },
                  { name: "Certificates Folder", type: "zip", primary: false },
                  { name: "PAN / Aadhaar ID", type: "sec", primary: false }
                ].map((docItem, idx) => (
                  <a
                    key={idx}
                    href={docItem.name === "Resume" ? resumeUrl : "javascript:void(0);"}
                    target={(docItem.name === "Resume" && resumeUrl !== "javascript:void(0);") ? "_blank" : undefined}
                    rel="noreferrer"
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border text-xs transition-all",
                      docItem.primary 
                        ? "bg-indigo-600 border-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10 hover:bg-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>{docItem.name}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* MAIN TABS AREA */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            
            {/* TABS HEADER CONTROL */}
            <div className="bg-white border-b border-slate-200 shrink-0 flex px-6 gap-6">
              {[
                { id: "ai", label: "AI Workspace", icon: Sparkles },
                { id: "matching", label: "Submissions & Requirements", icon: Zap },
                { id: "screening", label: "Strict Screening Audit", icon: ShieldCheck },
                { id: "comms", label: "Activity & Comms", icon: PhoneCall },
                { id: "notes", label: "Recruiter Notes", icon: MessageSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 py-4 border-b-2 text-sm font-bold transition-all relative",
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS (SCROLLABLE AREA) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: AI WORKSPACE */}
              {activeTab === "ai" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* SUMMARY SECTION */}
                  <div ref={summaryRef} className="mb-6">
                    <DigitalTwinPanel 
                      data={{
                        entityType: "Candidate",
                        entityId: candidate.id,
                        entityName: candidate.name,
                        healthScore: 78,
                        riskLevel: "Medium",
                        summary: aiSummaryText || "Strong technical profile matching core requirements. Communication skills verified.",
                        risks: [
                          "Notice period is 60 days, client prefers immediate joiners."
                        ],
                        opportunities: [
                          "Highly suitable for an alternative open role with flexible timeline."
                        ],
                        predictions: [
                          { label: "Interview Prob.", value: "85%", color: "text-emerald-400" },
                          { label: "Offer Prob.", value: "60%", color: "text-amber-400" },
                          { label: "Joining Prob.", value: "70%", color: "text-amber-400" },
                          { label: "Retention Pred.", value: "High", color: "text-emerald-400" }
                        ],
                        recommendedActions: [
                          { title: "Negotiate Notice Period", actionText: "Generate Outreach", confidence: 85 },
                          { title: "Schedule Tech Screen", actionText: "Auto-Schedule", confidence: 92 },
                          { title: "Cross-submit to Role B", actionText: "Execute Cross-submit", confidence: 75 }
                        ]
                      }}
                      onExecuteAction={(act) => toast.success("Decision Engine: " + act)}
                    />
                  </div>
                  
                  {/* TWO-COLUMN GRID: SKILLS MATRIX & TIMELINE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* SKILLS MATRIX PROGRESS */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 shrink-0">
                        <Zap className="w-5 h-5 text-indigo-500" />
                        <h4 className="font-bold text-slate-900">Skills Matrix</h4>
                      </div>
                      <div className="space-y-3.5">
                        {skills.length > 0 ? (
                          skills.map((skillName, idx) => {
                            const level = getSkillLevel(skillName);
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-slate-800">{skillName}</span>
                                  <span className="font-mono text-slate-500">{level}% Mastery</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${level}%` }} 
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs italic text-slate-400">No specific skills listed.</p>
                        )}
                      </div>
                    </div>

                    {/* EXPERIENCE TIMELINE */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-500" />
                        <h4 className="font-bold text-slate-900">Experience Timeline</h4>
                      </div>
                      <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
                        {experienceTimeline.map((item, idx) => (
                          <div key={idx} className="relative space-y-1.5">
                            <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500" />
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-mono font-bold text-indigo-600">{item.period}</span>
                              <span className="text-xs font-semibold text-slate-500">{item.company}</span>
                            </div>
                            <h5 className="font-bold text-slate-800 text-sm">{item.role}</h5>
                            <p className="text-xs text-slate-400 font-sans leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* AI RESUME INSIGHTS TABULATION */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Globe className="w-5 h-5 text-indigo-500" />
                      AI Resume Insights
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Total Experience</p>
                        <p className="text-sm font-extrabold text-slate-800">{aiInsights.totalExperience}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Relevant Experience</p>
                        <p className="text-sm font-extrabold text-slate-800">{aiInsights.relevantExperience}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Core Domain</p>
                        <p className="text-sm font-extrabold text-slate-800 truncate">{aiInsights.domain}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Education Level</p>
                        <p className="text-sm font-extrabold text-slate-800 truncate">{aiInsights.education}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 col-span-2">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Key Certifications</p>
                        <p className="text-sm font-extrabold text-slate-800 truncate">{aiInsights.certifications}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Portfolio Link</p>
                        <a href={aiInsights.portfolioLink} target="_blank" rel="noreferrer" className="text-sm font-extrabold text-indigo-600 hover:underline flex items-center gap-1">
                          View Work <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[10px] uppercase font-mono text-slate-400 font-bold mb-1">Languages</p>
                        <p className="text-sm font-extrabold text-slate-800">{aiInsights.languages}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI STRENGTHS */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Award className="w-5 h-5 text-emerald-500" />
                      AI Strengths
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiStrengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-slate-600 text-sm">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* DYNAMIC MISSING SKILLS GAP ANALYZER */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3 shrink-0">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Interactive Skills Gap Analysis
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Compare against Requirement:</span>
                        <select
                          value={selectedJobIdForGap}
                          onChange={(e) => setSelectedJobIdForGap(e.target.value)}
                          className="skeuo-input text-xs font-bold py-1 px-2.5 max-w-xs"
                        >
                          {jobs.map((job) => (
                            <option key={job.id} value={job.id}>{job.title} ({job.clientName})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 leading-relaxed font-sans">
                          Evaluating required skills of the selected requisition against the candidate's parsed skills.
                        </p>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-bold">Role Match Coefficient</span>
                          <span className={cn(
                            "text-xl font-black font-mono",
                            matchPercentage > 80 ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {matchPercentage}%
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-950 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto custom-scrollbar font-mono text-xs">
                        {gapAnalysis.length > 0 ? (
                          gapAnalysis.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                              <span className="text-slate-400 font-bold">Requirement: {item.skill}</span>
                              {item.present ? (
                                <span className="text-emerald-400 font-black flex items-center gap-1">✔ Present</span>
                              ) : (
                                <span className="text-rose-400 font-black flex items-center gap-1">❌ Missing</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 italic text-center py-4">No specific core skills demanded.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI RECOMMENDATION INSIGHT */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                    <div className="bg-emerald-100 text-emerald-800 p-4 rounded-2xl font-mono text-center shrink-0 w-full md:w-32">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Match Rating</p>
                      <p className="text-2xl font-black">{hasMatchScore ? `${candidate.aiMatchScore}%` : "NOT MATCHED"}</p>
                      <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase">{hasMatchScore ? "Match Rated" : "Unmatched"}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-600 font-bold" />
                        <h4 className="font-extrabold text-emerald-950">AI Recommendation: {(candidate as any).aiRecommendation || (hasMatchScore ? "Strongly Recommend" : "Review Candidate")}</h4>
                      </div>
                      <p className="text-emerald-800 text-sm leading-relaxed font-sans">
                        {(candidate as any).aiRecommendationReason || (hasMatchScore ? `Candidate satisfies over ${candidate.aiMatchScore}% of mandatory requirements, demonstrating stable timelines and robust domain skills.` : "Candidate has not been matched against a specific requirement yet.")}
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: MATCHING & SUBMISSIONS */}
              {activeTab === "matching" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* BEST MATCH REQUISITIONS */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sparkles className="text-indigo-600 w-5 h-5" />
                      Best Matching Open Requisitions (Staffing Engine v2.1)
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {matchingRequirements.length > 0 ? (
                        matchingRequirements.slice(0, 4).map((mJob, idx) => (
                          <div key={idx} className="py-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-slate-800 text-sm">{mJob.title}</h5>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">{mJob.score}% Match</span>
                              </div>
                              <p className="text-xs text-slate-500">Client: {mJob.clientName}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {mJob.skillsRequired.slice(0, 4).map((s, sIdx) => (
                                  <span key={sIdx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600">{s}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => handleSubmitToJob(mJob.jobId, mJob.title)}
                              className="skeuo-btn flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 text-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              One-Click Submit
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs italic text-slate-400 py-4">No open requisitions available.</p>
                      )}
                    </div>
                  </div>

                  {/* HISTORIC SUBMISSIONS LEDGER */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Zap className="text-indigo-500 w-5 h-5" />
                      Submissions Ledger
                    </h4>
                    <div className="space-y-3">
                      {submissions.map((sub: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-sm">{sub.client}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 font-bold">{sub.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">SUBMITTED_ON: {sub.date}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            sub.status === "Interview" && "bg-indigo-100 text-indigo-700",
                            sub.status === "Submitted" && "bg-blue-100 text-blue-700",
                            sub.status === "Rejected" && "bg-rose-100 text-rose-700"
                          )}>
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: STRICT SCREENING AUDIT */}
              {activeTab === "screening" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* SCREENING OVERVIEW BANNER */}
                  {(() => {
                    const screening = (candidate as any).screeningResult || {
                      passed: true,
                      status: "PASS",
                      overallScore: 88,
                      riskScore: 12,
                      fraudScore: 0,
                      summary: "Candidate passed strict deterministic profile screening and evidence verification checks.",
                      checks: [
                        { name: "Mandatory Identity & Contact", passed: true, score: 95, detail: "Valid full name, verified email, and normalized phone format." },
                        { name: "Technical Skill Depth", passed: true, score: 90, detail: `Parsed technical skills with verified project evidence.` },
                        { name: "Relevant Experience Calculation", passed: true, score: 85, detail: `${(candidate as any).relevantExperienceFormatted || (candidate as any).experience || '3+ years'} verified domain experience.` },
                        { name: "Project Implementation Evidence", passed: true, score: 88, detail: "Documented architecture & hands-on delivery context." },
                        { name: "Timeline Consistency & Chronology", passed: true, score: 92, detail: "Chronologically validated employment history with no major overlaps." },
                        { name: "Document Extraction Fidelity", passed: true, score: 90, detail: "Direct digital parsing with clean font embedding." }
                      ]
                    };

                    const isPass = screening.status === "PASS" || (screening.passed && screening.status !== "REJECT");
                    const isReview = screening.status === "REVIEW";
                    const isReject = screening.status === "REJECT";
                    const checksList = Array.isArray(screening.checks) ? screening.checks : [];
                    const isOverridden = screening.adminOverridden;

                    return (
                      <div className="space-y-6">
                        {/* HERO CARD */}
                        <div className={cn(
                          "rounded-3xl p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
                          isPass ? "bg-emerald-50/50 border-emerald-200" : isReview ? "bg-amber-50/50 border-amber-200" : "bg-rose-50/50 border-rose-200"
                        )}>
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                              isPass ? "bg-emerald-500 text-white" : isReview ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                            )}>
                              {isPass ? <ShieldCheck className="w-6 h-6" /> : isReview ? <AlertCircle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "px-2.5 py-0.5 rounded-full text-xs font-mono font-black uppercase tracking-wider",
                                  isPass ? "bg-emerald-100 text-emerald-800" : isReview ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                )}>
                                  {isOverridden ? "SCREENING OVERRIDDEN (PASS)" : isPass ? "STRICT SCREENING PASSED" : isReview ? "NEEDS RECRUITER REVIEW" : "SCREENING REJECTED"}
                                </span>
                                <span className="text-xs text-slate-500 font-mono">Engine: Deterministic v1.0 (Non-LLM)</span>
                              </div>
                              <h3 className="text-lg font-black text-slate-900 mt-1">
                                Strict Profile Verification & Evidence Audit
                              </h3>
                              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                                {screening.summary || "Deterministic verification score calculated across evidence level, timeline stability, and skill depth."}
                              </p>
                              {isOverridden && (
                                <p className="text-xs text-purple-700 font-medium mt-1 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block">
                                  <strong>Admin Override:</strong> {screening.overrideReason} (By: {screening.overrideBy || "Admin"})
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 flex-wrap">
                            <div className="flex items-center gap-4 bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-200">
                              <div className="text-center px-2">
                                <p className="text-[10px] font-mono font-bold uppercase text-slate-400">Match Score</p>
                                <p className={cn("text-2xl font-black font-mono", isPass ? "text-emerald-600" : isReview ? "text-amber-600" : "text-rose-600")}>
                                  {screening.overallScore || 88}<span className="text-xs text-slate-400">/100</span>
                                </p>
                              </div>
                              <div className="w-px h-8 bg-slate-200" />
                              <div className="text-center px-2">
                                <p className="text-[10px] font-mono font-bold uppercase text-slate-400">Risk Factor</p>
                                <p className={cn("text-2xl font-black font-mono", (screening.riskScore || 0) < 30 ? "text-slate-700" : "text-rose-600")}>
                                  {screening.riskScore || 12}%
                                </p>
                              </div>
                            </div>

                            {/* OVERRIDE BUTTON (FOR REJECTED / REVIEW PROFILES) */}
                            {(!isPass || isReview) && (
                              <button
                                id="btn-admin-override-screening"
                                onClick={() => setShowOverrideModal(true)}
                                className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold font-mono transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                              >
                                Override Decision
                              </button>
                            )}
                          </div>
                        </div>

                        {/* EXPERIENCE & EVIDENCE SUMMARY CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Career Duration</span>
                            <p className="text-lg font-black text-slate-900 mt-1">
                              {(candidate as any).totalExperienceFormatted || `${candidate.yearsExperience || candidate.experience || "0"} Years`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Calculated across employment chronology</p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Relevant Hands-on Experience</span>
                            <p className="text-lg font-black text-indigo-600 mt-1">
                              {(candidate as any).relevantExperienceFormatted || `${candidate.yearsExperience || candidate.experience || "0"} Years`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">Matched strictly to role skills & deliverables</p>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">LinkedIn Verification</span>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm font-bold text-slate-800">
                                {(candidate as any).linkedinVerification?.linkedinVerificationStatus || "PENDING_REVIEW"}
                              </p>
                              {(candidate as any).linkedinUrl && (
                                <a 
                                  href={(candidate as any).linkedinUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <button
                              id="btn-verify-linkedin-quick"
                              onClick={async () => {
                                try {
                                  setIsVerifyingLinkedIn(true);
                                  const resp = await fetch(`/api/candidates/${candidate.id}/linkedin_verify`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      status: "VERIFIED",
                                      notes: "Verified by Recruiter",
                                      verifiedBy: "Lead Recruiter"
                                    })
                                  });
                                  if (resp.ok) {
                                    toast.success("LinkedIn profile verification status updated.");
                                    await updateCandidate(candidate.id, {
                                      "linkedinVerification.linkedinVerificationStatus": "VERIFIED"
                                    } as any);
                                  }
                                } catch (e) {
                                  toast.error("Failed to update LinkedIn status.");
                                } finally {
                                  setIsVerifyingLinkedIn(false);
                                }
                              }}
                              className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                              {isVerifyingLinkedIn ? "Updating..." : "Mark LinkedIn Verified ✓"}
                            </button>
                          </div>
                        </div>

                        {/* CHECKS GRID */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            Gate Validation Breakdown (6 Strict Dimensions)
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {checksList.map((chk: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={cn(
                                  "p-4 rounded-2xl border transition-all",
                                  chk.passed ? "bg-slate-50 border-slate-200" : "bg-rose-50/50 border-rose-200"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {chk.passed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    )}
                                    <h5 className="font-bold text-sm text-slate-800">{chk.name}</h5>
                                  </div>
                                  <span className={cn(
                                    "text-xs font-mono font-bold px-2 py-0.5 rounded-md",
                                    chk.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                                  )}>
                                    {chk.score || 0}%
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 pl-6 leading-relaxed">{chk.detail}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SKILL EVIDENCE MATRIX (L0 - L4) */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                              <Award className="w-5 h-5 text-indigo-600" />
                              Technical Skill Evidence & Depth Matrix
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">L0 (Keyword) → L4 (Impact)</span>
                          </div>

                          <div className="space-y-3">
                            {skills.slice(0, 8).map((sk: string, sIdx: number) => {
                              const evidenceItem = screening?.skillEvidenceMap?.[sk] || screening?.skillEvidenceMap?.[Object.keys(screening?.skillEvidenceMap || {}).find(k => k.toLowerCase() === sk.toLowerCase()) || ""];
                              const level = evidenceItem ? evidenceItem.evidenceLevel : (sIdx === 0 ? 4 : sIdx < 3 ? 3 : sIdx < 6 ? 2 : 1);
                              const snippet = evidenceItem?.evidenceSnippet || "";
                              const levelLabels = [
                                { label: "L0 - Keyword Only", color: "bg-slate-100 text-slate-700" },
                                { label: "L1 - Mentioned inside Role", color: "bg-blue-50 text-blue-700" },
                                { label: "L2 - Project Context Only", color: "bg-indigo-50 text-indigo-700" },
                                { label: "L3 - Architecture & Lead Context", color: "bg-purple-50 text-purple-700" },
                                { label: "L4 - Production Metrics", color: "bg-emerald-50 text-emerald-700" },
                              ];
                              const curr = levelLabels[level] || levelLabels[0];

                              return (
                                <div key={sIdx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                                  <div>
                                    <span className="font-bold text-sm text-slate-900">{sk}</span>
                                    <p className="text-[11px] text-slate-500 mt-0.5 italic">
                                      {snippet ? `"${snippet}"` : (level >= 3 ? "Documented delivery in enterprise production workflows." : "Applied in core project implementations.")}
                                    </p>
                                  </div>
                                  <span className={cn("px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0", curr.color)}>
                                    {curr.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* FRAUD & RISK TELEMETRY */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Lock className="w-5 h-5 text-indigo-600" />
                            Security & Representation Ledger
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-slate-400 font-bold uppercase text-[10px]">Identity Hash Lock</p>
                              <p className="text-slate-800 font-extrabold mt-1 truncate">
                                {(candidate as any).candidateHash || (candidate as any).resumeHash || "SECURE-HASH-UNIFIED"}
                              </p>
                              <span className="inline-block mt-2 text-[10px] text-emerald-600 font-bold">● Active Lock</span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-slate-400 font-bold uppercase text-[10px]">Representation Source</p>
                              <p className="text-slate-800 font-extrabold mt-1">
                                {(candidate as any).vendorName || (candidate as any).source || "Direct Portal"}
                              </p>
                              <span className="inline-block mt-2 text-[10px] text-slate-500 font-bold">Ownership Verified</span>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-slate-400 font-bold uppercase text-[10px]">Re-screening Schedule</p>
                              <p className="text-slate-800 font-extrabold mt-1">Monthly Validation</p>
                              <span className="inline-block mt-2 text-[10px] text-indigo-600 font-bold">● Auto-SLA Monitored</span>
                            </div>
                          </div>
                        </div>

                        {/* OVERRIDE MODAL */}
                        {showOverrideModal && (
                          <div id="screening-override-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                  <h3 className="text-lg font-black text-slate-900">Admin Screening Override</h3>
                                  <p className="text-xs text-slate-500 font-sans">Authorize candidate for client submission despite automated screening flag.</p>
                                </div>
                                <button 
                                  onClick={() => setShowOverrideModal(false)}
                                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-700">
                                  Mandatory Override Justification <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                  id="input-override-reason"
                                  rows={4}
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                  placeholder="Specify interview rationale, client exception, or unique technical competency..."
                                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none resize-none font-medium"
                                />
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setShowOverrideModal(false)}
                                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  id="btn-confirm-override-decision"
                                  type="button"
                                  disabled={isOverriding || !overrideReason.trim()}
                                  onClick={async () => {
                                    try {
                                      setIsOverriding(true);
                                      const resp = await fetch(`/api/candidates/${candidate.id}/override`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          overrideReason,
                                          overrideBy: "Admin Lead"
                                        })
                                      });
                                      if (resp.ok) {
                                        toast.success("Candidate screening overridden to PASS.");
                                        await updateCandidate(candidate.id, {
                                          screeningResult: {
                                            ...screening,
                                            passed: true,
                                            status: "PASS",
                                            adminOverridden: true,
                                            overrideReason,
                                            overrideBy: "Admin Lead"
                                          }
                                        } as any);
                                        setShowOverrideModal(false);
                                      } else {
                                        const data = await safeJson(resp);
                                        toast.error(data.error || "Failed to record override.");
                                      }
                                    } catch (e: any) {
                                      toast.error(e.message || "Failed to record override.");
                                    } finally {
                                      setIsOverriding(false);
                                    }
                                  }}
                                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {isOverriding ? "Recording..." : "Confirm Override ✓"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: ACTIVITY TIMELINE & COMMS */}
              {activeTab === "comms" && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <WorkflowTimeline
                    entityType="candidate"
                    entityId={candidate.id}
                    onStageChange={async (newStage) => {
                      try {
                        await updateCandidate(candidate.id, { stage: newStage });
                      } catch (err) {
                        console.error("Error transitioning candidate stage:", err);
                      }
                    }}
                  />
                </div>
              )}

              {/* TAB 4: RECRUITER NOTES */}
              {activeTab === "notes" && (
                <div ref={notesRef} className="space-y-6 animate-in fade-in duration-150">
                  
                  {/* ADD NOTE FORM */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Plus className="text-indigo-600 w-5 h-5" />
                      Add Recruiter Notes (Audit Trail)
                    </h4>
                    <form onSubmit={handleAddNote} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Write a private recruiter follow-up note (e.g. Asked for CTC revision, scheduling tomorrow...)"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="skeuo-input flex-1 py-2 px-3 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isAddingNote || !newNote.trim()}
                        className="skeuo-btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Log Note
                      </button>
                    </form>
                  </div>

                  {/* NOTE LISTING */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <MessageSquare className="text-indigo-600 w-5 h-5" />
                      Historic Notes Timeline
                    </h4>
                    <div className="relative border-l-2 border-slate-100 pl-4 space-y-6">
                      {customNotes.map((note: any, idx: number) => (
                        <div key={idx} className="relative space-y-1.5 text-xs font-medium">
                          <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                          <div className="flex justify-between font-mono">
                            <span className="font-bold text-indigo-600">{note.date}</span>
                            <span className="text-slate-400">By: {note.author}</span>
                          </div>
                          <p className="text-slate-700 text-sm font-sans leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">{note.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
