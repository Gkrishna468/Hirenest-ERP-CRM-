/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Unified Architecture Navigation
 * Connects HireNest OS (Operations), HireNest CRM (Revenue), and HireNest Core
 */

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  FileText,
  Zap,
  Settings,
  LogOut,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Handshake,
  BrainCircuit,
  Mail,
  Database,
  Trophy,
  CheckCircle2,
  Layers,
  Server,
  Megaphone,
  GitBranch,
  Target,
  PhoneCall,
  Sparkles,
  Globe2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type DomainMode = 'ALL' | 'OS' | 'CRM';

const navGroups = [
  {
    title: "HireNest OS — Operations",
    domain: 'OS',
    subtitle: "os.hirenestworkforce.com",
    items: [
       { icon: LayoutDashboard, label: 'Mission Control', path: '/' },
       { icon: Briefcase, label: 'Requirements', path: '/requirements' },
       { icon: Users, label: 'Candidates & 360', path: '/candidates' },
       { icon: FileText, label: 'Submissions', path: '/submissions' },
       { icon: MessageSquare, label: 'Interviews', path: '/interviews' },
       { icon: CheckCircle2, label: 'Offers', path: '/offers' },
       { icon: Trophy, label: 'Placements', path: '/placements' },
       { icon: Handshake, label: 'Vendor Network', path: '/vendors' },
       { icon: Users, label: 'HR Operations', path: '/hr' },
    ]
  },
  {
    title: "HireNest CRM — Revenue",
    domain: 'CRM',
    subtitle: "crm.hirenestworkforce.com",
    items: [
       { icon: Building2, label: 'Accounts & Clients', path: '/accounts' },
       { icon: Users, label: 'Contacts', path: '/contacts' },
       { icon: Target, label: 'Revenue & Pipeline', path: '/revenue' },
       { icon: Zap, label: 'Twenty CRM Hub', path: '/twenty-crm' },
       { icon: Mail, label: 'MailOS & Outreach', path: '/mail' },
       { icon: Megaphone, label: 'Marketing Studio', path: '/marketing' },
    ]
  },
  {
    title: "HireNest Core — Intelligence & SSOT",
    domain: 'CORE',
    adminOnly: true,
    items: [
       { icon: Server, label: 'AI Control Center', path: '/ai-control' },
       { icon: BrainCircuit, label: 'AI SDR & Copilots', path: '/agents' },
       { icon: Layers, label: 'Multi-Workspaces', path: '/workspaces' },
       { icon: Database, label: 'Knowledge Vault', path: '/knowledge-vault' },
       { icon: ShieldCheck, label: 'Quality Control', path: '/quality-control' },
       { icon: TrendingUp, label: 'AI Model Accuracy', path: '/ai-accuracy' },
       { icon: GitBranch, label: 'Automation Studio', path: '/automation' },
       { icon: Settings, label: 'Settings & Security', path: '/settings' },
    ]
  }
];

export function Sidebar() {
  const { signOut, user } = useAuth();
  const [activeDomain, setActiveDomain] = useState<DomainMode>('ALL');

  const filteredGroups = navGroups.filter(group => {
    if (activeDomain === 'ALL') return true;
    if (activeDomain === 'OS') return group.domain === 'OS' || group.domain === 'CORE';
    if (activeDomain === 'CRM') return group.domain === 'CRM' || group.domain === 'CORE';
    return true;
  });

  return (
    <aside className="w-64 bg-slate-200/50 text-slate-700 flex flex-col h-screen sticky top-0 border-r border-slate-300 shadow-[1px_0_0_white]">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-300/80 shadow-[0_1px_0_white]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.2)]">
            <Zap className="text-white w-4 h-4 fill-current drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight" style={{textShadow: '0 1px 1px white'}}>
              HireNest Workforce
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Core • OS • CRM
            </p>
          </div>
        </div>

        {/* Domain Scope Filter */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-300/60 rounded-lg border border-slate-300 shadow-inner text-[11px] font-black">
          <button
            onClick={() => setActiveDomain('ALL')}
            className={cn(
              "py-1 rounded text-center transition-all",
              activeDomain === 'ALL'
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Core
          </button>
          <button
            onClick={() => setActiveDomain('OS')}
            className={cn(
              "py-1 rounded text-center transition-all",
              activeDomain === 'OS'
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            OS
          </button>
          <button
            onClick={() => setActiveDomain('CRM')}
            className={cn(
              "py-1 rounded text-center transition-all",
              activeDomain === 'CRM'
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            CRM
          </button>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {filteredGroups.map((group, index) => {
          if (group.adminOnly && user?.role !== "admin" && user?.role !== "founder") return null;

          return (
            <div key={index} className="space-y-1">
              {group.title && (
                <div className="px-3 mb-1">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest" style={{textShadow: '0 1px 0 rgba(255,255,255,0.8)'}}>
                    {group.title}
                  </h3>
                  {group.subtitle && (
                    <p className="text-[9px] font-medium text-slate-400 font-mono">
                      {group.subtitle}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 group font-bold text-xs font-sans",
                        isActive
                          ? "skeuo-btn-primary text-white shadow-md"
                          : "hover:bg-slate-300/50 hover:text-slate-900 text-slate-600 border border-transparent",
                      )
                    }
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0",
                        "group-hover:scale-110 transition-transform drop-shadow-sm",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Info & SSOT Status Footer */}
      <div className="p-3 border-t border-slate-300 space-y-3 shadow-[0_-1px_0_white] bg-slate-200/80">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_1px_1px_white] border border-slate-300 shrink-0">
            {user?.name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-800 truncate" style={{textShadow: '0 1px 0 white'}}>
              {user?.name}
            </p>
            <p className="text-[9px] font-bold tracking-wider text-slate-500 uppercase truncate">
              {user?.role} • Core ABAC Active
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-300/50 hover:text-slate-900 transition-colors text-xs font-bold"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span style={{textShadow: '0 1px 0 white'}}>Sign Out</span>
        </button>

        <div className="px-2">
          <div
            className="flex items-center justify-between px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border shadow-sm bg-emerald-50 text-emerald-800 border-emerald-300"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Firestore SSOT
            </span>
            <span className="text-[8px] text-emerald-600 font-mono">RC-1</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
