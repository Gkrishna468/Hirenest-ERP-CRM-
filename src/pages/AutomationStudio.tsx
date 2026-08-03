import React, { useState, useCallback, useMemo } from "react";
import { 
  GitBranch, Zap, Plus, Settings, Play, Pause, ChevronRight, CheckCircle2, 
  AlertTriangle, ListFilter, Bot, Split, Mail, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  BackgroundVariant, 
  Panel,
  Handle,
  Position,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Custom Nodes ---

const TriggerNode = React.memo(({ data }: any) => {
  return (
    <div className="bg-white border-2 border-emerald-500 rounded-2xl shadow-xl w-72 transition-all hover:shadow-2xl hover:border-emerald-400">
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
          <Zap className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Trigger Event</div>
          <h3 className="font-bold text-slate-900 text-sm">{data.label}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{data.description}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-white bg-emerald-500" />
    </div>
  );
});

const AgentNode = React.memo(({ data }: any) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border-2 border-indigo-500/50 rounded-2xl shadow-xl w-72 transition-all hover:shadow-2xl hover:border-indigo-400 text-white relative overflow-hidden group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-slate-900 bg-indigo-400" />
      <div className="p-4 flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">
          <Bot className="w-5 h-5 text-indigo-300" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">AI Agent Action</div>
          <h3 className="font-bold text-white text-sm">{data.label}</h3>
          <p className="text-xs text-indigo-200/70 mt-1 leading-relaxed">{data.description}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-slate-900 bg-indigo-400" />
    </div>
  );
});

const ConditionNode = React.memo(({ data }: any) => {
  return (
    <div className="bg-white border-2 border-amber-400 rounded-2xl shadow-xl w-72 transition-all hover:shadow-2xl hover:border-amber-300">
      <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-white bg-amber-400" />
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
          <Split className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Decision Logic</div>
          <h3 className="font-bold text-slate-900 text-sm">{data.label}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{data.description}</p>
        </div>
      </div>
      <div className="flex justify-between px-4 pb-2 text-[10px] font-black uppercase text-slate-400">
        <span>False</span>
        <span>True</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="false" className="w-4 h-4 border-2 border-white bg-rose-400" style={{ left: '20%' }} />
      <Handle type="source" position={Position.Bottom} id="true" className="w-4 h-4 border-2 border-white bg-emerald-400" style={{ left: '80%' }} />
    </div>
  );
});

const ActionNode = React.memo(({ data }: any) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm w-72 transition-all hover:shadow-md hover:border-slate-300">
      <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-white bg-slate-400" />
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
          {data.icon === 'mail' ? <Mail className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-600" />}
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">System Action</div>
          <h3 className="font-bold text-slate-900 text-sm">{data.label}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{data.description}</p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-white bg-slate-400" />
    </div>
  );
});

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  condition: ConditionNode,
  action: ActionNode,
};

// --- Initial Data ---

const initialNodes = [
  { id: '1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'New Lead Discovered', description: 'Triggered when a lead matches the ideal client profile (ICP) signal.' } },
  { id: '2', type: 'agent', position: { x: 300, y: 220 }, data: { label: 'AI Sales Agent (Research)', description: 'Crawls LinkedIn and company website to extract deep personalized context.' } },
  { id: '3', type: 'condition', position: { x: 300, y: 400 }, data: { label: 'ICP Match Score > 80?', description: 'Evaluates if the extracted data indicates a high propensity to buy.' } },
  { id: '4', type: 'action', position: { x: 50, y: 600 }, data: { label: 'Discard Lead', icon: 'chevron', description: 'Update CRM status to unqualified and halt.' } },
  { id: '5', type: 'agent', position: { x: 550, y: 600 }, data: { label: 'AI Email Architect', description: 'Drafts highly personalized outbound sequence using Claude 3.5 Sonnet.' } },
  { id: '6', type: 'action', position: { x: 550, y: 780 }, data: { label: 'Send MailOS Sequence', icon: 'mail', description: 'Dispatch via connected MailOS inbox and monitor replies.' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', sourceHandle: 'false', target: '4', animated: true, style: { stroke: '#fb7185', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fb7185' } },
  { id: 'e3-5', source: '3', sourceHandle: 'true', target: '5', animated: true, style: { stroke: '#34d399', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#34d399' } },
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' } },
];

export default function AutomationStudio() {
  const [activeWorkflow, setActiveWorkflow] = useState<string>("wf-sdr-1");
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const workflows = [
    { id: "wf-sdr-1", name: "AI Outbound SDR ", trigger: "Lead Sourced", status: "active" },
    { id: "wf-req-1", name: "Requirement Auto-Match", trigger: "RequirementCreated", status: "active" },
    { id: "wf-cand-1", name: "Candidate SLA Escalation", trigger: "CandidateSubmitted", status: "active" },
  ];

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } }, eds)),
    []
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-indigo-600" />
            Automation Studio
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Visual AI Agent workflow builder, powering intelligent outreach and operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-colors">
            <Play className="w-4 h-4 text-emerald-600" /> Test Run
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-colors">
            <CheckCircle2 className="w-4 h-4" /> Publish Workflow
          </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-[600px] overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm shrink-0">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><ListFilter className="w-4 h-4 text-indigo-500"/> Workflows</h3>
            <button className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 overflow-y-auto space-y-2 flex-1">
            {workflows.map(wf => (
              <button
                key={wf.id}
                onClick={() => setActiveWorkflow(wf.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden",
                  activeWorkflow === wf.id
                    ? "bg-indigo-50 border-indigo-200 shadow-[inset_0_1px_1px_rgba(255,255,255,1)]"
                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {activeWorkflow === wf.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h4 className={cn("font-bold text-sm pr-6", activeWorkflow === wf.id ? "text-indigo-900" : "text-slate-700")}>
                    {wf.name}
                  </h4>
                  <span className={cn(
                    "absolute right-4 top-4 w-2 h-2 rounded-full",
                    wf.status === 'active' ? "bg-emerald-400" : "bg-amber-400"
                  )} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> {wf.trigger}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Builder (React Flow) */}
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden shadow-inner">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-slate-50"
            minZoom={0.2}
            maxZoom={2}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#cbd5e1" />
            <Controls className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden" />
            <Panel position="top-center" className="bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-slate-200 shadow-sm mt-4 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-700">Drag to pan, scroll to zoom. Drag nodes to reposition.</span>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
