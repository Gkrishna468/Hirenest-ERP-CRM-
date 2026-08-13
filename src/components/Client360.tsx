import React from "react";
import { X, Building2, Briefcase, Users, DollarSign, MapPin, Globe, Phone, Mail, ShieldCheck } from "lucide-react";
import { useData } from "@/contexts/DataContext";

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
  const { clients, jobs, candidates } = useData();

  const client = clients.find((c) => c.id === clientId || c.name === clientId);
  const clientJobs = jobs.filter((j) => j.clientId === clientId || j.clientName === client?.name);

  if (!client && !clientId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Client Not Found</h3>
          <button onClick={onClose} className="w-full py-2 bg-slate-100 font-semibold rounded-lg text-xs">
            Close
          </button>
        </div>
      </div>
    );
  }

  const clientName = client?.name || clientId || "Partner Client";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div id="client_360_drawer" className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{clientName}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {client?.status || "Active Partner"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {client?.industry || "Enterprise IT & Technology Services"}
              </p>
            </div>
          </div>
          <button
            id="close_client_360_btn"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Open Requirements</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{clientJobs.length} Positions</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Commercial Terms</div>
              <div className="text-sm font-bold text-emerald-600 mt-0.5">{client?.commercialTerms || "8.33% / Net 45"}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Assigned BDM</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5">{client?.bdmOwner || "Ravi Sharma"}</div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Key Account Contacts</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {client?.contactEmail || `ta@${clientName.toLowerCase().replace(/\s+/g, "")}.com`}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> {client?.contactPhone || "+91 98765 00000"}
              </div>
            </div>
          </div>

          {/* Active Requirements */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Active Job Requirements ({clientJobs.length})
            </h4>
            <div className="space-y-2">
              {clientJobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => onOpenRequirement && onOpenRequirement(j.id)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-800">{j.title}</div>
                    <div className="text-xs text-slate-500">{j.location || "Onsite"} • Budget: {j.budget || "Market Rate"}</div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">View Mandate →</span>
                </div>
              ))}

              {clientJobs.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No open requirements currently recorded for this client account.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
