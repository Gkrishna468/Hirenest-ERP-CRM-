import React, { useState } from "react";
import { 
  Activity, Play, Pause, Zap, CheckCircle2, XCircle, Clock, Search, 
  Workflow, GitBranch, ListTodo, BrainCircuit, Globe, Server, Code2 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function AIControlCenter() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'queue' | 'policies'>('workflows');
  
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Server className="w-8 h-8 text-indigo-600" />
            AI Control Center
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage workflows, inspect queues, and enforce platform governance policies.
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'workflows', label: 'Workflows & Orchestration', icon: Workflow },
          { id: 'queue', label: 'Task Queue (Live)', icon: ListTodo },
          { id: 'policies', label: 'Platform Policies', icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all",
              activeTab === tab.id 
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Requirement Ingestion", trigger: "REQUIREMENT_CREATED", status: "active", executions: 120 },
              { name: "Vendor Broadcast", trigger: "MATCH_APPROVED", status: "active", executions: 340 },
              { name: "Interview Follow-up", trigger: "INTERVIEW_SCHEDULED", status: "paused", executions: 45 }
            ].map((wf, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2 py-1 rounded-md",
                    wf.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {wf.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900">{wf.name}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">ON: {wf.trigger}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-600">
                  <span>{wf.executions} Executions</span>
                  <button className="text-indigo-600 hover:text-indigo-700">Edit Flow &rarr;</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-black text-slate-500">
              <tr>
                <th className="px-6 py-4">Task ID</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Assigned Agent</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "tsk-001", action: "Parse CV & Score", agent: "RecruiterAgent", status: "processing" },
                { id: "tsk-002", action: "Draft Outreach Email", agent: "CommunicationAgent", status: "queued" },
                { id: "tsk-003", action: "Update Vendor Rank", agent: "VendorAgent", status: "completed" },
              ].map((task, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 font-mono text-xs">{task.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{task.action}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium text-slate-600">
                      <BrainCircuit className="w-3.5 h-3.5" /> {task.agent}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "flex items-center gap-1.5 text-xs font-bold uppercase",
                      task.status === 'processing' ? 'text-indigo-600' : 
                      task.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'
                    )}>
                      {task.status === 'processing' && <Activity className="w-3.5 h-3.5 animate-pulse" />}
                      {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {task.status === 'queued' && <Clock className="w-3.5 h-3.5" />}
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4">Governance Policies</h3>
          <p className="text-sm text-slate-600 mb-6">Manage global policies for AI behavior and data access.</p>
          <div className="space-y-4">
            {[
              { name: "Require human approval for emails", enabled: true },
              { name: "Allow AI to modify candidate status", enabled: false },
              { name: "Strict PII masking in logs", enabled: true },
            ].map((policy, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-slate-800">{policy.name}</span>
                <div className={cn(
                  "w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors",
                  policy.enabled ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                )}>
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
