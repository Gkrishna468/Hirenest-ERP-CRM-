with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

old_btn = """                    <button
                      onClick={() => {
                        setBroadcastTargetJob(job);
                        setIsBroadcastOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" /> Broadcast
                    </button>"""

new_btn = """                    <button
                      onClick={() => {
                        setBroadcastTargetJob(job);
                        setBroadcastSettings(prev => ({
                          ...prev,
                          target: "ai",
                          linkedin: job.pricing_data?.requirementType !== "C2C"
                        }));
                        setIsBroadcastOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" /> Broadcast
                    </button>"""

content = content.replace(old_btn, new_btn)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

