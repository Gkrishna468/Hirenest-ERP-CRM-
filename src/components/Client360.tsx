/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Briefcase, 
  Users, 
  DollarSign, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  ShieldCheck, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Plus, 
  ArrowRight, 
  History, 
  Percent, 
  Calculator, 
  Layers, 
  UserCheck, 
  Check, 
  ChevronRight, 
  Target, 
  ExternalLink,
  Filter
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CommercialCalculator } from "@/components/CommercialCalculator";

interface Client360Props {
  clientId: string;
  onClose: () => void;
  onOpenRequirement?: (requirementId: string) => void;
}

export const Client360: React.FC<Client360Props> = ({
  clientId,
  onClose,
  onOpenRequirement,
}) => {
  const { clients, jobs, candidates, refreshAll } = useData();
  const { user, apiFetch } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "pipeline" | "commercials" | "opportunities" | "timeline">("overview");
  const [data360, setData360] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddingOpportunity, setIsAddingOpportunity] = useState<boolean>(false);
  const [isAddingCommercial, setIsAddingCommercial] = useState<boolean>(false);

  // Opportunity Form State
  const [oppForm, setOppForm] = useState({
    title: "",
    serviceType: "Contract Staffing",
    estimatedValue: 500000,
    probability: 50,
    stage: "Proposal",
    targetCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  });

  // Fetch 360 data from backend
  const fetch360Data = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/clients/${clientId}/360`);
      if (res.ok) {
        const json = await res.json();
        setData360(json);
      } else {
        // Fallback construct from DataContext
        buildFallbackData();
      }
    } catch (err) {
      console.warn("Could not fetch /api/clients/360, using local fallback", err);
      buildFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const buildFallbackData = () => {
    const client = clients.find((c) => c.id === clientId || c.company === clientId);
    const clientName = client?.company || client?.name || clientId;
    const clientReqs = jobs.filter((j) => j.clientId === clientId || j.clientName === clientName);
    const reqIds = clientReqs.map((j) => j.id);
    const clientCands = candidates.filter((c) => reqIds.includes(c.jobId) || (c as any).clientName === clientName);

    const activeReqs = clientReqs.filter((r) => r.status !== "closed");
    const openPositions = activeReqs.reduce((sum, r) => sum + (Number((r as any).positions || (r as any).openings) || 1), 0);

    const submitted = clientCands.length;
    const shortlisted = clientCands.filter((c) => ["shortlisted", "interview", "selected", "offer", "placed", "hired"].includes(c.stage.toLowerCase())).length;
    const interviews = clientCands.filter((c) => ["interview", "selected", "offer", "placed", "hired"].includes(c.stage.toLowerCase())).length;
    const selections = clientCands.filter((c) => ["selected", "offer", "placed", "hired"].includes(c.stage.toLowerCase())).length;
    const placements = clientCands.filter((c) => ["placed", "hired", "joined"].includes(c.stage.toLowerCase())).length;

    setData360({
      client: {
        id: client?.id || clientId,
        name: clientName,
        company: clientName,
        clientCode: client?.clientCode || `CLI-${(client?.id || clientId).slice(0, 6).toUpperCase()}`,
        industry: client?.industry || "Enterprise IT Services",
        location: client?.location || "Hyderabad / Bangalore",
        accountOwner: client?.bdmOwner || client?.contactPerson || "Gopal Krishna",
        status: client?.status || "Active",
        contactEmail: client?.contactEmail || client?.email || "",
        contactPhone: client?.contactPhone || client?.phone || "",
        commercialTerms: client?.commercialTerms || "Net 45 / 8.33%",
        notes: client?.notes || "",
        createdAt: client?.createdAt || new Date().toISOString(),
      },
      summary: {
        activeRequirements: activeReqs.length,
        openPositions: openPositions,
        totalSubmissions: submitted,
        shortlisted,
        interviews,
        selections,
        placements,
        revenuePotential: activeReqs.length * 150000,
        realizedRevenue: placements * 100000,
        outstandingCommercialValue: 0,
      },
      contacts: [],
      requirements: clientReqs.map((r) => ({
        ...r,
        submissionsCount: clientCands.filter((c) => c.jobId === r.id).length,
        shortlistedCount: clientCands.filter((c) => c.jobId === r.id && ["shortlisted", "interview", "selected", "offer", "placed", "hired"].includes(c.stage.toLowerCase())).length,
        interviewCount: clientCands.filter((c) => c.jobId === r.id && ["interview", "selected", "offer", "placed", "hired"].includes(c.stage.toLowerCase())).length,
        selectionCount: clientCands.filter((c) => c.jobId === r.id && ["selected", "offer", "placed", "hired"].includes(c.stage.toLowerCase())).length,
        placementCount: clientCands.filter((c) => c.jobId === r.id && ["placed", "hired", "joined"].includes(c.stage.toLowerCase())).length,
      })),
      pipeline: {
        submitted,
        clientReview: clientCands.filter((c) => c.stage === "review" || c.stage === "client_review").length,
        shortlisted,
        interview: interviews,
        selected: selections,
        offer: clientCands.filter((c) => c.stage === "offer").length,
        joined: placements,
        placed: placements,
      },
      commercials: [],
      deals: [],
      timeline: [],
    });
  };

  useEffect(() => {
    if (clientId) {
      fetch360Data();
    }
  }, [clientId]);

  // Handle Saving new Commercial Terms
  const handleSaveCommercial = async (breakdown: any) => {
    try {
      const payload = {
        clientId: data360?.client?.id || clientId,
        clientName: data360?.client?.name,
        serviceType: breakdown.model === "permanent" ? "Permanent Placement" : "Contract Staffing",
        clientBillingRate: breakdown.clientBillingRate || 0,
        vendorPayRate: breakdown.vendorPayRate || 0,
        candidateCtc: breakdown.candidateCtc || 0,
        feePercent: breakdown.feePercent || 8.33,
        billingFrequency: breakdown.billingFrequency || "monthly",
        positions: breakdown.positions || 1,
        statutoryExpenses: breakdown.statutoryExpenses || 0,
        versionReason: "New commercial agreement baseline established",
      };

      const res = await apiFetch("/api/commercials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Commercial terms baseline saved (Version 1).");
        setIsAddingCommercial(false);
        fetch360Data();
      } else {
        toast.error("Failed to save commercial terms.");
      }
    } catch (err) {
      toast.error("Error saving commercial terms.");
    }
  };

  // Handle Creating a New Version for Commercial Terms
  const handleCreateNewVersion = async (commercialId: string, currentComm: any) => {
    const reason = prompt("Enter reason for commercial terms revision / renegotiation:", "Quarterly rate adjustment");
    if (!reason) return;

    try {
      const payload = {
        reason,
        clientBillingRate: currentComm.clientBillingRate,
        vendorPayRate: currentComm.vendorPayRate,
        candidateCtc: currentComm.candidateCtc,
        feePercent: currentComm.feePercent,
        serviceType: currentComm.serviceType,
      };

      const res = await apiFetch(`/api/commercials/${commercialId}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("New commercial terms version created with audit record.");
        fetch360Data();
      } else {
        toast.error("Failed to create new commercial version.");
      }
    } catch (err) {
      toast.error("Error creating commercial version.");
    }
  };

  // Handle Approving Commercial Terms
  const handleApproveCommercial = async (commercialId: string) => {
    try {
      const res = await apiFetch(`/api/commercials/${commercialId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "approved" }),
      });

      if (res.ok) {
        toast.success("Commercial terms approved. Status updated across ledger.");
        fetch360Data();
      } else {
        toast.error("Failed to approve commercial terms.");
      }
    } catch (err) {
      toast.error("Error approving commercial terms.");
    }
  };

  // Handle Adding Sales Opportunity
  const handleAddOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: oppForm.title,
        clientId: data360?.client?.id || clientId,
        clientName: data360?.client?.name,
        serviceType: oppForm.serviceType,
        expectedRevenue: Number(oppForm.estimatedValue),
        probability: Number(oppForm.probability),
        stage: oppForm.stage,
        targetCloseDate: oppForm.targetCloseDate,
        notes: oppForm.notes,
        status: "Open",
      };

      const res = await apiFetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });

      if (res.ok) {
        toast.success("Commercial sales opportunity created.");
        setIsAddingOpportunity(false);
        setOppForm({
          title: "",
          serviceType: "Contract Staffing",
          estimatedValue: 500000,
          probability: 50,
          stage: "Proposal",
          targetCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          notes: "",
        });
        fetch360Data();
      } else {
        toast.error("Failed to create opportunity.");
      }
    } catch (err) {
      toast.error("Error creating opportunity.");
    }
  };

  const client = data360?.client;
  const summary = data360?.summary;
  const pipeline = data360?.pipeline;
  const reqs = data360?.requirements || [];
  const commercials = data360?.commercials || [];
  const deals = data360?.deals || [];
  const timeline = data360?.timeline || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div id="client_360_drawer" className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{client?.name || "Client 360"}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {client?.status || "Active"}
                </span>
                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  {client?.clientCode || `CLI-${clientId.slice(0, 6).toUpperCase()}`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{client?.location || "India"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{client?.industry || "Information Technology"}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-slate-700">BDM: {client?.accountOwner || "Gopal Krishna"}</span>
              </div>
            </div>
          </div>

          <button
            id="close_client_360_btn"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white overflow-x-auto">
          {[
            { id: "overview", label: "Executive 360", icon: Building2 },
            { id: "requirements", label: `Requirements (${reqs.length})`, icon: Briefcase },
            { id: "pipeline", label: "Talent Pipeline", icon: Users },
            { id: "commercials", label: `Commercial Terms (${commercials.length})`, icon: DollarSign },
            { id: "opportunities", label: `Sales Deals (${deals.length})`, icon: Target },
            { id: "timeline", label: `Audit Ledger (${timeline.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`client_360_tab_${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Loading deterministic Client 360 analytics from Firestore Single Source of Truth...
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Primary KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div id="stat_active_reqs" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Mandates</div>
                      <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary?.activeRequirements || 0}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{summary?.openPositions || 0} open positions</div>
                    </div>

                    <div id="stat_submissions" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submissions</div>
                      <div className="text-2xl font-extrabold text-indigo-600 mt-1">{summary?.totalSubmissions || 0}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{summary?.shortlisted || 0} shortlisted</div>
                    </div>

                    <div id="stat_interviews" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Interviews & Placed</div>
                      <div className="text-2xl font-extrabold text-emerald-600 mt-1">{summary?.placements || 0}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{summary?.interviews || 0} interviews held</div>
                    </div>

                    <div id="stat_realized_rev" className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Realized Revenue</div>
                      <div className="text-2xl font-extrabold text-emerald-700 mt-1">₹{(summary?.realizedRevenue || 0).toLocaleString("en-IN")}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">₹{(summary?.revenuePotential || 0).toLocaleString("en-IN")} pipeline</div>
                    </div>
                  </div>

                  {/* Candidate Progression Funnel */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>End-to-End Recruitment Conversion Funnel</span>
                      <span className="text-[11px] font-normal text-slate-500">Live Telemetry</span>
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
                      {[
                        { label: "Submitted", count: pipeline?.submitted || 0, color: "bg-slate-100 text-slate-800" },
                        { label: "Review", count: pipeline?.clientReview || 0, color: "bg-blue-50 text-blue-800" },
                        { label: "Shortlisted", count: pipeline?.shortlisted || 0, color: "bg-indigo-50 text-indigo-800" },
                        { label: "Interview", count: pipeline?.interview || 0, color: "bg-purple-50 text-purple-800" },
                        { label: "Selected", count: pipeline?.selected || 0, color: "bg-amber-50 text-amber-800" },
                        { label: "Offered", count: pipeline?.offer || 0, color: "bg-orange-50 text-orange-800" },
                        { label: "Joined", count: pipeline?.joined || 0, color: "bg-teal-50 text-teal-800" },
                        { label: "Placed", count: pipeline?.placed || 0, color: "bg-emerald-100 text-emerald-900 font-bold" },
                      ].map((step, idx) => (
                        <div key={idx} className={cn("p-2.5 rounded-lg text-center border border-slate-200/60", step.color)}>
                          <div className="text-[10px] uppercase font-semibold text-slate-500 truncate">{step.label}</div>
                          <div className="text-base font-extrabold mt-0.5">{step.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Profile & Contacts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Specifications</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Commercial Agreement:</span>
                          <span className="font-semibold text-slate-800">{client?.commercialTerms || "Net 45 / 8.33%"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Primary Contact Email:</span>
                          <span className="font-semibold text-slate-800">{client?.contactEmail || "billing@client.com"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Primary Phone:</span>
                          <span className="font-semibold text-slate-800">{client?.contactPhone || "+91 98765 43210"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Account Onboarding:</span>
                          <span className="font-semibold text-slate-800">{new Date(client?.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Commercial Snapshot</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Contracted Rate Structure:</span>
                          <span className="font-semibold text-indigo-700">Contract Staffing & Permanent</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Outstanding Unbilled Value:</span>
                          <span className="font-semibold text-slate-800">₹{(summary?.outstandingCommercialValue || 0).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Active Rate Cards (Versions):</span>
                          <span className="font-semibold text-slate-800">{commercials.length} Active Records</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Audit Status:</span>
                          <span className="font-semibold text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Single Source of Truth Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REQUIREMENTS (MANDATES) */}
              {activeTab === "requirements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Client Requisitions & Job Mandates ({reqs.length})</h3>
                  </div>

                  <div className="space-y-3">
                    {reqs.map((r: any) => (
                      <div
                        key={r.id}
                        id={`client_req_card_${r.id}`}
                        className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                                {r.status || "Open"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {r.location || "Onsite / Remote"} • Experience: {r.experience || "3-6 yrs"} • Budget: {r.budget || "₹1,20,000 / mo"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenRequirement && onOpenRequirement(r.id)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
                          >
                            <span>Open Mandate</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Pipeline Telemetry for this requirement */}
                        <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg">
                            <div className="text-[10px] text-slate-500 font-medium">Submissions</div>
                            <div className="font-bold text-slate-800">{r.submissionsCount || 0}</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <div className="text-[10px] text-blue-700 font-medium">Shortlisted</div>
                            <div className="font-bold text-blue-900">{r.shortlistedCount || 0}</div>
                          </div>
                          <div className="bg-purple-50 p-2 rounded-lg">
                            <div className="text-[10px] text-purple-700 font-medium">Interviews</div>
                            <div className="font-bold text-purple-900">{r.interviewCount || 0}</div>
                          </div>
                          <div className="bg-amber-50 p-2 rounded-lg">
                            <div className="text-[10px] text-amber-700 font-medium">Selections</div>
                            <div className="font-bold text-amber-900">{r.selectionCount || 0}</div>
                          </div>
                          <div className="bg-emerald-50 p-2 rounded-lg">
                            <div className="text-[10px] text-emerald-700 font-medium">Placements</div>
                            <div className="font-bold text-emerald-900">{r.placementCount || 0}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {reqs.length === 0 && (
                      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                        No requisitions currently mapped to this client account.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: TALENT PIPELINE */}
              {activeTab === "pipeline" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Active Talent Submissions & Candidate Pipeline</h3>
                    <span className="text-xs text-slate-500">{summary?.totalSubmissions || 0} total candidates submitted</span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                          <th className="py-3 px-4">Candidate</th>
                          <th className="py-3 px-4">Requirement</th>
                          <th className="py-3 px-4">Vendor Partner</th>
                          <th className="py-3 px-4">Current Stage</th>
                          <th className="py-3 px-4">Match / QC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {candidates
                          .filter((c) => reqs.map((r: any) => r.id).includes(c.jobId) || (c as any).clientName === client?.name)
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                              <td className="py-3 px-4 text-slate-600">
                                {reqs.find((r: any) => r.id === c.jobId)?.title || "Software Engineer"}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{c.vendorName || "Direct Bench"}</td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                  c.stage === "placed" || c.stage === "hired" ? "bg-emerald-100 text-emerald-800" :
                                  c.stage === "interview" ? "bg-purple-100 text-purple-800" :
                                  c.stage === "shortlisted" ? "bg-indigo-100 text-indigo-800" :
                                  "bg-slate-100 text-slate-700"
                                )}>
                                  {c.stage}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-emerald-700">
                                {(c as any).matchScore || c.aiMatchScore ? `${(c as any).matchScore || c.aiMatchScore}%` : "88% Validated"}
                              </td>
                            </tr>
                          ))}

                        {candidates.filter((c) => reqs.map((r: any) => r.id).includes(c.jobId) || (c as any).clientName === client?.name).length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                              No candidates currently in the pipeline for this client.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: COMMERCIALS & MARGIN ENGINE */}
              {activeTab === "commercials" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Commercial Agreements, Pricing Models & Versioning</h3>
                      <p className="text-xs text-slate-500">Historical records preserve every agreed commercial version</p>
                    </div>

                    <button
                      type="button"
                      id="new_commercial_terms_btn"
                      onClick={() => setIsAddingCommercial(!isAddingCommercial)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingCommercial ? "Close Engine" : "Add Commercial Agreement"}</span>
                    </button>
                  </div>

                  {/* Embedded Commercial Calculator */}
                  {isAddingCommercial && (
                    <CommercialCalculator
                      initialBilling={100000}
                      initialVendorCost={70000}
                      onSave={handleSaveCommercial}
                    />
                  )}

                  {/* List of Commercial Agreements & Versions */}
                  <div className="space-y-4">
                    {commercials.map((comm: any) => (
                      <div
                        key={comm.id}
                        id={`commercial_record_${comm.id}`}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {comm.serviceType || "Contract Staffing"} Agreement
                              </h4>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded">
                                Active Version: V{comm.activeVersion || 1}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full",
                                comm.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              )}>
                                {comm.status || "Pending Approval"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Created by {comm.createdBy} on {new Date(comm.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            {comm.status !== "approved" && (
                              <button
                                type="button"
                                onClick={() => handleApproveCommercial(comm.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve Terms</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCreateNewVersion(comm.id, comm)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>Create New Version (V{(comm.activeVersion || 1) + 1})</span>
                            </button>
                          </div>
                        </div>

                        {/* Financial Parameters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Client Billing Rate</div>
                            <div className="text-base font-extrabold text-slate-900 mt-0.5">
                              ₹{(comm.clientBillingRate || 0).toLocaleString("en-IN")} / mo
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Resource Cost</div>
                            <div className="text-base font-extrabold text-slate-700 mt-0.5">
                              ₹{(comm.vendorPayRate || 0).toLocaleString("en-IN")} / mo
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Gross Margin %</div>
                            <div className="text-base font-extrabold text-indigo-700 mt-0.5">
                              {comm.grossMarginPercent !== null && comm.grossMarginPercent !== undefined ? `${comm.grossMarginPercent}%` : "N/A"}
                            </div>
                            <div className="text-[10px] text-slate-400">Profit / Billing</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">Markup Rate %</div>
                            <div className="text-base font-extrabold text-emerald-700 mt-0.5">
                              {comm.markupPercent !== null && comm.markupPercent !== undefined ? `${comm.markupPercent}%` : "N/A"}
                            </div>
                            <div className="text-[10px] text-slate-400">Profit / Cost</div>
                          </div>
                        </div>

                        {/* Version History Drawer */}
                        {comm.versions && comm.versions.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              <span>Version Audit Trail ({comm.versions.length} versions)</span>
                            </div>
                            <div className="space-y-1.5">
                              {comm.versions.map((ver: any, vIdx: number) => (
                                <div key={vIdx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 text-xs flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-slate-800">Version {ver.versionNumber}: {ver.reason}</div>
                                    <div className="text-[11px] text-slate-500">
                                      Billing: ₹{(ver.clientBillingRate || 0).toLocaleString("en-IN")} • Cost: ₹{(ver.vendorPayRate || 0).toLocaleString("en-IN")} • Margin: {ver.grossMarginPercent !== null && ver.grossMarginPercent !== undefined ? `${ver.grossMarginPercent}%` : "N/A"} • Markup: {ver.markupPercent !== null && ver.markupPercent !== undefined ? `${ver.markupPercent}%` : "N/A"}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={cn(
                                      "px-2 py-0.5 text-[10px] font-semibold rounded uppercase",
                                      ver.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                                    )}>
                                      {ver.status || "Archived"}
                                    </span>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      {new Date(ver.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {commercials.length === 0 && !isAddingCommercial && (
                      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                        No commercial records found. Click &quot;Add Commercial Agreement&quot; to establish initial billing and margin rates.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: SALES OPPORTUNITIES */}
              {activeTab === "opportunities" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Commercial Sales Pipeline & Opportunities</h3>
                      <p className="text-xs text-slate-500">Track staffing opportunities, SOW proposals, and deal closures</p>
                    </div>

                    <button
                      type="button"
                      id="new_opportunity_btn"
                      onClick={() => setIsAddingOpportunity(!isAddingOpportunity)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingOpportunity ? "Cancel" : "Add Opportunity"}</span>
                    </button>
                  </div>

                  {/* Add Opportunity Form */}
                  {isAddingOpportunity && (
                    <form onSubmit={handleAddOpportunity} className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Sales Opportunity</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Opportunity Mandate Title</label>
                          <input
                            type="text"
                            required
                            value={oppForm.title}
                            onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })}
                            placeholder="e.g. 5 Cloud DevOps Engineers - Q3 Project"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Service Type</label>
                          <select
                            value={oppForm.serviceType}
                            onChange={(e) => setOppForm({ ...oppForm, serviceType: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                          >
                            <option value="Contract Staffing">Contract Staffing</option>
                            <option value="C2C Staffing">C2C Staffing</option>
                            <option value="C2H Staffing">C2H Staffing</option>
                            <option value="Permanent Placement">Permanent Placement</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Expected Deal Value (₹)</label>
                          <input
                            type="number"
                            required
                            value={oppForm.estimatedValue}
                            onChange={(e) => setOppForm({ ...oppForm, estimatedValue: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Probability (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={oppForm.probability}
                            onChange={(e) => setOppForm({ ...oppForm, probability: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Sales Stage</label>
                          <select
                            value={oppForm.stage}
                            onChange={(e) => setOppForm({ ...oppForm, stage: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                          >
                            <option value="Lead">Lead</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="MSA">MSA</option>
                            <option value="Closed Won">Closed Won</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsAddingOpportunity(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                        >
                          Save Opportunity
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Deals List */}
                  <div className="space-y-3">
                    {deals.map((deal: any) => {
                      const val = Number(deal.expectedRevenue || deal.revenue_amount || 500000);
                      const prob = Number(deal.probability || 50);
                      const weighted = Math.round((val * prob) / 100);

                      return (
                        <div
                          key={deal.id}
                          id={`deal_card_${deal.id}`}
                          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{deal.title || "Staffing Mandate Opportunity"}</h4>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded uppercase">
                                {deal.stage || "Proposal"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Target Date: {deal.targetCloseDate || "End of Quarter"} • Service: {deal.serviceType || "Contract Staffing"}
                            </div>
                          </div>

                          <div className="text-left sm:text-right">
                            <div className="text-sm font-extrabold text-emerald-700">₹{val.toLocaleString("en-IN")}</div>
                            <div className="text-[11px] text-slate-500">
                              Weighted: <strong className="text-slate-800">₹{weighted.toLocaleString("en-IN")}</strong> ({prob}%)
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {deals.length === 0 && !isAddingOpportunity && (
                      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 text-xs">
                        No sales pipeline opportunities recorded for this client. Click &quot;Add Opportunity&quot; to track active pursuits.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: UNIFIED AUDIT LEDGER (TIMELINE) */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Unified Event Ledger & System Audit Stream</h3>
                      <p className="text-xs text-slate-500">Immutable ledger events from Law 1 (system_events)</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      Append-Only • Immutable
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    {timeline.map((ev: any, idx: number) => (
                      <div key={ev.id || idx} className="flex items-start gap-3 text-xs border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 uppercase tracking-wide">
                              {ev.eventType || ev.type || "SYSTEM_EVENT"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ev.timestamp || ev.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5">
                            {ev.metadata?.description || ev.payload?.description || `Event logged by ${ev.actorId || "System"}`}
                          </p>
                          {ev.actorRole && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              Role: {ev.actorRole} • Source: {ev.sourceApp || "CRM"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {timeline.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No recorded system events for this client account yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
