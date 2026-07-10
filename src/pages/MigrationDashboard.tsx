import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { migrationService } from '@/services/firebase/migrationService';
import { 
  Activity, Database, CheckCircle2, AlertTriangle, RefreshCw, 
  ShieldCheck, Zap, ShieldAlert, Server, Play, Terminal, 
  ArrowRight, Check, AlertCircle, HelpCircle, Shield, Cpu, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Metric {
  id: string;
  timestamp: string;
  collectionName: string;
  supabaseCount: number;
  firebaseCount: number;
  parity: number;
  fieldParity: number;
  relationshipParity: number;
  eventParity: number;
  status: string;
}

interface ValidationCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

export default function MigrationDashboard() {
  const { user, apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<'validation' | 'parity'>('validation');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [validationChecks, setValidationChecks] = useState<ValidationCheck[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingChecks, setLoadingChecks] = useState(true);

  // Workflow test states
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    success: boolean;
    steps: string[];
    mutations: Record<string, string[]>;
    event?: any;
    timeline?: any[];
  } | null>(null);

  useEffect(() => {
    fetchMetrics();
    fetchValidationChecks();
  }, []);

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const recentMetrics = await (await apiFetch("/api/system/migration_metrics")).json();
      setMetrics(recentMetrics);
    } catch (error) {
      console.error('Failed to fetch migration metrics', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchValidationChecks = async () => {
    setLoadingChecks(true);
    try {
      const res = await apiFetch("/api/system/validation_checks");
      const data = await res.json();
      if (data.checks) {
        setValidationChecks(data.checks);
      }
    } catch (error) {
      console.error('Failed to fetch validation checks', error);
      toast.error("Failed to load validation checks from SSOT gateway.");
    } finally {
      setLoadingChecks(false);
    }
  };

  const runValidationTest = async (testId: string) => {
    setRunningTest(testId);
    setTestResults(null);
    try {
      const res = await apiFetch("/api/system/run_validation_test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId })
      });
      const data = await res.json();
      if (data.success) {
        setTestResults(data);
        toast.success(`Validation test "${testId}" successfully completed!`);
        // Refresh validation checks to show newly mutated metrics
        fetchValidationChecks();
      } else {
        toast.error(data.error || "Validation test failed.");
      }
    } catch (error) {
      console.error("Test execution failed", error);
      toast.error("Network or execution timeout during test run.");
    } finally {
      setRunningTest(null);
    }
  };

  const cutoverStatus = useMemo(() => {
    if (metrics?.length === 0) return 'NOT READY';
    const recentFailures = metrics.slice(0, 6).some(m => m.status === 'FAIL' || m.fieldParity < 100 || m.relationshipParity < 100 || (m.eventParity ?? 100) < 100);
    if (recentFailures) return 'NOT READY';
    return 'READY FOR PHASE 5';
  }, [metrics]);

  const migrationConfidence = useMemo(() => {
    if (metrics?.length === 0) return 0;
    const avgScore = metrics.reduce((acc, m) => acc + (m.parity + m.fieldParity + m.relationshipParity + (m.eventParity ?? 100)) / 4, 0) / metrics?.length;
    return avgScore.toFixed(2);
  }, [metrics]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-500">
        <AlertTriangle className="w-12 h-12 mb-4 text-orange-400" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p>This view is restricted to Founder/Admin roles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md tracking-wider uppercase">
              Release Candidate 1 (RC-1)
            </span>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
              Secure Admin Console
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1" style={{textShadow: "0 1px 0 white"}}>
            Platform Governance & Audit
          </h1>
          <p className="text-slate-500 text-sm">
            Continuous auditing, dual-read parity analytics, and live staffing pipeline testing.
          </p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex items-center bg-slate-200/60 p-1 rounded-xl border border-slate-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'validation'
                ? 'skeuo-btn-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            RC-1 Verification Grid
          </button>
          <button
            onClick={() => setActiveTab('parity')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === 'parity'
                ? 'skeuo-btn-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Database Parity Reports
          </button>
        </div>
      </div>

      {activeTab === 'validation' ? (
        <div className="space-y-8">
          {/* TOP EXPLAINER SECTION */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Shield className="w-64 h-64" />
            </div>
            <div className="max-w-3xl relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-black tracking-widest uppercase text-indigo-200">
                  Platform Readiness Quality Gates
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Live Enterprise-Wide Verification
              </h2>
              <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
                As part of HireNest’s architectural freeze, both the **CRM (Execution Layer)** and **HireNest OS (Intelligence Layer)** must operate concurrently on the single, shared Firestore database (default) as their absolute Single Source of Truth (SSOT). This panel audits structural, operational, and messaging queues in real time.
              </p>
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={fetchValidationChecks}
                  disabled={loadingChecks}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingChecks ? 'animate-spin' : ''}`} />
                  Re-Scan Quality Gates
                </button>
                <div className="flex items-center gap-1.5 text-xs text-indigo-200 font-bold bg-indigo-950/40 px-3 py-2 rounded-xl border border-indigo-800/40">
                  <Clock className="w-3.5 h-3.5" />
                  Last scan: {loadingChecks ? "Reading..." : new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* CHECKLISTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loadingChecks ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse space-y-3">
                  <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                  <div className="h-8 w-1/4 bg-slate-200 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                </div>
              ))
            ) : (
              validationChecks.map((check, index) => {
                const isPass = check.status === 'PASS';
                const isWarn = check.status === 'WARN';
                return (
                  <div 
                    key={index} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {check.name}
                        </h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider ${
                          isPass 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : isWarn 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {check.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {check.details}
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Verified: SSOT (default)</span>
                      <div className="flex items-center gap-1">
                        {isPass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : isWarn ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>{isPass ? "Active" : isWarn ? "Reviewing" : "Offline"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* WORKFLOW SIMULATION LAB */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
              <div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  RC-1 Progressive Workflow Laboratory
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Execute server-side, end-to-end recruitment tests writing real, synchronized transactions to Firestore.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 self-start sm:self-center">
                Interactive Validation Engine
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Test Cases List */}
              <div className="lg:col-span-5 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Select Workflow Test Scenario
                </h4>
                
                {[
                  { id: "test-1", label: "Vendor Onboarding & Sync", desc: "Verifies Vendor creation instantly populates Vendors SSOT and fires custom claim triggers." },
                  { id: "test-2", label: "Client Onboarding & Portfolio Sync", desc: "Creates Client account in CRM and links workspace workspace portfolios." },
                  { id: "test-3", label: "Demand Intake & Broadcast", desc: "Posts open Requirement, executes AI matcher logic, and launches broadcasts." },
                  { id: "test-4", label: "Supply Sourcing & Talent Matching", desc: "Ingests candidate profile, triggers resume parser module, matches scores against jobs." },
                  { id: "test-5", label: "Talent Submission & Timeline Audit", desc: "Submits candidate, updates submission boards, records chronologically in events ledger." },
                  { id: "test-6", label: "Progressive Staff-to-Hire Lifecycle", desc: "The Ultimate Quality Gate: executes the entire hiring pipeline in a single transaction loop." }
                ].map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => runValidationTest(tc.id)}
                    disabled={runningTest !== null}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      runningTest === tc.id 
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/10' 
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 ${runningTest === tc.id ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-black text-indigo-600 block mb-0.5">Scenario {tc.id.toUpperCase()}</span>
                      <p className="font-bold text-slate-800 text-sm truncate">{tc.label}</p>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{tc.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                  </button>
                ))}
              </div>

              {/* Execution Output Console */}
              <div className="lg:col-span-7 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    WORKFLOW_EXECUTION_CONSOLE
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>ACTIVE</span>
                  </div>
                </div>

                <div className="flex-1 p-6 font-mono text-xs text-slate-300 overflow-y-auto space-y-4">
                  {runningTest ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 space-y-3">
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="font-bold text-slate-300">Executing server-side workflow transaction loops...</p>
                      <p className="text-[10px] text-slate-500">Scanning relationships & publishing to system_events ledger</p>
                    </div>
                  ) : testResults ? (
                    <div className="space-y-6">
                      {/* Steps Sequence */}
                      <div className="space-y-2">
                        <p className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                          ✓ Execution Pipeline Milestones:
                        </p>
                        {testResults.steps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-emerald-500 font-bold shrink-0">[{i+1}]</span>
                            <p className="text-slate-200">{step}</p>
                          </div>
                        ))}
                      </div>

                      {/* Mutations */}
                      <div className="space-y-2">
                        <p className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">
                          ✓ Firestore SSOT Mutations Written:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-slate-400 space-y-2">
                          {Object.entries(testResults.mutations).map(([collection, docs]) => (
                            <div key={collection} className="flex items-start gap-2">
                              <span className="text-indigo-400 font-black">/{collection}:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {docs.map(docId => (
                                  <span key={docId} className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                    {docId}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Event Payload */}
                      {testResults.event && (
                        <div className="space-y-2">
                          <p className="text-pink-400 font-bold uppercase tracking-wider text-[10px]">
                            ✓ Company Ledger Event Emitted:
                          </p>
                          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[10px] text-slate-300 overflow-x-auto max-h-[160px] whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(testResults.event, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-500 space-y-2 text-center max-w-sm mx-auto">
                      <HelpCircle className="w-12 h-12 text-slate-700" />
                      <p className="font-bold text-slate-400 text-sm">Console Ready</p>
                      <p className="text-[10px] leading-relaxed">
                        Select an end-to-end staffed progressive scenario on the left panel to execute and verify live transaction workflows.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Indicators Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cutover Status Indicator */}
            <div className={`p-6 rounded-3xl border flex items-center justify-between ${cutoverStatus === 'READY FOR PHASE 5' ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-full ${cutoverStatus === 'READY FOR PHASE 5' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                   {cutoverStatus === 'READY FOR PHASE 5' ? <ShieldCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                 </div>
                 <div>
                   <p className={`text-sm font-bold uppercase tracking-widest ${cutoverStatus === 'READY FOR PHASE 5' ? 'text-emerald-600' : 'text-orange-600'}`}>System Cutover Status</p>
                   <h2 className={`text-2xl font-black ${cutoverStatus === 'READY FOR PHASE 5' ? 'text-emerald-900' : 'text-orange-900'}`}>{cutoverStatus}</h2>
                 </div>
              </div>
              {cutoverStatus === 'READY FOR PHASE 5' && (
                <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Authorize Phase 5
                </button>
              )}
            </div>

            {/* Migration Confidence */}
            <div className="p-6 rounded-3xl border bg-slate-900 border-slate-800 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                 <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400">
                   <ShieldAlert className="w-8 h-8" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Migration Confidence</p>
                   <h2 className="text-3xl font-black text-white">{migrationConfidence}%</h2>
                 </div>
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Parity Reports
              </h3>
              <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 uppercase tracking-widest">
                <Activity className="w-3 h-3" />
                Phase 4: Dual Read
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50 font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Collection</th>
                    <th className="px-6 py-4 text-center">Supabase Count</th>
                    <th className="px-6 py-4 text-center">Firebase Count</th>
                    <th className="px-6 py-4 text-center">Record Parity</th>
                    <th className="px-6 py-4 text-center">Field Parity</th>
                    <th className="px-6 py-4 text-center">Rel. Parity</th>
                    <th className="px-6 py-4 text-center">Event Parity</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                        No parity checks recorded yet. They run automatically on data load.
                      </td>
                    </tr>
                  ) : (
                    metrics.map(metric => (
                      <tr key={metric.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs">{new Date(metric.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900 capitalize">{metric.collectionName}</td>
                        <td className="px-6 py-4 text-center font-mono">{metric.supabaseCount}</td>
                        <td className="px-6 py-4 text-center font-mono">{metric.firebaseCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded font-bold text-xs ${metric.parity === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {metric.parity}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded font-bold text-xs ${metric.fieldParity === 100 ? 'bg-emerald-100 text-emerald-700' : (metric.fieldParity >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
                            {metric.fieldParity ?? 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded font-bold text-xs ${metric.relationshipParity === 100 ? 'bg-emerald-100 text-emerald-700' : (metric.relationshipParity >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
                            {metric.relationshipParity ?? 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded font-bold text-xs ${(metric.eventParity ?? 100) === 100 ? 'bg-emerald-100 text-emerald-700' : ((metric.eventParity ?? 100) >= 90 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}`}>
                            {metric.eventParity ?? 100}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {metric.status === 'PASS' && metric.fieldParity === 100 && metric.relationshipParity === 100 && (metric.eventParity ?? 100) === 100 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase tracking-widest">
                              <CheckCircle2 className="w-4 h-4" /> PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-orange-600 font-bold text-xs uppercase tracking-widest">
                              <AlertTriangle className="w-4 h-4" /> FAIL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
