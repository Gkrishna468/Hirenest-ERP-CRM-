import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

old_linkedin = """                      <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" checked={broadcastSettings.linkedin} onChange={(e) => setBroadcastSettings({...broadcastSettings, linkedin: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                        <span className="text-sm font-bold text-slate-700">Share on LinkedIn</span>
                      </label>"""

new_linkedin = """                      <label className={`flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors ${broadcastTargetJob?.pricing_data?.requirementType === 'C2C' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={broadcastSettings.linkedin} disabled={broadcastTargetJob?.pricing_data?.requirementType === 'C2C'} onChange={(e) => setBroadcastSettings({...broadcastSettings, linkedin: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded disabled:opacity-50" />
                        <div className="flex-1">
                          <span className="text-sm font-bold text-slate-700">Share on LinkedIn</span>
                          {broadcastTargetJob?.pricing_data?.requirementType === 'C2C' && <span className="text-[10px] text-rose-500 block">Disabled for C2C</span>}
                        </div>
                      </label>"""

content = content.replace(old_linkedin, new_linkedin)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

