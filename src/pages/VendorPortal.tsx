import React, { useState } from "react";
import { useData } from "../contexts/DataContext";
import { Job, Candidate, Deal } from "../types";
import { 
  Briefcase, Users, Calendar, CheckCircle, Clock, 
  DollarSign, BarChart2, FileText, Upload, RefreshCw, Archive 
} from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function VendorPortal() {
  const { jobs, deals, candidates, refreshAll, addCandidate } = useData();
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "bench" | "requirements" | "feedback">("dashboard");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // Simulated Vendor Context (would be derived from AuthContext in reality)
  const { user } = useAuth();
  const { vendors } = useData();
  const currentVendor = vendors.find(v => v.userId === user?.id) || vendors[0];
  const vendorId = currentVendor?.id || "vendor-1"; 

  // Derived Data
  const vendorCandidates = candidates.filter(c => c.vendorId === vendorId);
  const candidateIds = vendorCandidates.map(c => c.id);
  const vendorDeals = deals.filter(d => candidateIds.includes(d.candidateId));
  
  // Requirement Marketplace (Jobs that are open)
  const openRequirements = jobs.filter(j => j.status === "open");

  
  const handleAddCandidate = async () => {
    const name = prompt("Enter candidate name:");
    if (!name) return;
    const skills = prompt("Enter skills (comma separated):");
    const exp = prompt("Enter years of experience:");
    
    await addCandidate({
      name,
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      experience: exp ? parseInt(exp, 10) : 0,
      vendorId: vendorId,
      vendorName: currentVendor?.name || "Vendor",
      source: "vendor",
      stage: "new"
    });
    toast.success("Candidate added successfully!");
  };

  const handleValidateBench = async (candidateId: string) => {
    try {
      await apiFetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: 'available',
          // In real implementation we'd update lastActivityAt
        })
      });
      toast.success("Bench candidate validated successfully");
      refreshAll();
    } catch (error) {
      toast.error("Failed to validate candidate");
    }
  };

  const handleSubmitCandidate = async (jobId: string, candidateId: string) => {
    try {
      await apiFetch(`/api/deals`, {
        method: 'POST',
        body: JSON.stringify({
          jobId,
          candidateId,
          status: 'submitted',
          vendorId
        })
      });
      toast.success("Candidate submitted successfully!");
      refreshAll();
    } catch (error) {
      toast.error("Failed to submit candidate");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans w-full absolute top-0 left-0 z-[100]">
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-900 p-2 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <h1 className="font-black text-xl text-white tracking-tight">HireNest OS <span className="font-medium text-slate-400">| Delivery Partner</span></h1>
        </div>
        <nav className="flex items-center gap-6">
          <NavButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")}>Dashboard</NavButton>
          <NavButton active={activeTab === "bench"} onClick={() => setActiveTab("bench")}>Talent Inventory</NavButton>
          <NavButton active={activeTab === "requirements"} onClick={() => setActiveTab("requirements")}>Marketplace</NavButton>
          <NavButton active={activeTab === "feedback"} onClick={() => setActiveTab("feedback")}>Feedback Center</NavButton>
          
          <div className="h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">
            VN
          </div>
        </nav>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={<Users />} title="Available Bench" value={vendorCandidates.length} />
              <StatCard icon={<Briefcase />} title="Open Requirements" value={openRequirements.length} />
              <StatCard icon={<CheckCircle />} title="Active Submissions" value={vendorDeals.length} />
              <StatCard icon={<BarChart2 />} title="Performance Score" value={"94%"} />
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-black text-slate-900 text-lg mb-4">Recent Feedback</h2>
              <div className="space-y-4">
                {vendorDeals.slice(0, 5).map(deal => {
                  return (
                    <div key={deal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900">{deal.candidateName}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">For <span className="text-indigo-600">{deal.jobTitle}</span></p>
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
              </div>
            </div>
          </div>
        )}

        {activeTab === "bench" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="font-black text-xl text-slate-900">Talent Inventory</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your available bench candidates.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors">
                  <Upload className="w-4 h-4" /> Bulk Upload
                </button>
                <button onClick={handleAddCandidate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                  <Users className="w-4 h-4" /> Add Candidate
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {vendorCandidates.map(candidate => (
                <div key={candidate.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">{candidate.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5"/> {candidate.experience}y</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5"/> {candidate.expectedSalary || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-md border border-emerald-100">
                      Available
                    </span>
                    <button 
                      onClick={() => handleValidateBench(candidate.id)}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-white border border-slate-200 rounded-lg shadow-sm"
                      title="Validate Availability"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors bg-white border border-slate-200 rounded-lg shadow-sm" title="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {vendorCandidates.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No candidates in your inventory.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "requirements" && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openRequirements.map(req => (
                <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {req.type || 'Full Time'}
                    </span>
                  </div>
                  <h3 className="font-black text-xl text-slate-900 mb-2 leading-tight">{req.title}</h3>
                  <div className="space-y-2 mb-6 text-sm text-slate-600 font-medium">
                    <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400"/> {req.experienceMin || 0}-{req.experienceMax || 0} years</p>
                    <p className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400"/> {req.salaryMin || 0}-{req.salaryMax || 0} {req.salaryType || 'LPA'}</p>
                  </div>
                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-400">
                      Match: <span className="text-emerald-600">85%</span>
                    </div>
                    <button 
                      onClick={() => {
                        // Very simple submit simulation for the prototype
                        const availableCandidate = vendorCandidates[0];
                        if (availableCandidate) {
                          handleSubmitCandidate(req.id, availableCandidate.id);
                        } else {
                          toast.error("No candidates available to submit");
                        }
                      }}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      Submit Profiles
                    </button>
                  </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === "feedback" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
             <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="font-black text-xl text-slate-900">Feedback Center</h2>
              <p className="text-sm text-slate-500 mt-1">Track the status of all your submissions.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Candidate</th>
                    <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Requirement</th>
                    <th className="py-3 px-4 text-xs font-black text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorDeals.map(deal => (
                    <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900">{deal.candidateName}</td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600">{deal.jobTitle}</td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md",
                          deal.status === "interview" ? "bg-amber-100 text-amber-700" :
                          deal.status === "offered" ? "bg-emerald-100 text-emerald-700" :
                          "bg-indigo-50 text-indigo-700"
                        )}>
                          {deal.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {vendorDeals.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400">
                        <p className="font-medium">No submissions to track.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavButton({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-sm font-bold transition-colors", 
        active ? "text-amber-500" : "text-slate-400 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: number | string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-default">
      <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{title}</p>
        <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
      </div>
    </div>
  );
}
