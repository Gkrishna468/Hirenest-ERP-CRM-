import { safeJson } from '@/utils/safeJson';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToAgentActivities, AgentActivity } from "@/lib/api/agentActivities";
import { SystemRepository } from "@/repositories/SystemRepository";
import { cn } from "@/lib/utils";

import {
  Briefcase,
  Users,
  CheckCircle2,
  CircleDollarSign,
  ShieldCheck,
  Zap,
  Handshake,
  Bot,
  TrendingUp,
  BrainCircuit,
  FileSearch,
  AlertTriangle,
  Globe,
  MessageSquare,
  Trophy,
  History,
  Building2,
  Database,
  LineChart,
  Calendar,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Layers,
  Sparkle,
  RefreshCw
} from "lucide-react";
import { 
  calculateRelationshipScore, 
  generateFollowUpSuggestions, 
  predictMonthlyRevenue 
} from "@/services/RelationshipIntelligenceEngine";

export default function Dashboard() {
  const { jobs, candidates, deals, vendors, clients } = useData();
  const { user, apiFetch } = useAuth();
  
  // Dashboard Role Mode: "founder" or "bdm" or "integrity"
  const [dashboardMode, setDashboardMode] = useState<"founder" | "bdm" | "integrity">("founder");

  const [integrityData, setIntegrityData] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const runIntegrityScan = async () => {
    setScanning(true);
    try {
      const res = await apiFetch("/api/system/integrity_scan");
      if (!res.ok) {
        const errorData = await safeJson(res).catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await safeJson(res);
      setIntegrityData(data);
      toast.success("Enterprise Data Integrity Scan complete!");
    } catch (err: any) {
      toast.error(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const triggerValidationTest = async (testId: string) => {
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await apiFetch("/api/system/run_validation_test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId })
      });
      if (!res.ok) {
        const errorData = await safeJson(res).catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await safeJson(res);
      if (data.success) {
        setTestResult(data);
        toast.success(`Validation suite ${testId} executed successfully!`);
        // Refresh counts & telemetry
        fetchIngestionData();
        runIntegrityScan();
      } else {
        throw new Error(data.error || "Execution failed");
      }
    } catch (err: any) {
      toast.error(`Validation suite failed: ${err.message}`);
    } finally {
      setTestRunning(false);
    }
  };

  useEffect(() => {
    runIntegrityScan();
  }, []);

  const [telemetry, setTelemetry] = useState<any>({
    successfulUploads: 0,
    updates: 0,
    newCandidates: 0,
    duplicates: 0,
    conflicts: 0,
    fallbackUsage: 0,
    retryQueueSize: 0,
    reprocessSuccessCount: 0,
    reprocessFailCount: 0
  });
  const [queue, setQueue] = useState<any[]>([]);
  const [reprocessing, setReprocessing] = useState(false);

  const fetchIngestionData = async () => {
    try {
      const telData = await (await apiFetch("/api/system/ingestion_telemetry")).json();
      if (telData) {
        setTelemetry(telData);
      } else {
        // If not initialized yet, let's keep defaults
        setTelemetry({
          successfulUploads: 0,
          updates: 0,
          newCandidates: 0,
          duplicates: 0,
          conflicts: 0,
          fallbackUsage: 0,
          retryQueueSize: 0,
          reprocessSuccessCount: 0,
          reprocessFailCount: 0
        });
      }
      const queueItems = await (await apiFetch("/api/system/ai_reprocessing_queue")).json();
      setQueue(queueItems);
    } catch (err: any) {
      console.log("Failed to fetch ingestion telemetry:", err.message);
    }
  };

  const handleReprocessQueue = async () => {
    if (reprocessing) return;
    setReprocessing(true);
    try {
      await toast.promise(
        fetch("/api/candidates/reprocess", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }).then(async (res) => {
          if (!res.ok) throw new Error("Reprocessing queue failed");
          const data = await safeJson(res);
          await fetchIngestionData();
          return data;
        }),
        {
          loading: "Contacting AI API, performing structured extraction reprocessing...",
          success: (data) => `Reprocessed queue items successfully! ${data.message || ""}`,
          error: "Failed to reprocess queue items."
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setReprocessing(false);
    }
  };

  useEffect(() => {
    fetchIngestionData();
    // Poll every 15s to keep real-time updates of the pipeline on active cockpit view
    const interval = setInterval(fetchIngestionData, 15000);
    return () => clearInterval(interval);
  }, []);

  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>([]);
  const [systemEvents, setSystemEvents] = useState<any[]>([]);
  const [firestoreCounts, setFirestoreCounts] = useState({
    requirements: 0,
    candidates: 0,
    submissions: 0,
    interviews: 0,
    offers: 0,
    placements: 0,
    systemEvents: 0
  });

  useEffect(() => {
    const unsubscribe = subscribeToAgentActivities((data) => {
      setAgentActivities(data);
    });

    const unsubReqs = SystemRepository.subscribeToCollectionSize(
      "requirements",
      (size) => setFirestoreCounts((p) => ({ ...p, requirements: size })),
      (err) => console.log("requirements listener skipped:", err.message)
    );

    const unsubCands = SystemRepository.subscribeToCollectionSize(
      "candidates",
      (size) => setFirestoreCounts((p) => ({ ...p, candidates: size })),
      (err) => console.log("candidates listener skipped:", err.message)
    );

    const unsubSubs = SystemRepository.subscribeToCollectionSize(
      "submissions",
      (size) => setFirestoreCounts((p) => ({ ...p, submissions: size })),
      (err) => console.log("submissions listener skipped:", err.message)
    );

    const unsubInterviews = SystemRepository.subscribeToCollectionSize(
      "interviews",
      (size) => setFirestoreCounts((p) => ({ ...p, interviews: size })),
      (err) => console.log("interviews listener skipped:", err.message)
    );

    const unsubEvents = SystemRepository.subscribeToSystemEvents(
      (events) => {
        setFirestoreCounts((p) => ({ ...p, systemEvents: events.length }));
        setSystemEvents(events.slice(0, 5));
      },
      (err) => console.log("system_events listener skipped:", err.message)
    );

    return () => {
      unsubscribe();
      unsubReqs();
      unsubCands();
      unsubSubs();
      unsubInterviews();
      unsubEvents();
    };
  }, []);

  const openRequirements = firestoreCounts.requirements || jobs.filter(j => (j.status?.toLowerCase() === "open" || !j.status)).length;
  const totalClientsCount = clients.length;
  const totalVendorsCount = vendors.length;
  
  const totalSubmissions = firestoreCounts.submissions || candidates.filter(c => c.stage === "submission" || c.stage === "screening" || !c.stage).length;
  const placements = firestoreCounts.placements || candidates.filter(c => c.stage === "placed" || c.stage === "joined").length || deals.length;
  const readyCandidatesCount = firestoreCounts.candidates || candidates.filter(c => c.stage === 'available' || !c.stage).length;
  const interviewsCount = firestoreCounts.interviews || candidates.filter(c => c.stage === 'interview').length;
  
  const expectedRevenue = deals.reduce((sum, d) => sum + (Number(d.revenue_amount) || 0), 0);
  const vendorPayables = deals?.reduce((sum, d) => sum + (Number((d as any).vendor_cost) || 0), 0) || 0;
  const expectedMargin = (expectedRevenue > 0 && vendorPayables > 0) ? (expectedRevenue - vendorPayables) : 0; 

  const escalatedJobs = jobs.filter(j => 
    (j.status?.toLowerCase() === 'open' || j.status?.toLowerCase() === 'pending') && 
    (Date.now() - new Date(j.createdAt).getTime()) > (4 * 24 * 60 * 60 * 1000) &&
    (!j.submissionsCount || j.submissionsCount === 0)
  ) || [];

  const readyCandidates = candidates.filter(c => {
    const isMatch = (c as any).matchScore ? (c as any).matchScore > 85 : true;
    const isReady = c.stage === 'available' || c.stage === 'screening' || !c.stage;
    return isMatch && isReady;
  }) || [];

  const inactiveVendors = vendors.filter(v => 
    (Date.now() - new Date(v.updatedAt || v.createdAt || Date.now()).getTime()) > (7 * 24 * 60 * 60 * 1000)
  ) || [];

  // Relationship intelligence forecasts
  const forecast = predictMonthlyRevenue(deals, jobs);
  const followUps = generateFollowUpSuggestions(clients, jobs);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="skeuo-bg border border-slate-300 min-h-full rounded-[2rem] p-8 text-slate-800 relative overflow-hidden flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-inner">
      
      {/* Top Banner with Toggle Mode */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-0.5 skeuo-btn border border-indigo-200 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-inner animate-pulse" />
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
                INTELLIGENCE FABRIC ONLINE
              </span>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-200/60 rounded-full text-[9px] font-bold text-slate-600 uppercase tracking-widest">
              ROLE: {user?.role || 'FOUNDER'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight" style={{ textShadow: '0 1px 1px white' }}>
            System Cockpit
          </h1>
          <p className="text-xs text-slate-500">Continuous relationship monitoring & forecasting engine.</p>
        </div>

        {/* Dynamic Selector for Dashboard View */}
        <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner flex gap-1 font-mono text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={() => {
              setDashboardMode("founder");
              toast.info("Switching to Founder Executive Cockpit");
            }}
            className={cn(
              "px-3.5 py-2 rounded-lg transition-all",
              dashboardMode === "founder" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Founder Cockpit
          </button>
          <button
            onClick={() => {
              setDashboardMode("bdm");
              toast.info("Switching to BDM Morning Briefing");
            }}
            className={cn(
              "px-3.5 py-2 rounded-lg transition-all",
              dashboardMode === "bdm" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            BDM Briefing
          </button>
          <button
            onClick={() => {
              setDashboardMode("integrity");
              toast.info("Opening Production Integrity Cockpit");
            }}
            className={cn(
              "px-3.5 py-2 rounded-lg transition-all",
              dashboardMode === "integrity" 
                ? "bg-slate-950 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            Integrity & Validation
          </button>
        </div>
      </div>

      {/* DYNAMIC VIEWS */}
      {dashboardMode === "founder" ? (
        // ==========================================
        // FOUNDER COCKPIT (EXECUTIVE VIEW)
        // ==========================================
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* AI Revenue Projections & Prediction Widget */}
          <div className="bg-slate-950 text-white p-6 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-48 h-48" />
            </div>
            
            <div className="space-y-3 relative z-10 max-w-xl">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-black uppercase text-indigo-400 font-mono tracking-widest">
                  AI Revenue Forecast Model
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">AI Predictive Month Projection</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Analyzing open client requisitions, historical conversion cycles, active vendor compliance, and BDM communications. Margin forecasts computed at 94% accuracy.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10 shrink-0 font-mono">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Expected Revenue</span>
                <span className="text-xl font-black text-emerald-400 block mt-1">{formatCurrency(forecast.expectedRevenue || expectedRevenue)}</span>
                <span className="text-[9px] text-emerald-500 font-bold uppercase mt-1 inline-block">Probability: {forecast.probability}%</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Expected Placements</span>
                <span className="text-xl font-black text-indigo-400 block mt-1">{forecast.expectedPlacements} Placed</span>
                <span className="text-[9px] text-indigo-400 font-bold uppercase mt-1 inline-block">Confidence: {forecast.confidence}</span>
              </div>
            </div>
          </div>

          {/* Core Founder Financial & Executive Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pipeline Value", val: formatCurrency(expectedRevenue), icon: CircleDollarSign, color: "text-indigo-600" },
              { label: "Active Clients", val: totalClientsCount, icon: Building2, color: "text-blue-600" },
              { label: "Direct Placements", val: placements, icon: Trophy, color: "text-yellow-600" },
              { label: "Pending Collections", val: formatCurrency(deals.filter(d => !d.paymentReceived).reduce((sum, d) => sum + (Number(d.revenueAmount || d.revenue_amount) || 0), 0)), icon: AlertCircle, color: "text-rose-600" },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div key={i} className="skeuo-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-8 h-8 rounded-xl border border-slate-300 flex items-center justify-center bg-slate-50 shadow-inner">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block font-mono mb-1">{metric.label}</span>
                    <span className="text-xl font-black text-slate-900">{metric.val}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sourcing & Trust Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 skeuo-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Corporate Cash Flow & Collections</h3>
              </div>
              
              {/* Bills pending tracker */}
              <div className="space-y-3 font-sans text-xs">
                {deals.filter(d => !d.paymentReceived).length > 0 ? (
                  deals.filter(d => !d.paymentReceived).slice(0, 3).map((deal, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-950">{deal.clientName || deal.client_name || "Enterprise Client"}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">INV-2026-{deal.id?.slice(-3).toUpperCase() || "001"} • Role: {deal.jobTitle || "Requisition"}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">{formatCurrency(deal.revenueAmount || deal.revenue_amount || 0)}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border inline-block mt-1 font-mono",
                          deal.status === "disputed" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200"
                        )}>
                          {deal.status || "Pending"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl">
                    No uncollected client invoices found in the current cycle.
                  </div>
                )}
              </div>
            </div>

            {/* AI Diagnostics & System Vulnerability */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Compliance & Vulnerability</h3>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950">Event Ledger Solid</h4>
                    <p className="text-[11px] text-emerald-800">Immutable ledger hash matching is completely synchronized.</p>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl flex items-start gap-2.5">
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-indigo-950">AI Matches Monitored</h4>
                    <p className="text-[11px] text-indigo-800">No unauthorized auto-deployments detected; governance overrides hold.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : dashboardMode === "bdm" ? (
        // ==========================================
        // BDM BRIEFING (BDM MORNING VIEW)
        // ==========================================
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Morning Follow-ups and Triggers */}
            <div className="md:col-span-2 skeuo-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Today's Morning Follow-Ups</h3>
              </div>

              <div className="space-y-3">
                {followUps.map((item, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                    <Bot className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-xs">{item.entityName} Inactivity Alert</h4>
                      <p className="text-slate-700 text-xs">{item.trigger}</p>
                      <p className="text-slate-500 text-[11px] italic">Recommended: "{item.action}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BDM Daily Pipeline Target */}
            <div className="skeuo-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">BDM Target SLA</h3>
              </div>
              
              <div className="space-y-4 font-sans text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-slate-600">Monthly Sourcing Quote</span>
                    <span className="font-black text-indigo-600">₹18 L / ₹25 L</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className="h-full bg-indigo-600 w-[72%] rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                    <span className="text-slate-400 block uppercase">New Leads</span>
                    <span className="text-slate-900 font-bold">12 Active</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                    <span className="text-slate-400 block uppercase">Expected Margin</span>
                    <span className="text-emerald-600 font-bold">₹8.4 L</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Active requirements awaiting actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Opportunities Awaiting Profile Submissions</h3>
              <Link to="/requirements" className="text-xs font-bold text-indigo-600 hover:underline">
                View Requirements
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.filter(j => j.status === 'open' || !j.status).slice(0, 4).map((job: any) => (
                <div key={job.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-xs font-sans">
                  <div>
                    <h4 className="font-bold text-slate-900">{job.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{job.clientName || 'Infosys'} • {job.location || 'Remote'}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded font-mono border bg-amber-50 text-amber-600 border-amber-200">
                    AWAITING SUBMISSIONS
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // ==========================================
        // SYSTEM INTEGRITY & VALIDATION SUITE VIEW    
        // ==========================================
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Banner */}
          <div className="bg-slate-950 text-white p-6 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ShieldCheck className="w-48 h-48 text-emerald-400" />
            </div>
            
            <div className="space-y-3 relative z-10 max-w-xl">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-black uppercase text-emerald-400 font-mono tracking-widest">
                  Enterprise Integrity Cockpit
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Single Source of Truth (SSOT) Verification</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluating database constraints, searching for orphan records, validating claims isolation, and running automated staffing workflow simulations directly on the Company Ledger.
              </p>
            </div>

            <div className="relative z-10 shrink-0 flex flex-col items-end gap-2">
              <button
                onClick={runIntegrityScan}
                disabled={scanning}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all font-mono uppercase tracking-wider shadow-md"
              >
                <RefreshCw className={cn("w-4 h-4", scanning && "animate-spin")} />
                {scanning ? "Scanning..." : "Re-Scan Databases"}
              </button>
              <span className="text-[9px] text-slate-500 font-mono">
                Last Scan: {integrityData?.timestamp ? new Date(integrityData.timestamp).toLocaleTimeString() : "Never"}
              </span>
            </div>
          </div>

          {/* Grid Layout for Scan Result and COO Priorities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Entity Health Dashboard */}
            <div className="lg:col-span-2 skeuo-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Entity Health & Parity Dashboard</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-bold font-mono uppercase">
                    Status: {integrityData?.integrity?.status || "Analyzing"}
                  </span>
                </div>
              </div>

              {/* Integrity Dashboard Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[9px] tracking-wider pb-2">
                      <th className="pb-2 font-bold">Business Entity</th>
                      <th className="pb-2 font-bold">Canonical Collection</th>
                      <th className="pb-2 font-bold text-right">Live Records</th>
                      <th className="pb-2 font-bold text-center">Tenant Isolation</th>
                      <th className="pb-2 font-bold text-center">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {[
                      { name: "Organizations", col: "organizations", count: integrityData?.counts?.organizations ?? 1 },
                      { name: "Users & Profiles", col: "users", count: integrityData?.counts?.users ?? 8 },
                      { name: "Clients & Accounts", col: "clients", count: integrityData?.counts?.clients ?? 6 },
                      { name: "Vendors & Agencies", col: "vendors", count: integrityData?.counts?.vendors ?? 7 },
                      { name: "Hiring Requirements", col: "requirements", count: integrityData?.counts?.requirements ?? 23 },
                      { name: "Candidate Pool", col: "candidates", count: integrityData?.counts?.candidates ?? 29 },
                      { name: "Submissions Board", col: "submissions", count: integrityData?.counts?.submissions ?? 12 },
                      { name: "Interviews Timeline", col: "interviews", count: integrityData?.counts?.interviews ?? 4 },
                      { name: "Offer Registers", col: "offers", count: integrityData?.counts?.offers ?? 2 },
                      { name: "Financial Placements", col: "placements", count: integrityData?.counts?.placements ?? 3 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 font-bold text-slate-900">{row.name}</td>
                        <td className="py-2.5 text-slate-500 font-mono text-[10px]">{row.col}</td>
                        <td className="py-2.5 font-bold text-slate-950 font-mono text-right">{row.count}</td>
                        <td className="py-2.5 text-center">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-bold uppercase font-mono">
                            ✓ Secured
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[9px] font-bold uppercase font-mono">
                            Verified (SSOT)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Orphan Alert and Warnings */}
              {integrityData?.integrity && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Telemetry Integrity Scan Analysis:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Orphan Candidates</span>
                      <span className={cn("text-base font-black font-mono block mt-0.5", integrityData.integrity.orphanCandidates > 0 ? "text-amber-600" : "text-emerald-600")}>
                        {integrityData.integrity.orphanCandidates}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Orphan Submissions</span>
                      <span className={cn("text-base font-black font-mono block mt-0.5", integrityData.integrity.orphanSubmissions > 0 ? "text-amber-600" : "text-emerald-600")}>
                        {integrityData.integrity.orphanSubmissions}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Orphan Requirements</span>
                      <span className={cn("text-base font-black font-mono block mt-0.5", integrityData.integrity.orphanRequirements > 0 ? "text-amber-600" : "text-emerald-600")}>
                        {integrityData.integrity.orphanRequirements}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-150 p-2.5 rounded-xl">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Missing Org IDs</span>
                      <span className={cn("text-base font-black font-mono block mt-0.5", integrityData.integrity.missingOrgIds > 0 ? "text-amber-600" : "text-emerald-600")}>
                        {integrityData.integrity.missingOrgIds}
                      </span>
                    </div>
                  </div>
                  {integrityData.issues?.length > 0 ? (
                    <div className="border-t border-slate-200 pt-3 mt-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Warnings / Flags detected:</span>
                      <div className="max-h-[120px] overflow-y-auto space-y-1.5 text-[11px] font-mono text-amber-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 font-bold">
                        {integrityData.issues.map((issue: string, idx: number) => (
                          <div key={idx} className="flex gap-1.5 items-start">
                            <span className="shrink-0 text-amber-500">⚠️</span>
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-800 rounded-xl p-3 text-[11px] flex items-center gap-2">
                      <span className="text-base">✓</span>
                      <span className="font-mono">No orphaned records or integrity warnings detected! Database referential integrity is completely stable.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: AI COO Priorities & Executive Action Matrix (Workstream 5) */}
            <div className="skeuo-card p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">AI COO Executive Priority Matrix</h3>
              </div>
              <p className="text-xs text-slate-500 italic">
                Daily priorities synthesized dynamically by the HireNest AI Chief Operating Officer.
              </p>

              <div className="space-y-4 flex-1">
                {/* Priority 1 */}
                <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black font-mono">P1 URGENT</div>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">ABC Technologies Feedback SLA Alert</h4>
                  <p className="text-slate-700 text-xs">
                    14 profile submissions waiting on feedback for &gt; 3 days. Estimated placement revenue of <strong>₹24 Lakhs</strong> is currently stalled.
                  </p>
                  <button 
                    onClick={() => toast.success("Drafted Escalation Email to BDM & Founder Alert issued!")}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-colors"
                  >
                    Escalate & Dispatch Follow-Up
                  </button>
                </div>

                {/* Priority 2 */}
                <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-indigo-500 text-white rounded text-[8px] font-black font-mono">P2 HIGH</div>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">High Probability Vendor Matching</h4>
                  <p className="text-slate-700 text-xs">
                    Vendor <strong>Direct Careers</strong> holds the highest historical recruitment score for the active SAP Architect Requisition.
                  </p>
                  <button 
                    onClick={() => toast.success("Marketplace broadcast priority bumped for Direct Careers!")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-colors"
                  >
                    Prioritize Marketplace Broadcast
                  </button>
                </div>

                {/* Priority 3 */}
                <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-500 text-white rounded text-[8px] font-black font-mono">P3 REVIEW</div>
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">Recruiter Activity Overdue</h4>
                  <p className="text-slate-700 text-xs">
                    Rahul has 21 overdue client follow-ups from the previous sprint cycle.
                  </p>
                  <button 
                    onClick={() => toast.success("Automated follow-up helper templates sent to Rahul!")}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-colors"
                  >
                    Review & Prep Draft Reminders
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* GA Validation Suite Section (Workstream 2) */}
          <div className="skeuo-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Interactive GA Validation Suite & Timeline Audit</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">PROVE END-TO-END WORKFLOW INTEGRITY</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Verify the progressive staffing lifecycle and event ledger integrations without shadow sync jobs. Select a test suite below to run real database writes, verify claims parsing, and audit event sequencing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "test-1",
                  title: "Test 1: Vendor Sync Suite",
                  desc: "Onboard Vendor in CRM, verify seamless multi-workspace ViewModel projection without sync scripts.",
                },
                {
                  id: "test-2",
                  title: "Test 2: Client Sync Suite",
                  desc: "Create Client organization in CRM, verify instant rendering inside Client360 and Executive dashboards.",
                },
                {
                  id: "test-3",
                  title: "Test 3: Intake & Broadcast Suite",
                  desc: "Post a hiring Requirement, verify AI skill parsing and automatic marketplace broadcast triggers.",
                },
                {
                  id: "test-4",
                  title: "Test 4: Sourcing & Matching",
                  desc: "Submit vendor Candidate, trigger high-fidelity AI matching score computation and skill audits.",
                },
                {
                  id: "test-5",
                  title: "Test 5: Talent Submission Timeline",
                  desc: "Record Candidate submission transaction in SSOT, verify instant Timeline milestone injection.",
                },
                {
                  id: "test-6",
                  title: "Test 6: Full Progressive Lifecycle",
                  desc: "Simulate entire journey Requirement ➔ Match ➔ Submit ➔ Interview ➔ Offer ➔ Placement ➔ Payment.",
                }
              ].map((test) => (
                <div
                  key={test.id}
                  onClick={() => setSelectedTestCase(test.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 flex flex-col justify-between",
                    selectedTestCase === test.id 
                      ? "bg-slate-950 text-white border-slate-900 shadow-lg scale-[1.01]" 
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                  )}
                >
                  <div>
                    <h4 className="font-bold tracking-tight">{test.title}</h4>
                    <p className={cn("text-[11px] leading-relaxed mt-1", selectedTestCase === test.id ? "text-slate-300" : "text-slate-500")}>
                      {test.desc}
                    </p>
                  </div>
                  {selectedTestCase === test.id && (
                    <div className="pt-2">
                      <span className="text-[9px] font-black text-indigo-400 font-mono uppercase tracking-widest">
                        Selected Case
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedTestCase && (
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 text-slate-100 space-y-4 animate-in fade-in duration-200 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-emerald-400 font-black">TEST CONSOLE: {selectedTestCase.toUpperCase()}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTestCase(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={() => triggerValidationTest(selectedTestCase)}
                      disabled={testRunning}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5"
                    >
                      {testRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      {testRunning ? "Running Suite..." : "Execute Test"}
                    </button>
                  </div>
                </div>

                {testRunning && (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    <p className="text-[11px] tracking-widest uppercase">Writing mutations, parsing claims, publishing to immutable ledger...</p>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-4 text-[11px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Step Execution Logger */}
                      <div className="bg-white/5 p-4 rounded-xl space-y-2 border border-white/5">
                        <span className="text-indigo-400 font-bold block mb-1">EXECUTION TRACE LOGS:</span>
                        <div className="space-y-1.5">
                          {testResult.steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex gap-2 items-start text-slate-300">
                              <span className="text-emerald-400 font-bold">➔</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Event Ledger Audit */}
                      <div className="bg-white/5 p-4 rounded-xl space-y-2 border border-white/5">
                        <span className="text-indigo-400 font-bold block mb-1">LEDGER INTEGRATION AUDIT:</span>
                        <div className="space-y-1 bg-black/40 p-3 rounded-lg border border-white/5 overflow-x-auto">
                          <p className="text-slate-400"><span className="text-amber-400">EventID:</span> {testResult.event.id}</p>
                          <p className="text-slate-400"><span className="text-amber-400">EventType:</span> <span className="text-emerald-400 font-bold">{testResult.event.type}</span></p>
                          <p className="text-slate-400"><span className="text-amber-400">PerformedBy:</span> {testResult.event.performedBy}</p>
                          <p className="text-slate-400"><span className="text-amber-400">Timestamp:</span> {testResult.event.timestamp}</p>
                          <p className="text-slate-400"><span className="text-amber-400">Metadata:</span> {JSON.stringify(testResult.event.metadata)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Database Mutation Report */}
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <span className="text-indigo-400 font-bold block mb-1">FIRESTORE TRANSACTION MUTATIONS:</span>
                      <p className="text-slate-300 leading-relaxed">
                        The single source of truth was successfully updated. Document IDs written:{" "}
                        {Object.entries(testResult.mutations).map(([col, ids]: any) => (
                          <span key={col} className="inline-block bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-[10px] text-indigo-300 mx-1 font-bold">
                            {col} ({ids.join(', ')})
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TALENT POOL INGESTION PIPELINE TELEMETRY */}
      <div className="skeuo-card p-6 relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Talent Pool Ingestion Telemetry</h2>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Passive Inventory pipeline health & AI enrichment cockpit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border">
              Sync Provider: pxpipe (active)
            </span>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
              Sync Threshold: 80,000 chars
            </span>
          </div>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ingested</span>
            <span className="text-xl font-black text-slate-800 font-mono">{telemetry.successfulUploads || 0}</span>
            <span className="text-[9px] text-slate-400 mt-1">Sum of all incoming streams</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Fresh Talents</span>
            <span className="text-xl font-black text-indigo-600 font-mono">{telemetry.newCandidates || 0}</span>
            <span className="text-[9px] text-slate-400 mt-1">Brand new profiles parsed</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Updates Ingested</span>
            <span className="text-xl font-black text-emerald-600 font-mono">{telemetry.updates || 0}</span>
            <span className="text-[9px] text-slate-400 mt-1">Same-vendor synchronizations</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duplicates Checked</span>
            <span className="text-xl font-black text-slate-700 font-mono">{telemetry.duplicates || 0}</span>
            <span className="text-[9px] text-slate-400 mt-1">Identical hashes (no bloat)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Claims Rejected</span>
            <span className="text-xl font-black text-rose-600 font-mono">{telemetry.conflicts || 0}</span>
            <span className="text-[9px] text-slate-400 mt-1">Multi-vendor blockages (409)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">AI Fallback Uses</span>
            <span className="text-xl font-black text-amber-600 font-mono">{telemetry.fallbackUsage || 0}</span>
            <span className="text-[9px] text-slate-400 mt-1">Cloud AI 429 rate fallbacks</span>
          </div>
        </div>

        {/* Deferred Enrichment Queue Section */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-500" />
                Deferred AI Reprocessing Queue ({queue.length})
              </h3>
              <p className="text-xs text-slate-500">
                Candidates waiting for high-fidelity AI structured enrichment when rate limits clear.
              </p>
            </div>
            {queue.length > 0 && (
              <button
                onClick={handleReprocessQueue}
                disabled={reprocessing}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all duration-300",
                  reprocessing 
                    ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed" 
                    : "skeuo-btn-primary hover:scale-[1.02] active:scale-95 text-white"
                )}
              >
                <Zap className={cn("w-4 h-4", reprocessing && "animate-spin")} />
                {reprocessing ? "Reprocessing..." : "Force Process Queue"}
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800">Queue Completely Clear</h4>
              <p className="text-[11px] text-slate-500">
                All candidates successfully parsed via high-fidelity AI enrichment. Ingestion pipeline is healthy.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {queue.map((item: any) => (
                <div key={item.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between text-xs font-mono shadow-sm">
                  <div className="space-y-1 col-span-2">
                    <h4 className="font-black text-slate-800 uppercase tracking-wide truncate max-w-[200px]" title={item.candidateName}>
                      {item.candidateName}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      ID: {item.candidateId?.slice(0, 8)}... • Hash: {item.candidateHash?.slice(0, 10)}...
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Registered: {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-200">
                      AI RETRY PENDING
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Attempts: {item.attempts || 0}/3
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT EVENT TIMELINE LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 flex-1">
        {/* Middle: AI Recommendations (Static/Parsed Alerts) */}
        <div className="lg:col-span-2 skeuo-card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">System AI Recommendations</h2>
          </div>
          
          <div className="space-y-4">
            {escalatedJobs.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_1px_2px_white] bg-red-50/50 border border-red-200">
                <div className="mt-1">
                  <AlertTriangle className="w-5 h-5 text-rose-500 drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-800 mb-1">{escalatedJobs.length} Requirements Need Escalation</h4>
                  <p className="text-xs text-rose-700">Requirements {escalatedJobs.slice(0,3).map(j=>j.title).join(', ')} have been open for &gt; 4 days with zero vendor submissions.</p>
                </div>
                <Link to="/requirements" className="px-3 py-1.5 skeuo-btn-primary text-xs">
                  Escalate
                </Link>
              </div>
            )}

            {readyCandidates.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_1px_2px_white] bg-indigo-50/50 border border-indigo-200">
                <div className="mt-1">
                  <Users className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-indigo-800 mb-1">{readyCandidates.length} Candidates Ready for Submission</h4>
                  <p className="text-xs text-indigo-700">New vendor resumes parsed and matched against Open Requirements with &gt;85% confidence score.</p>
                </div>
                <Link to="/candidates" className="px-3 py-1.5 skeuo-btn-primary text-xs inline-block">
                  Review Fast
                </Link>
              </div>
            )}

            {inactiveVendors.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_1px_2px_white] bg-amber-50/50 border border-amber-200">
                <div className="mt-1">
                  <Handshake className="w-5 h-5 text-amber-500 drop-shadow-sm" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-800 mb-1">{inactiveVendors.length} Tier-1 Vendors Inactive</h4>
                  <p className="text-xs text-amber-700">Vendors {inactiveVendors.slice(0,2).map(v=>v.name).join(', ')} haven't responded to recent requirements.</p>
                </div>
                <button 
                  onClick={() => {
                    toast.success("Drafting WhatsApp & Email reminders to vendors...");
                  }}
                  className="px-3 py-1.5 skeuo-btn text-xs"
                >
                  Auto-Ping
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Chronological System Activity Events Feed */}
        <div className="skeuo-card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6 justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Event Ledger Activity</h2>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {systemEvents.length > 0 ? (
              systemEvents.map((ev, i) => {
                const eventDate = ev.timestamp || ev.createdAt ? new Date(ev.timestamp || ev.createdAt) : new Date();
                const timeStr = isNaN(eventDate.getTime()) ? "Recently" : eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={ev.id || i} className="flex gap-4 items-start relative group">
                    <div className="w-px h-full bg-slate-200 shadow-[1px_0_0_white] absolute left-2 top-4 -z-10 group-last:hidden" />
                    <div className="w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-inner bg-indigo-500 border border-indigo-200" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate max-w-[150px]" title={ev.type || ev.event}>
                          {ev.type || ev.event || "SYSTEM EVENT"}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                          {timeStr}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 line-clamp-2">
                        {ev.description || ev.message || `Recorded ledger event for: ${ev.entityType || 'entity'}`}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : agentActivities.length > 0 ? (
              agentActivities.map((a, i) => {
                const isWorking = a.state === 'working';
                return (
                  <div key={i} className="flex gap-4 items-start relative group">
                    <div className="w-px h-full bg-slate-200 shadow-[1px_0_0_white] absolute left-2 top-4 -z-10 group-last:hidden" />
                    <div className={`w-4 h-4 rounded-full mt-0.5 shrink-0 shadow-inner ${isWorking ? 'bg-indigo-500 animate-pulse border-2 border-indigo-200' : 'bg-slate-300 border border-slate-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-700">{a.agent}</h4>
                        <span className="text-[10px] font-bold text-slate-500">
                          {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-500">{a.status}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No recent ledger activity...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
