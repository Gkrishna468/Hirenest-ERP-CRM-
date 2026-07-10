import re

with open("src/pages/PublicApply.tsx", "r") as f:
    content = f.read()

target = r"if \(!job\) \{[\s\S]*?return \([\s\S]*?\}\)"
replacement = """if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Position Unavailable</h2>
          <p className="text-slate-400 font-medium leading-relaxed">
            This requirement could not be found or has been closed. Please check the link or contact the recruiter.
          </p>
        </div>
      </div>
    );
  }

  if (job?.pricing_data?.requirementType === 'C2C') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(239,68,68,0.2)] mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Public Applications Disabled</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-6">
            This is a Contract-to-Contract (C2C) requirement. Public candidate applications are not accepted. Only approved staffing vendors should supply candidates.
          </p>
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
             <p className="text-indigo-400 text-sm font-bold">Are you a Delivery Partner?</p>
             <p className="text-slate-500 text-xs mt-1">Please use your Vendor Workspace to submit candidates.</p>
          </div>
        </div>
      </div>
    );
  }"""

new_content = re.sub(target, replacement, content)

with open("src/pages/PublicApply.tsx", "w") as f:
    f.write(new_content)

