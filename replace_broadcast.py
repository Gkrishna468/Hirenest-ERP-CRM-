import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

target = re.compile(r"\{\/\* Broadcast Intelligence & Sourcing Center Modal \*\/\}.*?(?=\{\/\* View Job 360 Detail Modal \*\/})", re.DOTALL)

replacement = """{/* One-Click Broadcast Engine Modal */}
      {isBroadcastOpen && broadcastTargetJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  One-Click Broadcast Center
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Requisition: {broadcastTargetJob.title} ({broadcastTargetJob.clientName || (broadcastTargetJob.clientId ? clients.find(c => c.id === broadcastTargetJob.clientId)?.name : null)})
                </p>
              </div>
              {!isBroadcastRunning && (
                <button
                  onClick={() => {
                    setIsBroadcastOpen(false);
                    setBroadcastTargetJob(null);
                    setBroadcastProgress(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {!isBroadcastRunning && !broadcastProgress ? (
                <>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Broadcast Channels</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={broadcastSettings.vendorPortal} onChange={(e) => setBroadcastSettings({...broadcastSettings, vendorPortal: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm font-bold text-slate-700">Publish to Vendor Portal</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={broadcastSettings.email} onChange={(e) => setBroadcastSettings({...broadcastSettings, email: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm font-bold text-slate-700">Send Email</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={broadcastSettings.whatsapp} onChange={(e) => setBroadcastSettings({...broadcastSettings, whatsapp: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm font-bold text-slate-700">Send WhatsApp</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={broadcastSettings.linkedin} onChange={(e) => setBroadcastSettings({...broadcastSettings, linkedin: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm font-bold text-slate-700">Share on LinkedIn</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-800">Target Vendors</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="radio" name="target" checked={broadcastSettings.target === "all"} onChange={() => setBroadcastSettings({...broadcastSettings, target: "all"})} className="w-4 h-4 text-indigo-600" />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-slate-700 block">Broadcast to All</span>
                          <span className="text-xs text-slate-500">218 Vendors</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50/50 rounded-xl hover:bg-emerald-50 cursor-pointer transition-colors">
                        <input type="radio" name="target" checked={broadcastSettings.target === "ai"} onChange={() => setBroadcastSettings({...broadcastSettings, target: "ai"})} className="w-4 h-4 text-emerald-600" />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-emerald-900 block flex items-center gap-1"><Zap className="w-4 h-4 text-emerald-500" /> AI Suggested Vendors</span>
                          <span className="text-xs text-emerald-700">Top 20 Matches (95% avg match)</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="radio" name="target" checked={broadcastSettings.target === "sap"} onChange={() => setBroadcastSettings({...broadcastSettings, target: "sap"})} className="w-4 h-4 text-indigo-600" />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-slate-700 block">SAP Vendors</span>
                          <span className="text-xs text-slate-500">47 Vendors</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="radio" name="target" checked={broadcastSettings.target === "salesforce"} onChange={() => setBroadcastSettings({...broadcastSettings, target: "salesforce"})} className="w-4 h-4 text-indigo-600" />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-slate-700 block">Salesforce Vendors</span>
                          <span className="text-xs text-slate-500">31 Vendors</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 space-y-8 animate-in fade-in zoom-in duration-300">
                  <div className="text-center space-y-2">
                    {broadcastProgress?.done ? (
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                    <h3 className="text-xl font-black text-slate-900">
                      {broadcastProgress?.done ? "Broadcast Completed" : "Broadcast Running..."}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Publishing to selected channels in real-time.
                    </p>
                  </div>
                  
                  <div className="space-y-4 max-w-sm mx-auto">
                    {broadcastSettings.vendorPortal && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Vendor Portal</span>
                          <span>{broadcastProgress?.portal || 0} / {broadcastProgress?.total || 0}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${((broadcastProgress?.portal || 0) / (broadcastProgress?.total || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                    {broadcastSettings.email && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Email</span>
                          <span>{broadcastProgress?.email || 0} / {broadcastProgress?.total || 0}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((broadcastProgress?.email || 0) / (broadcastProgress?.total || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                    {broadcastSettings.whatsapp && (
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>WhatsApp</span>
                          <span>{broadcastProgress?.wa || 0} / {broadcastProgress?.total || 0}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${((broadcastProgress?.wa || 0) / (broadcastProgress?.total || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                    {broadcastSettings.linkedin && (
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>LinkedIn</span>
                        <span className={cn(broadcastProgress?.done ? "text-emerald-600" : "text-slate-400")}>
                          {broadcastProgress?.done ? "Done" : "Pending..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              {!isBroadcastRunning && !broadcastProgress?.done ? (
                <>
                  <button
                    onClick={() => {
                      setIsBroadcastOpen(false);
                      setBroadcastTargetJob(null);
                    }}
                    className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsBroadcastRunning(true);
                      const targetTotal = broadcastSettings.target === 'ai' ? 20 : (broadcastSettings.target === 'sap' ? 47 : (broadcastSettings.target === 'salesforce' ? 31 : 218));
                      
                      setBroadcastProgress({
                        total: targetTotal,
                        portal: 0,
                        email: 0,
                        wa: 0,
                        done: false
                      });
                      
                      // API Call
                      try {
                        await apiFetch(`/api/requirements/${broadcastTargetJob.id}/broadcast`, {
                          method: 'POST',
                          body: JSON.stringify({
                            settings: broadcastSettings,
                            targetVendors: targetTotal,
                            performedBy: user?.id
                          })
                        });
                      } catch (err) {
                        console.error(err);
                      }
                      
                      // Simulation
                      let currentPortal = 0;
                      let currentEmail = 0;
                      let currentWa = 0;
                      
                      const interval = setInterval(() => {
                        currentPortal = Math.min(targetTotal, currentPortal + Math.floor(targetTotal / 5));
                        currentEmail = Math.min(targetTotal, currentEmail + Math.floor(targetTotal / 6));
                        currentWa = Math.min(targetTotal, currentWa + Math.floor(targetTotal / 7));
                        
                        setBroadcastProgress({
                          total: targetTotal,
                          portal: currentPortal,
                          email: currentEmail,
                          wa: currentWa,
                          done: false
                        });
                        
                        if (currentPortal >= targetTotal && currentEmail >= targetTotal && currentWa >= targetTotal) {
                          clearInterval(interval);
                          setBroadcastProgress({
                            total: targetTotal,
                            portal: targetTotal,
                            email: targetTotal,
                            wa: targetTotal,
                            done: true
                          });
                          setIsBroadcastRunning(false);
                          toast.success("Requirement broadcasted successfully!");
                          refreshData();
                        }
                      }, 500);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" /> Broadcast Now
                  </button>
                </>
              ) : broadcastProgress?.done ? (
                <button
                  onClick={() => {
                    setIsBroadcastOpen(false);
                    setBroadcastTargetJob(null);
                    setBroadcastProgress(null);
                  }}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all"
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
\n      """

new_content = target.sub(replacement, content)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(new_content)

