import React, { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Job, Deal, Candidate } from "../types";
import { Briefcase, Users, Calendar, CheckCircle, Clock, DollarSign } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function ClientPortal() {
  const { jobs, deals, candidates, refreshAll } = useData();
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "requirements">("dashboard");
  const [selectedRequirement, setSelectedRequirement] = useState<Job | null>(null);
  
  // Simulated Client Login Context
  // In reality, derived from useAuth()
  const clientId = jobs[0]?.clientId || "client-1";

  const clientRequirements = jobs.filter(r => r.clientId === clientId);
  const clientRequirementIds = clientRequirements.map(r => r.id);
  const clientDeals = deals.filter(d => clientRequirementIds.includes(d.jobId));
  
  const activeSubmissions = clientDeals.filter(d => ["submitted", "sourcing", "prospect"].includes(d.status));
  const upcomingInterviews = clientDeals.filter(d => d.status === "interview");
  const pendingOffers = clientDeals.filter(d => d.status === "offered");

  const handleAction = async (dealId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      toast.success(`Candidate marked as ${newStatus}`);
      refreshAll();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full absolute top-0 left-0 z-[100]">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="font-black text-xl text-slate-900 tracking-tight">HireNest OS <span className="font-medium text-slate-400">| Client Workspace</span></h1>
        </div>
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => { setActiveTab("dashboard"); setSelectedRequirement(null); }}
            className={cn("text-sm font-bold transition-colors", activeTab === "dashboard" && !selectedRequirement ? "text-indigo-600" : "text-slate-500 hover:text-slate-900")}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("requirements")}
            className={cn("text-sm font-bold transition-colors", activeTab === "requirements" || selectedRequirement ? "text-indigo-600" : "text-slate-500 hover:text-slate-900")}
          >
            Requirements
          </button>
          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
            CL
          </div>
        </nav>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {activeTab === "dashboard" && !selectedRequirement && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={<Briefcase />} title="Open Requirements" value={clientRequirements.length} />
              <StatCard icon={<Users />} title="Active Submissions" value={activeSubmissions.length} />
              <StatCard icon={<Calendar />} title="Upcoming Interviews" value={upcomingInterviews.length} />
              <StatCard icon={<CheckCircle />} title="Offers Pending" value={pendingOffers.length} />
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-black text-slate-900 text-lg mb-4">Recent Submissions</h2>
              <div className="space-y-4">
                {clientDeals.slice(0, 5).map(deal => {
                  return (
                    <div key={deal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900">{deal.candidateName || "Unknown Candidate"}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">Submitted for <span className="text-indigo-600">{deal.jobTitle}</span></p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md",
                        deal.status === "interview" ? "bg-amber-100 text-amber-700" :
                        deal.status === "offered" ? "bg-emerald-100 text-emerald-700" :
                        "bg-indigo-50 text-indigo-700"
                      )}>
                        {deal.status}
                      </span>
                    </div>
                  );
                })}
                {clientDeals.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No submissions yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeTab === "requirements" || selectedRequirement) && (
          <div className="flex gap-6 h-[calc(100vh-10rem)]">
            <div className="w-1/3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shrink-0">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-black text-slate-900">Your Requirements</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {clientRequirements.map(req => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequirement(req)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-all border",
                      selectedRequirement?.id === req.id 
                        ? "bg-indigo-50 border-indigo-200" 
                        : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                    )}
                  >
                    <h4 className="font-bold text-slate-900">{req.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">{req.location} • {req.status}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
              {selectedRequirement ? (
                <>
                  <div className="p-6 border-b border-slate-100">
                    <h2 className="font-black text-2xl text-slate-900">{selectedRequirement.title}</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Candidates submitted for this role</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {deals.filter(d => d.jobId === selectedRequirement.id).map(deal => {
                      const candidate = candidates.find(c => c.id === deal.candidateId);
                      return (
                        <div key={deal.id} className="border border-slate-200 rounded-xl p-5 flex items-start justify-between bg-slate-50 transition-all hover:border-slate-300 shadow-sm hover:shadow">
                          <div>
                            <h3 className="font-black text-lg text-slate-900">{deal.candidateName}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 font-medium">
                              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/> Status: <span className="capitalize text-slate-800">{deal.status}</span></span>
                              {candidate?.expectedCtc && (
                                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400"/> {candidate.expectedCtc}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {["submitted", "sourcing", "prospect"].includes(deal.status) && (
                              <>
                                <button onClick={() => handleAction(deal.id, "interview")} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                                  Move to Interview
                                </button>
                                <button onClick={() => handleAction(deal.id, "rejected")} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                                  Reject
                                </button>
                              </>
                            )}
                            {deal.status === "interview" && (
                              <button onClick={() => handleAction(deal.id, "offered")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                                Make Offer
                              </button>
                            )}
                            {deal.status === "offered" && (
                              <button onClick={() => handleAction(deal.id, "placed")} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                                Candidate Accepted
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {deals.filter(d => d.jobId === selectedRequirement.id).length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No candidates submitted yet.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3">
                  <Briefcase className="w-12 h-12 opacity-20" />
                  <p className="font-medium text-sm">Select a requirement to view candidates.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: number }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors cursor-default">
      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        {React.cloneElement(icon as any, { className: "w-6 h-6" })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
      </div>
    </div>
  );
}
