import React, { useState } from "react";
import { 
  Megaphone, PenTool, BarChart3, TrendingUp, Users, Handshake, 
  Linkedin, Mail, Twitter, Globe, Zap, Plus, ArrowRight, CheckCircle2,
  DollarSign, Target, Sparkles, Filter, Copy, ExternalLink, Activity, Play, Send, Building2, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketingStudio() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'attribution'>('dashboard');
  const [contentType, setContentType] = useState<'client' | 'vendor' | 'product'>('client');
  const [platform, setPlatform] = useState<'linkedin' | 'email' | 'twitter'>('linkedin');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setIsPublished(false);
    setTimeout(() => {
      if (contentType === 'client' && platform === 'linkedin') {
        setGeneratedContent(`🚀 Stop losing top IT talent to slow feedback loops.

At HireNest, our Enterprise Workforce Intelligence platform reduces time-to-fill by 60%. How? By replacing spreadsheets with an AI-driven Single Source of Truth that unites recruiters, hiring managers, and vendors in real-time.

✅ 98% Match Accuracy
✅ 24-Hour Average Submission Time
✅ Automated Vendor Orchestration

Is your staffing supply chain ready for AI? Let's talk.

#ITStaffing #FutureOfWork #HireNestOS #TechHiring #AI`);
      } else if (contentType === 'vendor' && platform === 'email') {
        setGeneratedContent(`Subject: Exclusive Access: Premium IT Requirements via HireNest Vendor OS

Hi Team,

We are actively onboarding premium vendors to the HireNest Vendor Marketplace. Gain instant access to high-priority requirements from top global systems integrators and enterprise clients.

Why join?
🔹 Zero friction submissions through our Vendor OS
🔹 Transparent feedback SLAs (No more black holes)
🔹 Live AI requirement matching for your bench
🔹 Faster vendor payouts & streamlined invoicing

Reply to this email to get your exclusive invite code.

Best regards,
Chief of Digital Marketing, HireNest`);
      } else if (contentType === 'vendor' && platform === 'linkedin') {
        setGeneratedContent(`Attention IT Staffing Vendors & Bench Partners 🚀

We are actively onboarding premium vendors to the HireNest Vendor Marketplace. Gain instant access to high-priority requirements from top global systems integrators and enterprise clients.

Why join?
🔹 Zero friction submissions through our Vendor OS
🔹 Transparent feedback SLAs (No more black holes)
🔹 Live AI requirement matching for your bench
🔹 Faster vendor payouts & streamlined invoicing

Drop a comment or DM to get your exclusive invite code.

#StaffingAgencies #BenchSales #ITRecruitment #HireNest`);
      } else {
        setGeneratedContent(`The era of fragmented recruitment CRMs is over.

Introducing HireNest OS Phase 7: The complete Workforce Intelligence Operating System. 

From Requirement Intake to Vendor Distribution, AI-Matching, and Invoicing—everything executes on a single Event-Driven Architecture.

Empower your recruiters to be strategic advisors, not data-entry clerks. AI handles the pipeline; you handle the relationships.

Explore early access today. Link in comments👇`);
      }
      setIsGenerating(false);
    }, 1500);
  };
  
  const handlePublish = async () => {
    if (platform === 'linkedin' && !linkedInConnected) {
      alert("Please connect LinkedIn first.");
      return;
    }
    
    setIsScheduling(true);
    
    setTimeout(() => {
      setIsScheduling(false);
      setIsPublished(true);
    }, 2000);
  };

  const campaigns = [
    { id: "CMP-001", name: "Q3 Client Acquisition - Java/React", target: "Clients", platform: "LinkedIn", reach: "12.4K", leads: 18, revenue: "$240,000", status: "Active" },
    { id: "CMP-002", name: "Vendor Network Expansion", target: "Vendors", platform: "Email", reach: "5.2K", leads: 45, revenue: "$0", status: "Active" },
    { id: "CMP-003", name: "HireNest OS Launch Teaser", target: "Brand", platform: "Twitter", reach: "28.1K", leads: 8, revenue: "$45,000", status: "Completed" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-indigo-600" />
            Marketing & Content Studio
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Create professional campaigns, attract clients/vendors, and track revenue attribution.
          </p>
        </div>
        <button 
          onClick={() => setActiveTab('studio')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4" /> Create AI Campaign
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 shrink-0">
        {[
          { id: 'dashboard', label: 'Campaign Performance', icon: BarChart3 },
          { id: 'studio', label: 'AI Content Creator', icon: PenTool },
          { id: 'attribution', label: 'Revenue Attribution', icon: DollarSign }
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

      <div className="flex-1 overflow-y-auto pb-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Content Reach (30d)", value: "45.7K", change: "+12.5%", icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Client Leads Gen", value: "71", change: "+8.2%", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
                { label: "Vendor Signups", value: "156", change: "+24.1%", icon: Handshake, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Revenue Influenced", value: "$285,000", change: "+15.3%", icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" }
              ].map((metric, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", metric.bg, metric.color)}>
                      <metric.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{metric.change}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">{metric.value}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Campaigns Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> Active Campaigns
                </h3>
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white text-[10px] uppercase font-black text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 border-b border-slate-100">Campaign Name</th>
                      <th className="px-6 py-4 border-b border-slate-100">Objective / Target</th>
                      <th className="px-6 py-4 border-b border-slate-100">Platform</th>
                      <th className="px-6 py-4 border-b border-slate-100">Reach / Views</th>
                      <th className="px-6 py-4 border-b border-slate-100">Leads</th>
                      <th className="px-6 py-4 border-b border-slate-100">Pipeline Value</th>
                      <th className="px-6 py-4 border-b border-slate-100">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {campaigns.map((camp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{camp.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{camp.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold",
                            camp.target === 'Clients' ? "bg-indigo-50 text-indigo-700" :
                            camp.target === 'Vendors' ? "bg-emerald-50 text-emerald-700" : "bg-purple-50 text-purple-700"
                          )}>
                            {camp.target === 'Clients' ? <Building2 className="w-3.5 h-3.5" /> : 
                             camp.target === 'Vendors' ? <Handshake className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                            {camp.target}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                            {camp.platform === 'LinkedIn' ? <Linkedin className="w-4 h-4 text-[#0A66C2]" /> :
                             camp.platform === 'Email' ? <Mail className="w-4 h-4 text-rose-500" /> :
                             <Twitter className="w-4 h-4 text-[#1DA1F2]" />}
                            {camp.platform}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 font-medium">{camp.reach}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{camp.leads}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{camp.revenue}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
                            camp.status === 'Active' ? "text-emerald-500" : "text-slate-400"
                          )}>
                            {camp.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {camp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* AI Prompter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" /> Campaign Architect
                </h3>
                <p className="text-sm text-slate-500">Configure parameters to generate high-converting professional copy.</p>
              </div>

              <div className="space-y-5 flex-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Campaign Objective</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'client', label: 'Client Acquisition', icon: Target },
                      { id: 'vendor', label: 'Vendor Onboarding', icon: Handshake },
                      { id: 'product', label: 'HireNest OS Promo', icon: Megaphone }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id as any)}
                        className={cn(
                          "p-3 rounded-xl border text-left flex flex-col items-center justify-center gap-2 transition-all",
                          contentType === type.id 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold text-center uppercase tracking-wider">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Distribution Platform</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                      { id: 'email', label: 'Email Seq', icon: Mail },
                      { id: 'twitter', label: 'Twitter / X', icon: Twitter }
                    ].map(plat => (
                      <button
                        key={plat.id}
                        onClick={() => setPlatform(plat.id as any)}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all",
                          platform === plat.id 
                            ? "bg-slate-800 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <plat.icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{plat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Key Value Proposition & Context</label>
                  <textarea 
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all resize-none"
                    placeholder="E.g., We are launching a new feature that matches candidates using AI in 5 seconds. Target enterprise staffing firms looking to reduce time-to-fill..."
                  ></textarea>
                </div>
              </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Social Integrations</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setLinkedInConnected(!linkedInConnected)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border",
                        linkedInConnected 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <Linkedin className={cn("w-4 h-4", linkedInConnected ? "text-emerald-600" : "text-[#0A66C2]")} />
                      {linkedInConnected ? "LinkedIn Connected" : "Connect LinkedIn"}
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-4">
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl font-black shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <><Activity className="w-5 h-5 animate-spin" /> Synthesizing Strategy...</>
                  ) : (
                    <><Zap className="w-5 h-5" /> Generate Campaign Assets</>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Output */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden relative">
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-indigo-400" /> Generated Asset
                </h3>
                {generatedContent && (
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    {isPublished ? (
                      <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Scheduled
                      </div>
                    ) : (
                      <button 
                        onClick={handlePublish}
                        disabled={isScheduling}
                        className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {isScheduling ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isScheduling ? "Scheduling..." : scheduleTime ? "Schedule Post" : "Publish Now"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                {!generatedContent && !isGenerating && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <Megaphone className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">Configure parameters and click generate to create assets.</p>
                  </div>
                )}
                
                {isGenerating && (
                  <div className="h-full flex flex-col items-center justify-center text-indigo-400 space-y-4">
                    <div className="relative">
                       <div className="w-12 h-12 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin"></div>
                       <Sparkles className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
                    </div>
                    <p className="text-sm font-bold animate-pulse">Running Knowledge Graph queries...</p>
                  </div>
                )}

                {generatedContent && !isGenerating && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-5 shadow-inner">
                      {platform === 'linkedin' && (
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                          <div className="w-10 h-10 bg-slate-200 rounded-full" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">HireNest Enterprise</p>
                            <p className="text-[10px] text-slate-500">Just now • 🌐</p>
                          </div>
                        </div>
                      )}
                      <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                        {generatedContent}
                      </p>
                    </div>
                    
                    <div className="bg-indigo-950 border border-indigo-900 rounded-xl p-4 mt-4">
                       <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                         <Bot className="w-4 h-4 text-indigo-400" /> AI Scheduler Agent
                       </h4>
                       <div className="flex gap-2">
                         <input 
                           type="datetime-local" 
                           value={scheduleTime}
                           onChange={(e) => setScheduleTime(e.target.value)}
                           className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 flex-1 focus:outline-none focus:border-indigo-500" 
                         />
                         <button 
                            onClick={() => {
                               const tomorrow = new Date();
                               tomorrow.setDate(tomorrow.getDate() + 1);
                               tomorrow.setHours(9, 0, 0, 0);
                               const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                               const localISOTime = (new Date(tomorrow.getTime() - tzoffset)).toISOString().slice(0, 16);
                               setScheduleTime(localISOTime);
                            }}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-700"
                         >
                           Draft for Tomorrow 9 AM
                         </button>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attribution' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-2xl p-8 text-white relative overflow-hidden border border-indigo-500/20">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <BarChart3 className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-emerald-400" /> 
                  Marketing Revenue Attribution
                </h2>
                <p className="text-indigo-200 font-medium max-w-2xl mb-8">
                  Track exactly how content creation translates into business value. This dashboard maps views and clicks directly to client acquisitions, vendor placements, and closed revenue through the HireNest Knowledge Graph.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[
                    { step: "Content Views", val: "45.7K", conv: "2.1% CTR" },
                    { step: "Profile Visitors", val: "960", conv: "14% Conv" },
                    { step: "Leads Captured", val: "134", conv: "32% Qual." },
                    { step: "Opportunities", val: "43", conv: "18% Win" },
                    { step: "Closed Revenue", val: "$285K", conv: "Generated", highlight: true },
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      {i < 4 && <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-indigo-500/50 z-0"></div>}
                      <div className={cn(
                        "bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm relative z-10 h-full flex flex-col justify-center",
                        s.highlight && "bg-emerald-900/40 border-emerald-500/30 ring-1 ring-emerald-500/50"
                      )}>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{s.step}</p>
                        <p className={cn("text-xl font-black", s.highlight ? "text-emerald-400" : "text-white")}>{s.val}</p>
                        <div className="mt-2 pt-2 border-t border-white/10">
                           <span className={cn(
                             "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                             s.highlight ? "bg-emerald-500/20 text-emerald-300" : "bg-indigo-500/20 text-indigo-300"
                           )}>
                             {s.conv}
                           </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Top Performing Content (by Revenue)</h3>
                <div className="space-y-4">
                  {[
                    { title: "Case Study: 60% Faster Time-to-Fill", type: "LinkedIn Post", rev: "$120,000", leads: 12 },
                    { title: "Vendor OS Launch Announcement", type: "Email Campaign", rev: "$85,000", leads: 45 },
                    { title: "AI Matching vs Keyword Search", type: "Blog Article", rev: "$40,000", leads: 8 },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.type} • {c.leads} Leads</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600">{c.rev}</p>
                        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400">Attributed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Audience Value Distribution</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-indigo-500"/> Enterprise Clients</p>
                        <p className="text-[10px] text-slate-500">High LTV, Longer Sales Cycle</p>
                      </div>
                      <p className="font-mono font-bold text-indigo-600">65%</p>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full w-[65%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Handshake className="w-4 h-4 text-emerald-500"/> Staffing Vendors</p>
                        <p className="text-[10px] text-slate-500">Fast Onboarding, Margin Expanders</p>
                      </div>
                      <p className="font-mono font-bold text-emerald-600">35%</p>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[35%]" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-900">AI Growth Insight</p>
                    <p className="text-xs text-amber-700/80 mt-1">Vendor-targeted content on LinkedIn generates leads 3x faster than client-targeted content, but client content yields 4x higher average revenue per closed deal. Suggest balancing campaign frequency 3:1 (Vendor:Client).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
