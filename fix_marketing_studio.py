import re

with open('src/pages/MarketingStudio.tsx', 'r') as f:
    content = f.read()

# Add states for scheduling
states_to_add = """  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'attribution'>('dashboard');
  const [contentType, setContentType] = useState<'client' | 'vendor' | 'product'>('client');
  const [platform, setPlatform] = useState<'linkedin' | 'email' | 'twitter'>('linkedin');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [isPublished, setIsPublished] = useState(false);"""

content = re.sub(
    r"  const \[activeTab.*?setGeneratedContent[^;]+;", 
    states_to_add, 
    content, 
    flags=re.DOTALL
)

# Update handleGenerate with better content
handle_generate_replacement = """  const handleGenerate = () => {
    setIsGenerating(true);
    setIsPublished(false);
    setTimeout(() => {
      if (contentType === 'client' && platform === 'linkedin') {
        setGeneratedContent("🚀 Stop losing top IT talent to slow feedback loops.\\n\\nAt HireNest, our Enterprise Workforce Intelligence platform reduces time-to-fill by 60%. How? By replacing spreadsheets with an AI-driven Single Source of Truth that unites recruiters, hiring managers, and vendors in real-time.\\n\\n✅ 98% Match Accuracy\\n✅ 24-Hour Average Submission Time\\n✅ Automated Vendor Orchestration\\n\\nIs your staffing supply chain ready for AI? Let's talk.\\n\\n#ITStaffing #FutureOfWork #HireNestOS #TechHiring #AI");
      } else if (contentType === 'vendor' && platform === 'email') {
        setGeneratedContent("Subject: Exclusive Access: Premium IT Requirements via HireNest Vendor OS\\n\\nHi Team,\\n\\nWe are actively onboarding premium vendors to the HireNest Vendor Marketplace. Gain instant access to high-priority requirements from top global systems integrators and enterprise clients.\\n\\nWhy join?\\n🔹 Zero friction submissions through our Vendor OS\\n🔹 Transparent feedback SLAs (No more black holes)\\n🔹 Live AI requirement matching for your bench\\n🔹 Faster vendor payouts & streamlined invoicing\\n\\nReply to this email to get your exclusive invite code.\\n\\nBest regards,\\nChief of Digital Marketing, HireNest");
      } else if (contentType === 'vendor' && platform === 'linkedin') {
        setGeneratedContent("Attention IT Staffing Vendors & Bench Partners 🚀\\n\\nWe are actively onboarding premium vendors to the HireNest Vendor Marketplace. Gain instant access to high-priority requirements from top global systems integrators and enterprise clients.\\n\\nWhy join?\\n🔹 Zero friction submissions through our Vendor OS\\n🔹 Transparent feedback SLAs (No more black holes)\\n🔹 Live AI requirement matching for your bench\\n🔹 Faster vendor payouts & streamlined invoicing\\n\\nDrop a comment or DM to get your exclusive invite code.\\n\\n#StaffingAgencies #BenchSales #ITRecruitment #HireNest");
      } else {
        setGeneratedContent("The era of fragmented recruitment CRMs is over.\\n\\nIntroducing HireNest OS Phase 7: The complete Workforce Intelligence Operating System. \\n\\nFrom Requirement Intake to Vendor Distribution, AI-Matching, and Invoicing—everything executes on a single Event-Driven Architecture.\\n\\nEmpower your recruiters to be strategic advisors, not data-entry clerks. AI handles the pipeline; you handle the relationships.\\n\\nExplore early access today. Link in comments👇");
      }
      setIsGenerating(false);
    }, 1500);
  };
  
  const handlePublish = () => {
    if (!linkedInConnected && platform === 'linkedin') {
      alert("Please connect LinkedIn first.");
      return;
    }
    setIsScheduling(true);
    setTimeout(() => {
      setIsScheduling(false);
      setIsPublished(true);
    }, 2000);
  };"""

content = re.sub(
    r"  const handleGenerate.*?}, 1500\);\n  };",
    handle_generate_replacement,
    content,
    flags=re.DOTALL
)

# Fix LinkedIn connection inside studio tab
linkedin_button_str = """                <div>
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

                <div className="pt-6 border-t border-slate-100 mt-4">"""

content = content.replace('              <div className="pt-6 border-t border-slate-100 mt-4">', linkedin_button_str)

# Fix publishing UI
publish_buttons = """                {generatedContent && (
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
                )}"""

content = re.sub(
    r"                \{generatedContent && \(\n                  <div className=\"flex gap-2\">.*?Publish\n                    </button>\n                  </div>\n                \)}",
    publish_buttons,
    content,
    flags=re.DOTALL
)

# Add AI scheduling UI under generated content
schedule_ui = """                {generatedContent && !isGenerating && (
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
                )}"""

content = re.sub(
    r"                \{generatedContent && !isGenerating && \(\n                  <div className=\"bg-white rounded-xl p-5 shadow-inner\">.*?</p>\n                  </div>\n                \)}",
    schedule_ui,
    content,
    flags=re.DOTALL
)

# Ensure Bot is imported
if "Bot" not in content[:300]:
    content = content.replace("Activity, Play, Send, Building2", "Activity, Play, Send, Building2, Bot")


with open('src/pages/MarketingStudio.tsx', 'w') as f:
    f.write(content)
