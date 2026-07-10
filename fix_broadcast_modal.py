import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

old_button = """                    <button
                      onClick={() => {
                        setBroadcastTargetJob(job);
                        setIsBroadcastOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" /> Broadcast
                    </button>"""

new_button = """                    <button
                      onClick={() => {
                        setBroadcastTargetJob(job);
                        setBroadcastSettings(prev => ({
                          ...prev,
                          target: 'ai',
                          linkedin: job.pricing_data?.requirementType !== 'C2C' // Disable linkedin sharing for C2C by default
                        }));
                        setIsBroadcastOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" /> Broadcast
                    </button>"""

content = content.replace(old_button, new_button)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

