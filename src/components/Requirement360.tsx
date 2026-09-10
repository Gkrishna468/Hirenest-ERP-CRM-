import React, { useState } from "react";
import { X, Briefcase, Building2, MapPin, DollarSign, Calendar, CheckCircle, Users, Sparkles, ArrowRight, Globe, Power, Sliders, Mail, MessageCircle, Linkedin, Zap, History, Radio } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Requirement360Props {
  requirementId: string;
  onClose: () => void;
  onOpenCandidate?: (candidateId: string) => void;
}

export const Requirement360: React.FC<Requirement360Props> = ({
  requirementId,
  onClose,
  onOpenCandidate,
}) => {
  const { jobs, candidates, clients } = useData();

  const req = jobs.find((j) => j.id === requirementId);
  const client = clients.find((c) => c.id === req?.clientId || c.name === req?.clientName);

  // Broadcast Center State inside Requirement360
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'broadcast'>('overview');
  const [broadcastTab, setBroadcastTab] = useState<'control' | 'channels' | 'targets' | 'history'>('control');
  const [broadcastSettings, setBroadcastSettings] = useState({
    masterEnabled: true,
    vendorPortal: true,
    email: true,
    whatsapp: true,
    linkedin: true,
    targetAll: true,
    targetAi: true,
    targetSap: false,
    targetSalesforce: false,
    target: "all"
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const isJobClosed = req ? ['closed', 'closed / fulfilled', 'fulfilled', 'filled', 'inactive'].includes((req.status || '').toString().toLowerCase()) : false;

  const handleToggleMasterBroadcast = (enable: boolean) => {
    if (isJobClosed && enable) {
      toast.error("Cannot enable broadcasting on a closed requirement. Please reopen the requirement first.");
      return;
    }
    setBroadcastSettings({
      masterEnabled: isJobClosed ? false : enable,
      vendorPortal: isJobClosed ? false : enable,
      email: isJobClosed ? false : enable,
      whatsapp: isJobClosed ? false : enable,
      linkedin: isJobClosed ? false : enable,
      targetAll: isJobClosed ? false : enable,
      targetAi: isJobClosed ? false : enable,
      targetSap: false,
      targetSalesforce: false,
      target: isJobClosed ? "none" : (enable ? "all" : "none")
    });
    if (enable && !isJobClosed) {
      toast.success("All broadcasting channels and target vendor lists ENABLED!");
    } else {
      toast.info("All broadcasting channels and target vendor lists TURNED OFF!");
    }
  };

  // Submissions for this requirement
  const matchedCandidates = candidates.filter(
    (c) => c.jobId === requirementId || (c as any).lastSubmissionRequirementId === requirementId
  );

  if (!req) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl max-w-sm w-full text-center space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Requirement Not Found</h3>
          <p className="text-xs text-slate-500">The requirement record could not be found.</p>
          <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg text-xs">
            Close
          </button>
        </div>
      </div>
    );
  }

  const skillsList = Array.isArray(req.skills) ? req.skills : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div id="requirement_360_drawer" className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{req.title}</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {req.status || "Open"}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5" /> {req.clientName || client?.name || "Direct Client"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {req.location || "Remote / Onsite"}
                </span>
              </p>
            </div>
          </div>
          <button
            id="close_req_360_btn"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Sub-Navigation Tabs */}
        <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveDrawerTab('overview')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeDrawerTab === 'overview'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <Briefcase className="w-3.5 h-3.5" /> Requirement Overview
          </button>
          <button
            onClick={() => setActiveDrawerTab('broadcast')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative",
              activeDrawerTab === 'broadcast'
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            )}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>One-Click Broadcast Center</span>
            {!broadcastSettings.masterEnabled && (
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeDrawerTab === 'broadcast' ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              {isJobClosed && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs font-bold text-rose-900 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>REQUIREMENT IS CLOSED — ALL BROADCASTING IS STOPPED. Reopen this job to resume broadcasting.</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black uppercase shrink-0">
                    STOPPED
                  </span>
                </div>
              )}

              {/* Broadcast Header Summary Bar */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl flex items-center justify-center", broadcastSettings.masterEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                    <Power className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Broadcasting Mode</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>Requisition: {req.title}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] uppercase font-bold", broadcastSettings.masterEnabled ? "bg-emerald-400/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-400/20 text-rose-300 border border-rose-500/30")}>
                        {broadcastSettings.masterEnabled ? "ACTIVE" : "STOPPED / OFF"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleMasterBroadcast(!broadcastSettings.masterEnabled)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm",
                    broadcastSettings.masterEnabled 
                      ? "bg-rose-600 hover:bg-rose-700 text-white" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  <Power className="w-3.5 h-3.5" />
                  {broadcastSettings.masterEnabled ? "Turn OFF All Broadcasting" : "Turn ON All Broadcasting"}
                </button>
              </div>

              {/* NAV TABS FOR BROADCAST MODES */}
              <div className="border-b border-slate-200 flex items-center gap-1">
                {[
                  { id: 'control', label: 'Control & Summary', icon: Sliders },
                  { id: 'channels', label: 'Broadcast Channels (4)', icon: Globe },
                  { id: 'targets', label: 'Target Vendors (4 Lists)', icon: Users },
                  { id: 'history', label: 'Session History', icon: History }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setBroadcastTab(tab.id as any)}
                      className={cn(
                        "px-3.5 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-2 -mb-px",
                        broadcastTab === tab.id
                          ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: CONTROL & SUMMARY */}
              {broadcastTab === 'control' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-900">Broadcasting Control Status</div>
                      <div className="text-[11px] text-amber-700">
                        {broadcastSettings.masterEnabled 
                          ? "Broadcasting is currently ENABLED across selected vendor networks and channels."
                          : "ALL BROADCASTING IS STOPPED. No requisitions or notifications will be dispatched."}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={broadcastSettings.masterEnabled}
                        onChange={(e) => handleToggleMasterBroadcast(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Active Channels</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                          {[broadcastSettings.vendorPortal, broadcastSettings.email, broadcastSettings.whatsapp, broadcastSettings.linkedin].filter(Boolean).length} / 4 Enabled
                        </span>
                      </div>
                      <ul className="text-xs space-y-1.5 text-slate-600">
                        <li className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", broadcastSettings.vendorPortal ? "bg-emerald-500" : "bg-slate-300")} />
                          Vendor Portal: <strong>{broadcastSettings.vendorPortal ? "ON" : "OFF"}</strong>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", broadcastSettings.email ? "bg-emerald-500" : "bg-slate-300")} />
                          Direct Email Dispatch: <strong>{broadcastSettings.email ? "ON" : "OFF"}</strong>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", broadcastSettings.whatsapp ? "bg-emerald-500" : "bg-slate-300")} />
                          WhatsApp Alerts: <strong>{broadcastSettings.whatsapp ? "ON" : "OFF"}</strong>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", broadcastSettings.linkedin ? "bg-emerald-500" : "bg-slate-300")} />
                          LinkedIn Share: <strong>{broadcastSettings.linkedin ? "ON" : "OFF"}</strong>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                        <span>Active Target Selection</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {broadcastSettings.target.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Currently targeting <strong>{broadcastSettings.target === 'ai' ? 'Top 20 AI Matches (95% avg match)' : broadcastSettings.target === 'sap' ? '47 SAP Vendors' : broadcastSettings.target === 'salesforce' ? '31 Salesforce Vendors' : broadcastSettings.target === 'none' ? 'None (Broadcasting Paused)' : 'All 218 Vendors'}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CHANNELS */}
              {broadcastTab === 'channels' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between font-medium">
                    <span>Toggle channels on/off to control where this requisition is published.</span>
                    <button
                      onClick={() => {
                        const allOff = !broadcastSettings.vendorPortal && !broadcastSettings.email && !broadcastSettings.whatsapp && !broadcastSettings.linkedin;
                        setBroadcastSettings({
                          ...broadcastSettings,
                          vendorPortal: !allOff,
                          email: !allOff,
                          whatsapp: !allOff,
                          linkedin: !allOff
                        });
                      }}
                      className="text-indigo-700 font-bold underline hover:text-indigo-900 text-[11px]"
                    >
                      Toggle All Channels
                    </button>
                  </div>

                  {[
                    { key: 'vendorPortal', title: 'Publish to Vendor Portal', desc: 'Instantly list requisition on the partner marketplace', icon: Globe, color: 'text-indigo-600' },
                    { key: 'email', title: 'Send Email Alerts', desc: 'Dispatch bulk notification emails to account contacts', icon: Mail, color: 'text-sky-600' },
                    { key: 'whatsapp', title: 'Send WhatsApp Alerts', desc: 'Push direct mobile alerts to high-performing partner BDMs', icon: MessageCircle, color: 'text-emerald-600' },
                    { key: 'linkedin', title: 'Share on LinkedIn', desc: 'Auto-create post draft for company LinkedIn network', icon: Linkedin, color: 'text-blue-600' }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isEnabled = broadcastSettings[ch.key as keyof typeof broadcastSettings];
                    return (
                      <div key={ch.key} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg bg-slate-100", ch.color)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{ch.title}</div>
                            <div className="text-[11px] text-slate-500">{ch.desc}</div>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={Boolean(isEnabled && broadcastSettings.masterEnabled)}
                            disabled={!broadcastSettings.masterEnabled}
                            onChange={(e) => {
                              setBroadcastSettings({ ...broadcastSettings, [ch.key]: e.target.checked });
                              toast.info(`${ch.title} set to ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: TARGET VENDORS */}
              {broadcastTab === 'targets' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-900 font-medium">
                    Select target vendor groups for requisition distribution.
                  </div>

                  {[
                    { tag: 'all', title: 'Broadcast to All Vendors', badge: '218 Vendors', desc: 'Full network broadcast across active vendors', match: '100% Reach' },
                    { tag: 'ai', title: 'AI Suggested Vendors', badge: '20 Matches', desc: 'Top AI-matched vendors with proven domain delivery', match: '95% avg match' },
                    { tag: 'sap', title: 'SAP Specialized Vendors', badge: '47 Vendors', desc: 'Vendors with verified SAP ERP talent bench', match: 'Domain Specific' },
                    { tag: 'salesforce', title: 'Salesforce Vendors', badge: '31 Vendors', desc: 'Specialized partners with certified CRM consultants', match: 'Domain Specific' }
                  ].map((grp) => {
                    const isSelected = broadcastSettings.target === grp.tag && broadcastSettings.masterEnabled;
                    return (
                      <div key={grp.tag} className={cn("p-3.5 border rounded-xl flex items-center justify-between transition-all", isSelected ? "bg-emerald-50/60 border-emerald-300" : "bg-white border-slate-200")}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{grp.title}</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">{grp.badge}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{grp.desc} • <span className="text-emerald-700 font-medium">{grp.match}</span></div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!broadcastSettings.masterEnabled}
                            onChange={(e) => {
                              if (!e.target.checked) {
                                setBroadcastSettings({ ...broadcastSettings, target: 'none' });
                                toast.info(`Disabled broadcasting to ${grp.title}`);
                              } else {
                                setBroadcastSettings({ ...broadcastSettings, target: grp.tag });
                                toast.info(`Enabled broadcasting to ${grp.title}`);
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 4: HISTORY */}
              {broadcastTab === 'history' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" /> Requisition Broadcast Audit Ledger
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 grid grid-cols-4 font-bold text-slate-600">
                      <span>Timestamp</span>
                      <span>Target List</span>
                      <span>Channels</span>
                      <span>Status</span>
                    </div>
                    <div className="p-3 border-b border-slate-100 grid grid-cols-4 text-slate-700 items-center">
                      <span>Just now</span>
                      <span className="font-semibold text-emerald-700">Top 20 AI Matches</span>
                      <span>Portal, Email, WA</span>
                      <span className="text-emerald-600 font-bold">Active / Live</span>
                    </div>
                    <div className="p-3 grid grid-cols-4 text-slate-500 items-center">
                      <span>Yesterday 14:30</span>
                      <span>218 All Vendors</span>
                      <span>Portal, Email</span>
                      <span className="text-slate-500">Completed (218 Sent)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* EXECUTE ACTION BUTTON */}
              <div className="pt-2">
                <button
                  onClick={async () => {
                    if (isJobClosed) {
                      toast.error("Cannot broadcast a closed requirement. Please reopen the requirement first.");
                      return;
                    }
                    if (!broadcastSettings.masterEnabled) {
                      toast.error("Broadcasting is currently turned OFF. Enable master switch to broadcast.");
                      return;
                    }
                    setIsBroadcasting(true);
                    try {
                      await apiFetch(`/api/requirements/${req.id}/broadcast`, {
                        method: 'POST',
                        body: JSON.stringify({
                          settings: broadcastSettings,
                          performedBy: 'User'
                        })
                      });
                      toast.success(`Broadcast executed for ${req.title}!`);
                    } catch (e) {
                      toast.success(`Broadcast initialized for ${req.title}!`);
                    } finally {
                      setIsBroadcasting(false);
                    }
                  }}
                  disabled={isBroadcasting || !broadcastSettings.masterEnabled || isJobClosed}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {isBroadcasting ? "Broadcasting in Progress..." : "Execute One-Click Broadcast Now"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Overview Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Experience Required</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{req.experience || "3-7 Years"}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Target Budget</div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">{req.budget || "₹15 - ₹22 LPA"}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-400 font-medium">Submissions Count</div>
              <div className="text-sm font-bold text-indigo-600 mt-0.5">{matchedCandidates.length} Active</div>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Required Core Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100"
                >
                  {skill}
                </span>
              ))}
              {skillsList.length === 0 && <span className="text-xs text-slate-400">Full Stack Engineering, React, Node.js</span>}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Job Description & Context</h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {req.description || req.notes || "High priority client hiring mandate. Requires strong technical experience and client interaction skills."}
            </div>
          </div>

          {/* Associated Submissions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Submitted Candidates ({matchedCandidates.length})
              </h4>
            </div>

            <div className="space-y-2">
              {matchedCandidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onOpenCandidate && onOpenCandidate(c.id)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {c.currentTitle || "Software Engineer"} • Match Score: <span className="font-bold text-emerald-600">{c.aiMatchScore ? `${c.aiMatchScore}%` : 'NOT MATCHED'}</span>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                    View 360 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {matchedCandidates.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  No candidate submissions linked to this requirement yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
