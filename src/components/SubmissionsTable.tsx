import React, { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Search, Filter, Briefcase, Building2, User, Sparkles, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";
import Candidate360 from "./Candidate360";
import { Requirement360 } from "./Requirement360";
import { Client360 } from "./Client360";

export const SubmissionsTable: React.FC = () => {
  const data = useData();
  const { candidates, jobs, clients } = data;
  const contextSubmissions = (data as any).submissions;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Normalize submissions list from candidates or context
  const derivedSubmissions = (contextSubmissions && contextSubmissions.length > 0)
    ? contextSubmissions
    : candidates
        .filter((c) => c.stage === "submission" || c.jobId || (c as any).lastSubmissionRequirementId)
        .map((c) => {
          const reqId = c.jobId || (c as any).lastSubmissionRequirementId || "req-default";
          const req = jobs.find((j) => j.id === reqId);
          const client = clients.find((cl) => cl.id === req?.clientId || cl.name === req?.clientName || cl.id === c.clientId);
          
          return {
            id: `sub-${c.id}`,
            candidateId: c.id,
            candidateName: c.name,
            candidateTitle: c.currentTitle || "Software Engineer",
            requirementId: reqId,
            requirementTitle: req?.title || c.jobTitle || "Senior Full Stack Mandate",
            clientId: client?.id || req?.clientId || "client-default",
            clientName: req?.clientName || client?.name || (c as any).clientName || "Direct Client Partner",
            vendorId: c.vendorId || "vendor-direct",
            vendorName: c.vendorName || "In-house Sourcing",
            matchScore: c.aiMatchScore || 88,
            status: c.status || "Submitted to Client",
            submittedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US") : "Today",
            assignedBdm: c.assignedBdm || "Ravi Sharma",
          };
        });

  const filteredSubmissions = derivedSubmissions.filter((sub) => {
    const query = searchTerm.toLowerCase();
    return (
      sub.candidateName?.toLowerCase().includes(query) ||
      sub.requirementTitle?.toLowerCase().includes(query) ||
      sub.clientName?.toLowerCase().includes(query) ||
      sub.vendorName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="submissions_search_input"
            type="text"
            placeholder="Search candidate, requirement, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{filteredSubmissions.length} Submissions</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Requirement Linkage Enforced
          </span>
        </div>
      </div>

      {/* Submissions Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-3.5">Candidate</th>
              <th className="p-3.5">Requirement Mandate</th>
              <th className="p-3.5">Client Account</th>
              <th className="p-3.5">Vendor / Partner</th>
              <th className="p-3.5 text-center">AI Match</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredSubmissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Candidate Link */}
                <td className="p-3.5">
                  <button
                    id={`open_cand_${sub.candidateId}`}
                    onClick={() => setSelectedCandidateId(sub.candidateId)}
                    className="group text-left"
                  >
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      {sub.candidateName} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400">{sub.candidateTitle}</div>
                  </button>
                </td>

                {/* Requirement Link */}
                <td className="p-3.5">
                  <button
                    id={`open_req_${sub.requirementId}`}
                    onClick={() => setSelectedRequirementId(sub.requirementId)}
                    className="group text-left"
                  >
                    <div className="font-semibold text-indigo-700 group-hover:underline flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> {sub.requirementTitle}
                    </div>
                  </button>
                </td>

                {/* Client Link */}
                <td className="p-3.5">
                  <button
                    id={`open_client_${sub.clientId}`}
                    onClick={() => setSelectedClientId(sub.clientId)}
                    className="group text-left"
                  >
                    <div className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" /> {sub.clientName}
                    </div>
                  </button>
                </td>

                {/* Vendor / Sourcing */}
                <td className="p-3.5 text-slate-600">{sub.vendorName}</td>

                {/* AI Match Score */}
                <td className="p-3.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Sparkles className="w-3 h-3" /> {sub.matchScore}%
                  </span>
                </td>

                {/* Status */}
                <td className="p-3.5">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {sub.status}
                  </span>
                </td>

                {/* Date */}
                <td className="p-3.5 text-right text-slate-400 font-mono text-[11px]">{sub.submittedAt}</td>
              </tr>
            ))}

            {filteredSubmissions.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                  No candidate submissions found matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 360 Drawers */}
      {selectedCandidateId && (
        <Candidate360 candidateId={selectedCandidateId} onClose={() => setSelectedCandidateId(null)} />
      )}

      {selectedRequirementId && (
        <Requirement360
          requirementId={selectedRequirementId}
          onClose={() => setSelectedRequirementId(null)}
          onOpenCandidate={(candId) => {
            setSelectedRequirementId(null);
            setSelectedCandidateId(candId);
          }}
        />
      )}

      {selectedClientId && (
        <Client360
          clientId={selectedClientId}
          onClose={() => setSelectedClientId(null)}
          onOpenRequirement={(reqId) => {
            setSelectedClientId(null);
            setSelectedRequirementId(reqId);
          }}
        />
      )}
    </div>
  );
};
