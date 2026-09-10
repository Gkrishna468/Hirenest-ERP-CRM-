import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Building2,
  ChevronRight,
  Info,
  Send,
  Copy,
  Check,
  RefreshCw,
  Search,
  ArrowUpDown,
  Sliders,
  FileText,
  HelpCircle,
  Layers,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function QualityControl() {
  const { user } = useAuth();

  // Filter states
  const [dateRange, setDateRange] = useState<string>("last30days");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>("");

  // Experience Discrepancy threshold customization
  const [minTotalYears, setMinTotalYears] = useState<number>(5);
  const [maxRelevantRatio, setMaxRelevantRatio] = useState<number>(0.4);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<"cockpit" | "vendors" | "requirements" | "comparison" | "trends">("cockpit");

  // Loading & Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [overviewData, setOverviewData] = useState<any>(null);

  // Modals & Drawers
  const [selectedVendorFor360, setSelectedVendorFor360] = useState<any>(null);
  const [whyRankVendor, setWhyRankVendor] = useState<any>(null);
  const [copiedCoaching, setCopiedCoaching] = useState<boolean>(false);
  const [sendingCoaching, setSendingCoaching] = useState<boolean>(false);

  // Vendor comparison selections
  const [comparisonVendorIds, setComparisonVendorIds] = useState<string[]>([]);

  // Candidates Drill-down modal
  const [drillDownModalOpen, setDrillDownModalOpen] = useState<boolean>(false);
  const [drillDownTitle, setDrillDownTitle] = useState<string>("");
  const [drillDownParams, setDrillDownParams] = useState<any>(null);
  const [drillDownCandidates, setDrillDownCandidates] = useState<any[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState<boolean>(false);

  const token = localStorage.getItem("firebaseToken") || "executive-bypass-token";

  // Fetch Overview Data
  const fetchOverview = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append("dateRange", dateRange);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedVendorId) params.append("vendorId", selectedVendorId);
      if (selectedRequirementId) params.append("requirementId", selectedRequirementId);
      params.append("minTotalForDiscrepancy", minTotalYears.toString());
      params.append("maxRelevantRatio", maxRelevantRatio.toString());

      const res = await fetch(`/api/quality-control/overview?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOverviewData(json.data);
      } else {
        toast.error(json.error || "Failed to load quality control data");
      }
    } catch (err: any) {
      console.error("Failed to load quality control overview:", err);
      toast.error("Network error loading quality metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [dateRange, startDate, endDate, selectedVendorId, selectedRequirementId, minTotalYears, maxRelevantRatio]);

  // Open Candidate Drill-down Modal
  const openCandidatesDrillDown = async (title: string, params: { decision?: string; rejectionCategory?: string; keywordOnly?: string; vendorId?: string; requirementId?: string }) => {
    setDrillDownTitle(title);
    setDrillDownParams(params);
    setDrillDownModalOpen(true);
    setDrillDownLoading(true);

    try {
      const query = new URLSearchParams();
      if (params.decision) query.append("decision", params.decision);
      if (params.rejectionCategory) query.append("rejectionCategory", params.rejectionCategory);
      if (params.keywordOnly) query.append("keywordOnly", params.keywordOnly);
      if (params.vendorId || selectedVendorId) query.append("vendorId", params.vendorId || selectedVendorId);
      if (params.requirementId || selectedRequirementId) query.append("requirementId", params.requirementId || selectedRequirementId);

      const res = await fetch(`/api/quality-control/candidates?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setDrillDownCandidates(json.data || []);
      } else {
        toast.error("Failed to load drill-down candidates");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error loading candidates");
    } finally {
      setDrillDownLoading(false);
    }
  };

  // Dispatch Vendor Coaching Memo
  const handleSendCoaching = async (vendor: any) => {
    setSendingCoaching(true);
    try {
      const res = await fetch("/api/quality-control/send-coaching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          subject: vendor.coachingFeedback.subject,
          body: vendor.coachingFeedback.body,
          actionItems: vendor.coachingFeedback.actionItems
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || `Coaching memo logged for ${vendor.vendorName}`);
      } else {
        toast.error(json.error || "Failed to dispatch coaching memo");
      }
    } catch (err) {
      toast.error("Error dispatching coaching memo");
    } finally {
      setSendingCoaching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCoaching(true);
    toast.success("Coaching memo copied to clipboard");
    setTimeout(() => setCopiedCoaching(false), 2500);
  };

  // Comparison vendor list
  const comparisonVendors = useMemo(() => {
    if (!overviewData?.vendorIntelligence) return [];
    return overviewData.vendorIntelligence.filter((v: any) => comparisonVendorIds.includes(v.vendorId));
  }, [overviewData, comparisonVendorIds]);

  const toggleComparisonVendor = (id: string) => {
    if (comparisonVendorIds.includes(id)) {
      setComparisonVendorIds(comparisonVendorIds.filter(x => x !== id));
    } else {
      if (comparisonVendorIds.length >= 4) {
        toast.error("Maximum 4 vendors can be compared simultaneously");
        return;
      }
      setComparisonVendorIds([...comparisonVendorIds, id]);
    }
  };

  // Palette colors
  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

  if (loading && !overviewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-600 font-medium text-sm">Aggregating deterministic quality metrics...</p>
      </div>
    );
  }

  const kpis = overviewData?.kpis || {};
  const rejections = overviewData?.rejectionDiagnostics || {};
  const expQuality = overviewData?.experienceQuality || {};
  const skillQuality = overviewData?.skillEvidenceQuality || {};
  const vendorIntel = overviewData?.vendorIntelligence || [];
  const actionAlerts = overviewData?.actionCenterAlerts || [];
  const reqQuality = overviewData?.requirementQuality || [];
  const clientQuality = overviewData?.clientQuality || [];
  const trends = overviewData?.trends || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Quality Control & Vendor Intelligence
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Deterministic SSOT
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Real-time analytics on candidate quality, resume evidence integrity, and vendor sourcing reliability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Period Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Period: {overviewData?.dataPeriod?.formatted || "Last 30 Days"}</span>
          </div>

          <button
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "today", label: "Today" },
            { id: "yesterday", label: "Yesterday" },
            { id: "last7days", label: "Last 7 Days" },
            { id: "last30days", label: "Last 30 Days" },
            { id: "thismonth", label: "This Month" },
            { id: "lastmonth", label: "Last Month" },
            { id: "custom", label: "Custom" }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setDateRange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateRange === btn.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {dateRange === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="text-xs p-1.5 border border-slate-300 rounded-lg bg-slate-50"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="text-xs p-1.5 border border-slate-300 rounded-lg bg-slate-50"
            />
          </div>
        )}

        {/* Vendor & Requirement Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedVendorId}
              onChange={e => setSelectedVendorId(e.target.value)}
              className="text-xs py-1.5 pl-3 pr-7 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Vendors</option>
              {vendorIntel.map((v: any) => (
                <option key={v.vendorId} value={v.vendorId}>
                  {v.vendorName} ({v.profilesSubmitted} submissions)
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedRequirementId}
              onChange={e => setSelectedRequirementId(e.target.value)}
              className="text-xs py-1.5 pl-3 pr-7 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Requirements</option>
              {reqQuality.map((r: any) => (
                <option key={r.requirementId} value={r.requirementId}>
                  {r.title} ({r.profilesReceived} received)
                </option>
              ))}
            </select>
          </div>

          {(selectedVendorId || selectedRequirementId) && (
            <button
              onClick={() => {
                setSelectedVendorId("");
                setSelectedRequirementId("");
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-bold">
        {[
          { id: "cockpit", label: "Sourcing Head Cockpit" },
          { id: "vendors", label: `Vendor Intelligence (${vendorIntel.length})` },
          { id: "requirements", label: `Requirement Quality (${reqQuality.length})` },
          { id: "comparison", label: `Vendor Comparison (${comparisonVendorIds.length})` },
          { id: "trends", label: "Quality Trends" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-1 border-b-2 font-bold transition flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SOURCING HEAD COCKPIT */}
      {activeTab === "cockpit" && (
        <div className="space-y-6">
          {/* Action Center Alerts (Phase 2N) */}
          {actionAlerts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Sourcing Head Action Center ({actionAlerts.length} Active Alerts)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {actionAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition ${
                      alert.priority === "HIGH"
                        ? "bg-rose-50/70 border-rose-200 text-rose-950"
                        : "bg-amber-50/70 border-amber-200 text-amber-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                              alert.priority === "HIGH" ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"
                            }`}
                          >
                            {alert.priority} PRIORITY
                          </span>
                          <span className="text-xs font-bold text-slate-800">{alert.title}</span>
                        </div>
                        <p className="text-xs text-slate-700">{alert.reason}</p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          <span className="font-bold text-slate-700">Evidence:</span> {alert.evidence}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <p className="text-[11px] font-medium text-slate-600 italic">
                        <span className="font-bold not-italic text-slate-800">Action:</span> {alert.recommendedAction}
                      </p>
                      {alert.targetType === "VENDOR" && alert.targetId && (
                        <button
                          onClick={() => {
                            const v = vendorIntel.find((x: any) => x.vendorId === alert.targetId);
                            if (v) setSelectedVendorFor360(v);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 ml-2"
                        >
                          Coach Vendor →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 10 KPI Cards (Phase 2B) */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
              Executive Quality & Conversion KPIs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Card 1: Total Profiles */}
              <div
                onClick={() => openCandidatesDrillDown("All Ingested Candidates", {})}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Ingested</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpis.totalProfiles ?? 0}</div>
                <p className="text-[11px] text-slate-400 mt-1">Candidates received</p>
              </div>

              {/* Card 2: Screened */}
              <div
                onClick={() => openCandidatesDrillDown("Screened Candidates", {})}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Screened</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpis.screenedProfiles ?? 0}</div>
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">
                  {kpis.totalProfiles > 0
                    ? `${Math.round((kpis.screenedProfiles / kpis.totalProfiles) * 100)}% coverage`
                    : "0%"}
                </p>
              </div>

              {/* Card 3: Pass Count & Pass Rate */}
              <div
                onClick={() => openCandidatesDrillDown("Passed Candidates", { decision: "PASS" })}
                className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-400 transition"
              >
                <div className="flex items-center justify-between text-emerald-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Pass Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {kpis.screeningPassRate !== null ? `${kpis.screeningPassRate}%` : "N/A"}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  {kpis.passedProfiles ?? 0} passed screening
                </p>
              </div>

              {/* Card 4: Review Count */}
              <div
                onClick={() => openCandidatesDrillDown("Candidates in Review", { decision: "REVIEW" })}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm cursor-pointer hover:border-amber-400 transition"
              >
                <div className="flex items-center justify-between text-amber-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">In Review</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-700">{kpis.reviewProfiles ?? 0}</div>
                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                  {kpis.screenedProfiles > 0
                    ? `${Math.round((kpis.reviewProfiles / kpis.screenedProfiles) * 100)}% of screened`
                    : "0%"}
                </p>
              </div>

              {/* Card 5: Reject Count */}
              <div
                onClick={() => openCandidatesDrillDown("Rejected Candidates", { decision: "REJECT" })}
                className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm cursor-pointer hover:border-rose-400 transition"
              >
                <div className="flex items-center justify-between text-rose-700 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
                  <XCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-rose-700">{kpis.rejectedProfiles ?? 0}</div>
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  {kpis.screenedProfiles > 0
                    ? `${Math.round((kpis.rejectedProfiles / kpis.screenedProfiles) * 100)}% rejection rate`
                    : "0%"}
                </p>
              </div>

              {/* Card 6: Average Match Score */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Avg Match</span>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {kpis.averageMatchScore !== null ? `${kpis.averageMatchScore}%` : "N/A"}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Mean requirement match</p>
              </div>

              {/* Card 7: Total Submissions */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Submissions</span>
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-900">{kpis.totalSubmissions ?? 0}</div>
                <p className="text-[11px] text-slate-400 mt-1">Presented to clients</p>
              </div>

              {/* Card 8: Client Shortlist Rate */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Shortlist Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {kpis.clientShortlistRate !== null ? `${kpis.clientShortlistRate}%` : "0%"}
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  {kpis.clientShortlistCount ?? 0} shortlisted
                </p>
              </div>

              {/* Card 9: Interview Conversion */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Interviews</span>
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {kpis.interviewConversion !== null ? `${kpis.interviewConversion}%` : "0%"}
                </div>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  {kpis.interviewCount ?? 0} scheduled
                </p>
              </div>

              {/* Card 10: Placements */}
              <div className="bg-white p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-sm">
                <div className="flex items-center justify-between text-indigo-800 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Placements</span>
                  <Award className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-900">{kpis.placementCount ?? 0}</div>
                <p className="text-[11px] text-indigo-700 font-semibold mt-1">
                  {kpis.placementConversion !== null ? `${kpis.placementConversion}% conversion` : "0%"}
                </p>
              </div>
            </div>
          </div>

          {/* Diagnostic Grids: Rejection Analysis & Experience/Skill Quality (Phases 2D-2G) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rejection Diagnostics (Phases 2D & 2E) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rejection Diagnostics</h3>
                  <p className="text-xs text-slate-500">Root causes from deterministic screening records</p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                  {rejections.totalRejections ?? 0} Rejections
                </span>
              </div>

              {rejections.categories && rejections.categories.length > 0 ? (
                <div className="space-y-3">
                  {rejections.categories.map((cat: any) => (
                    <div
                      key={cat.category}
                      onClick={() => openCandidatesDrillDown(`Rejections: ${cat.label}`, { rejectionCategory: cat.category, decision: "REJECT" })}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                        <span>{cat.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-semibold">{cat.count} profiles</span>
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-black">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Bar indicator */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, cat.percentage)}%` }}
                        />
                      </div>
                      {cat.sampleReasons && cat.sampleReasons.length > 0 && (
                        <p className="text-[11px] text-slate-500 italic mt-1 truncate">
                          "{cat.sampleReasons[0]}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Zero Rejections in Period</p>
                  <p className="text-[11px] text-slate-400">All submitted profiles passed screening thresholds.</p>
                </div>
              )}
            </div>

            {/* Experience & Skill Quality Analysis (Phases 2F & 2G) */}
            <div className="space-y-6">
              {/* Experience Quality (Phase 2F) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Experience Quality Analysis</h3>
                    <p className="text-xs text-slate-500">Total vs. Relevant verified hands-on duration</p>
                  </div>
                  <button
                    onClick={() => {
                      const newTotal = prompt("Set minimum Total Experience years to flag for discrepancy:", minTotalYears.toString());
                      if (newTotal) setMinTotalYears(parseFloat(newTotal) || 5);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Threshold: {minTotalYears}y</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Average Total Experience</span>
                    <div className="text-xl font-black text-slate-800 mt-0.5">
                      {expQuality.averageTotalExperienceYears !== null ? `${expQuality.averageTotalExperienceYears} yrs` : "N/A"}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Average Relevant Experience</span>
                    <div className="text-xl font-black text-indigo-700 mt-0.5">
                      {expQuality.averageRelevantExperienceYears !== null ? `${expQuality.averageRelevantExperienceYears} yrs` : "N/A"}
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => openCandidatesDrillDown("Experience Discrepancy Candidates", { rejectionCategory: "experience" })}
                  className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100/50 transition flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Major Experience Discrepancies
                    </span>
                    <p className="text-[11px] text-amber-700">
                      Total ≥ {minTotalYears}y with relevant experience &lt; {Math.round(maxRelevantRatio * 100)}% of total
                    </p>
                  </div>
                  <span className="text-lg font-black text-amber-900 bg-amber-200 px-3 py-0.5 rounded-full">
                    {expQuality.majorDiscrepancyCount ?? 0}
                  </span>
                </div>
              </div>

              {/* Skill Evidence Quality (Phase 2G) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Skill Evidence Depth (L0–L4)</h3>
                    <p className="text-xs text-slate-500">Documented project & architectural implementation</p>
                  </div>
                  {skillQuality.keywordOnlyPercentage > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded">
                      {skillQuality.keywordOnlyPercentage}% Keyword-Only
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {skillQuality.breakdown?.map((item: any) => (
                    <div key={item.level} className="flex items-center gap-3 text-xs">
                      <span className="w-36 font-semibold text-slate-700 truncate">{item.label}</span>
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.level === "L0"
                              ? "bg-rose-400"
                              : item.level === "L1"
                              ? "bg-amber-400"
                              : item.level === "L2"
                              ? "bg-blue-400"
                              : item.level === "L3"
                              ? "bg-indigo-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-bold text-slate-800">{item.percentage}%</span>
                      <span className="w-12 text-right text-slate-400 text-[11px]">({item.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR INTELLIGENCE & RANKING (Phases 2H-2M) */}
      {activeTab === "vendors" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Vendor Quality & Sourcing Intelligence</h3>
                <p className="text-xs text-slate-500">
                  Deterministic partner performance based on actual screening decisions and client conversions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Select vendors to compare:</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700">
                  {comparisonVendorIds.length} Selected
                </span>
                {comparisonVendorIds.length > 0 && (
                  <button
                    onClick={() => setActiveTab("comparison")}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Compare Now →
                  </button>
                )}
              </div>
            </div>

            {/* Vendor Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-8">Compare</th>
                    <th className="py-3 px-3">Vendor / Partner</th>
                    <th className="py-3 px-3 text-center">Rating</th>
                    <th className="py-3 px-3 text-right">Submissions</th>
                    <th className="py-3 px-3 text-right">Screened</th>
                    <th className="py-3 px-3 text-right">Pass Rate</th>
                    <th className="py-3 px-3 text-right">Avg Match</th>
                    <th className="py-3 px-3 text-right">Shortlists</th>
                    <th className="py-3 px-3 text-right">Placements</th>
                    <th className="py-3 px-3">Top Quality Bottleneck</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vendorIntel.map((v: any) => {
                    const isSelected = comparisonVendorIds.includes(v.vendorId);
                    return (
                      <tr key={v.vendorId} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleComparisonVendor(v.vendorId)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{v.vendorName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{v.vendorCode || v.vendorId}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {v.qualityRating === "NOT_YET_RATED" ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
                              NOT YET RATED
                            </span>
                          ) : (
                            <button
                              onClick={() => setWhyRankVendor(v)}
                              className={`px-2.5 py-0.5 text-xs font-black rounded-full border transition flex items-center gap-1 mx-auto ${
                                v.qualityRating === "A+" || v.qualityRating === "A"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200"
                                  : v.qualityRating === "B"
                                  ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
                                  : v.qualityRating === "C"
                                  ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                                  : "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200"
                              }`}
                            >
                              <span>{v.qualityRating}</span>
                              <span className="text-[10px] font-medium opacity-70">({v.compositeScore}%)</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-800">{v.profilesSubmitted}</td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-600">{v.profilesScreened}</td>
                        <td className="py-3 px-3 text-right">
                          {v.passRate !== null ? (
                            <span
                              className={`font-black ${
                                v.passRate >= 75
                                  ? "text-emerald-700"
                                  : v.passRate >= 50
                                  ? "text-blue-700"
                                  : "text-rose-600"
                              }`}
                            >
                              {v.passRate}%
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {v.avgMatchScore !== null ? (
                            <span className="font-semibold text-slate-800">{v.avgMatchScore}%</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-slate-700">{v.shortlists}</td>
                        <td className="py-3 px-3 text-right font-black text-indigo-700">{v.placements}</td>
                        <td className="py-3 px-3">
                          {v.topRejectionReasons && v.topRejectionReasons.length > 0 ? (
                            <span className="text-[11px] text-slate-700 font-medium">
                              {v.topRejectionReasons[0].reason} ({v.topRejectionReasons[0].count})
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold">No Major Deficit</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedVendorFor360(v)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs transition"
                          >
                            Vendor 360
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REQUIREMENT QUALITY (Phases 2P & 2Q) */}
      {activeTab === "requirements" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Requirement Screening & Funnel Analysis</h3>
              <p className="text-xs text-slate-500">
                Identify whether hiring bottlenecks stem from vendor sourcing deficits or uncalibrated job criteria.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Requirement Title</th>
                    <th className="py-3 px-3">Client</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Received</th>
                    <th className="py-3 px-3 text-right">Screened</th>
                    <th className="py-3 px-3 text-right">Pass Rate</th>
                    <th className="py-3 px-3 text-right">Shortlists</th>
                    <th className="py-3 px-3 text-right">Placements</th>
                    <th className="py-3 px-3">Top Rejection Bottleneck</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reqQuality.map((r: any) => (
                    <tr key={r.requirementId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{r.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.requirementId}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">{r.clientName}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">{r.profilesReceived}</td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-600">{r.profilesScreened}</td>
                      <td className="py-3 px-3 text-right">
                        {r.passRate !== null ? (
                          <span
                            className={`font-black ${
                              r.passRate >= 70
                                ? "text-emerald-700"
                                : r.passRate >= 40
                                ? "text-blue-700"
                                : "text-rose-600"
                            }`}
                          >
                            {r.passRate}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">{r.shortlists}</td>
                      <td className="py-3 px-3 text-right font-black text-indigo-700">{r.placements}</td>
                      <td className="py-3 px-3">
                        {r.topRejectionReasons && r.topRejectionReasons.length > 0 ? (
                          <span className="text-[11px] text-slate-700 font-medium">
                            {r.topRejectionReasons[0].reason} ({r.topRejectionReasons[0].count})
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">High Alignment</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VENDOR COMPARISON (Phase 2O) */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Side-by-Side Vendor Quality Comparison</h3>
                <p className="text-xs text-slate-500">Benchmark multiple partners on identical evaluation metrics</p>
              </div>
              {comparisonVendors.length === 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
                  Please select at least 2 vendors from the Vendor Intelligence tab to compare.
                </p>
              )}
            </div>

            {comparisonVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {comparisonVendors.map((v: any) => (
                  <div key={v.vendorId} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black text-slate-900">{v.vendorName}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{v.vendorCode}</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-black rounded bg-indigo-100 text-indigo-800">
                        {v.qualityRating}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Submissions:</span>
                        <span className="font-bold text-slate-800">{v.profilesSubmitted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Screening Pass Rate:</span>
                        <span className="font-bold text-emerald-700">{v.passRate !== null ? `${v.passRate}%` : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Avg Match Score:</span>
                        <span className="font-bold text-slate-800">{v.avgMatchScore !== null ? `${v.avgMatchScore}%` : "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Client Shortlists:</span>
                        <span className="font-bold text-slate-800">{v.shortlists}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Placements:</span>
                        <span className="font-black text-indigo-700">{v.placements}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Top Failure Mode:</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {v.topRejectionReasons[0]?.reason || "No Major Failure Mode"}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedVendorFor360(v)}
                      className="w-full py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition mt-2"
                    >
                      Vendor 360 & Coaching
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 5: QUALITY TRENDS (Phase 2R) */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900">Weekly Quality & Throughput Trends</h3>
              <p className="text-xs text-slate-500">Evolution of screening pass rates and conversion volume</p>
            </div>

            {trends.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px"
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line type="monotone" dataKey="profilesReceived" name="Profiles Received" stroke="#64748b" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="passed" name="Passed Screening" stroke="#10b981" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="shortlisted" name="Shortlisted" stroke="#3b82f6" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="placed" name="Placements" stroke="#8b5cf6" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 font-bold text-sm">NO DATA IN PERIOD</div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: WHY THIS RANK MODAL (Phase 2K) */}
      {whyRankVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Why This Rank? — {whyRankVendor.vendorName}</h3>
              </div>
              <button
                onClick={() => setWhyRankVendor(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="font-semibold text-slate-700">
                HireNest CRM calculates vendor quality ratings using a transparent, deterministic weighted model:
              </p>
              <p className="font-mono text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                {whyRankVendor.whyThisRank?.formulaExplanation || "Score = (Pass Rate × 35%) + (Avg Match × 25%) + (Shortlist Rate × 20%) + (Placement Conversion × 20%)"}
              </p>
            </div>

            {whyRankVendor.whyThisRank && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="font-medium text-slate-600">Screening Quality (Pass Rate × 35%)</span>
                  <span className="font-bold text-slate-900">{whyRankVendor.whyThisRank.screeningContribution} pts</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="font-medium text-slate-600">Requirement Match (Avg Match × 25%)</span>
                  <span className="font-bold text-slate-900">{whyRankVendor.whyThisRank.matchContribution} pts</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="font-medium text-slate-600">Client Shortlist Ratio (20%)</span>
                  <span className="font-bold text-slate-900">{whyRankVendor.whyThisRank.shortlistContribution} pts</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-50">
                  <span className="font-medium text-slate-600">Interview & Placement Conversion (20%)</span>
                  <span className="font-bold text-slate-900">{whyRankVendor.whyThisRank.conversionContribution} pts</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold">
                  <span>Composite Quality Score:</span>
                  <span className="text-sm">{whyRankVendor.compositeScore}% ({whyRankVendor.qualityRating})</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setWhyRankVendor(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL 2: VENDOR 360 & DETERMINISTIC COACHING (Phases 2L & 2M) */}
      {selectedVendorFor360 && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">{selectedVendorFor360.vendorName}</h3>
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-indigo-100 text-indigo-800">
                    {selectedVendorFor360.qualityRating} ({selectedVendorFor360.compositeScore ?? 0}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedVendorFor360.vendorCode || selectedVendorFor360.vendorId}</p>
              </div>
              <button
                onClick={() => setSelectedVendorFor360(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Performance Summary Banner */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Actionable Performance Summary</span>
              <p className="text-xs font-medium text-slate-800">{selectedVendorFor360.actionableSummary}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Submitted</span>
                <span className="font-bold text-slate-900 text-sm">{selectedVendorFor360.profilesSubmitted}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Pass Rate</span>
                <span className="font-bold text-emerald-700 text-sm">{selectedVendorFor360.passRate ?? "—"}%</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Shortlists</span>
                <span className="font-bold text-blue-700 text-sm">{selectedVendorFor360.shortlists}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Placements</span>
                <span className="font-bold text-indigo-700 text-sm">{selectedVendorFor360.placements}</span>
              </div>
            </div>

            {/* Top Rejection Bottlenecks */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">Primary Rejection Bottlenecks</span>
              {selectedVendorFor360.topRejectionReasons && selectedVendorFor360.topRejectionReasons.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedVendorFor360.topRejectionReasons.map((r: any, idx: number) => (
                    <div key={idx} className="flex justify-between p-2 bg-rose-50/60 border border-rose-200 rounded-lg text-xs">
                      <span className="font-semibold text-rose-950">{r.reason}</span>
                      <span className="font-black text-rose-800">{r.count} profiles</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-semibold p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  No major rejection bottlenecks recorded for this partner.
                </p>
              )}
            </div>

            {/* Deterministic Coaching / Feedback Memo Generator (Phase 2M) */}
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  Deterministic Partner Coaching Memo
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `${selectedVendorFor360.coachingFeedback.subject}\n\n${selectedVendorFor360.coachingFeedback.body}\n\nAction Items:\n${selectedVendorFor360.coachingFeedback.actionItems.map((a: string) => `- ${a}`).join("\n")}`
                    )
                  }
                  className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                >
                  {copiedCoaching ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCoaching ? "Copied" : "Copy Memo"}</span>
                </button>
              </div>

              <div className="bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-2">
                <p className="font-bold text-slate-900">{selectedVendorFor360.coachingFeedback.subject}</p>
                <p>{selectedVendorFor360.coachingFeedback.body}</p>
                <div className="space-y-1 pt-1">
                  <span className="font-bold text-slate-800 text-[11px] uppercase">Recommended Action Items:</span>
                  {selectedVendorFor360.coachingFeedback.actionItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSendCoaching(selectedVendorFor360)}
                disabled={sendingCoaching}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingCoaching ? "Recording..." : "Dispatch Coaching Guidance to Ledger"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CANDIDATE DRILL-DOWN MODAL (Phase 2S) */}
      {drillDownModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900">{drillDownTitle}</h3>
                <p className="text-xs text-slate-500">
                  {drillDownCandidates.length} candidate profiles matching screening criteria
                </p>
              </div>
              <button
                onClick={() => setDrillDownModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {drillDownLoading ? (
                <div className="py-12 text-center text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading candidate records...
                </div>
              ) : drillDownCandidates.length > 0 ? (
                <div className="space-y-3">
                  {drillDownCandidates.map((c: any) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                                c.decision === "PASS"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : c.decision === "REVIEW"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {c.decision}
                            </span>
                            {c.score !== null && (
                              <span className="text-xs font-bold text-slate-700">({c.score}% Match)</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.jobTitle || "Requirement"} • Partner: {c.vendorName || c.vendorId || "Direct"}
                          </p>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          {c.totalExperienceFormatted ? `Total Exp: ${c.totalExperienceFormatted}` : ""}
                          {c.relevantExperienceFormatted ? ` | Rel: ${c.relevantExperienceFormatted}` : ""}
                        </div>
                      </div>

                      {c.primaryReason && (
                        <div className="text-xs p-2 bg-white rounded border border-slate-200 text-slate-700">
                          <span className="font-bold text-slate-900">Diagnostic Reason: </span>
                          {c.primaryReason}
                        </div>
                      )}

                      {c.rejectionReasons && c.rejectionReasons.length > 1 && (
                        <div className="text-[11px] text-rose-800 space-y-0.5 pl-2 border-l-2 border-rose-300">
                          {c.rejectionReasons.map((r: string, idx: number) => (
                            <p key={idx}>• {r}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 font-medium text-xs">
                  No candidate records found matching this diagnostic filter.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDrillDownModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
