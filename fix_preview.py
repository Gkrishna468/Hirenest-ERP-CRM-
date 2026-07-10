import re

with open("src/pages/Requirements.tsx", "r") as f:
    content = f.read()

old_preview = """                    <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-600 mb-2 border border-slate-200 max-h-48 overflow-y-auto">
                      🚀 Immediate Hiring | {selectedJob.title}
                      <br />
                      📍 Location: {selectedJob.location}
                      <br />
                      💼 Employment: {selectedJob.type}
                      <br />
                      💰 Salary: {selectedJob.budget || '₹12–15 LPA'}
                      <br />
                      Experience: {selectedJob.experienceRequired || '3-5 Years'}
                    </div>"""

new_preview = """                    <div className="bg-slate-50 p-3 rounded-lg text-[10px] font-mono text-slate-600 mb-2 border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {generateJobTemplate(selectedJob, false, 'preview')}
                    </div>"""

content = content.replace(old_preview, new_preview)

with open("src/pages/Requirements.tsx", "w") as f:
    f.write(content)

