import React from 'react';
import { Activity, Zap, ShieldCheck, HeartPulse, BrainCircuit, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DigitalTwinData {
  entityType: 'Candidate' | 'Requirement' | 'Vendor' | 'Client' | 'Company' | 'Placement';
  entityId: string;
  entityName: string;
  healthScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  risks: string[];
  opportunities: string[];
  predictions: { label: string; value: string; color: string }[];
  recommendedActions: { title: string; actionText: string; confidence: number }[];
}

interface DigitalTwinPanelProps {
  data: DigitalTwinData;
  onExecuteAction: (actionTitle: string) => void;
}

export function DigitalTwinPanel({ data, onExecuteAction }: DigitalTwinPanelProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 p-6 rounded-2xl shadow-xl border border-indigo-500/20 text-white relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <BrainCircuit className="w-64 h-64" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Activity className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                {data.entityType} Digital Twin: {data.entityName}
                <span className={cn(
                  "text-[10px] uppercase px-2.5 py-1 rounded-full font-bold tracking-widest border",
                  data.healthScore >= 70 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                  data.healthScore >= 40 ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                  "bg-rose-500/20 text-rose-300 border-rose-500/30"
                )}>
                  {data.healthScore}% Health
                </span>
              </h3>
              <p className="text-indigo-200/80 text-sm font-medium mt-1">
                Universal Twin Framework • <span className="font-mono text-xs opacity-75">{data.entityId}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary & Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Executive AI Summary
            </h4>
            <p className="text-sm font-medium text-white/90 leading-relaxed">
              {data.summary}
            </p>
            
            {/* Predictions */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.predictions.map((pred, i) => (
                <div key={i} className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">{pred.label}</p>
                  <p className={cn("text-lg font-black", pred.color)}>{pred.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             {/* Risks */}
             <div className="bg-rose-950/30 backdrop-blur-sm border border-rose-500/20 p-4 rounded-xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-3">
                  Identified Risks
                </h4>
                <ul className="space-y-2">
                  {data.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-rose-100 font-medium leading-tight">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                      {risk}
                    </li>
                  ))}
                </ul>
             </div>
             {/* Opportunities */}
             {data.opportunities.length > 0 && (
               <div className="bg-emerald-950/30 backdrop-blur-sm border border-emerald-500/20 p-4 rounded-xl">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-3">
                    Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {data.opportunities.map((opp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-100 font-medium leading-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        {opp}
                      </li>
                    ))}
                  </ul>
               </div>
             )}
          </div>
        </div>

        {/* Decision Engine Recommendations */}
        <div>
           <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4 flex items-center gap-2">
             <ShieldCheck className="w-4 h-4" /> Decision Engine Recommendations
           </h4>
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
             {data.recommendedActions.map((action, i) => (
               <div key={i} className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 p-5 rounded-xl flex flex-col justify-between h-full group">
                 <div>
                    <div className="flex justify-between items-start mb-2">
                       <h5 className="font-bold text-white text-sm">{action.title}</h5>
                       <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-900/50 px-2 py-0.5 rounded border border-indigo-500/30">
                         {action.confidence}% CONF
                       </span>
                    </div>
                 </div>
                 <button 
                   onClick={() => onExecuteAction(action.title)}
                   className="mt-4 w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-indigo-500/20 group-hover:-translate-y-0.5"
                 >
                   <Zap className="w-3.5 h-3.5" /> {action.actionText}
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
