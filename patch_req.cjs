const fs = require('fs');
let content = fs.readFileSync('src/pages/Requirements.tsx', 'utf8');

content = content.replace(
  /                  <div\s+className=\{cn\(\s*"px-2\.5 py-1 text-xs font-bold rounded-full border",\s*getStatusColor\(job\.status, job\.approvalStatus\),\s*\)\}\s*>\s*\{job\.approvalStatus === "draft" \? "DRAFT" : \(job\.approvalStatus === "pending" \? "PENDING REVIEW" : job\.status\.toUpperCase\(\)\)\}\s*<\/div>/,
  `                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "px-2.5 py-1 text-xs font-bold rounded-full border",
                        getStatusColor(job.status, job.approvalStatus),
                      )}
                    >
                      {job.approvalStatus === "draft" ? "DRAFT" : (job.approvalStatus === "pending" ? "PENDING REVIEW" : job.status.toUpperCase())}
                    </div>
                    <label 
                      className="relative inline-flex items-center cursor-pointer ml-1" 
                      title={job.status === 'open' ? 'Mark as Closed' : 'Mark as Open'}
                    >
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={job.status === 'open'} 
                        onChange={async (e) => {
                          e.stopPropagation();
                          const newStatus = e.target.checked ? "open" : "closed";
                          try {
                            const res = await apiFetch(\`/api/requirements/\${job.id}\`, {
                              method: 'PUT',
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: newStatus })
                            });
                            if (res.ok) {
                              refreshData();
                              toast.success(\`Requirement marked as \${newStatus}\`);
                            } else {
                              toast.error("Failed to update status");
                            }
                          } catch(err) {
                            toast.error(err.message || "Failed to update status");
                          }
                        }} 
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>`
);

content = content.replace(
  /<button onClick=\{\(e\) => handleDeleteJob\(e, job\.id\)\} className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-colors" title="Delete Requirement">\s*<Trash2 className="w-4 h-4" \/>\s*<\/button>/,
  `{(user?.role === 'admin' || user?.role === 'founder') && (
                      <button onClick={(e) => handleDeleteJob(e, job.id)} className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded transition-colors" title="Delete Requirement">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}`
);

fs.writeFileSync('src/pages/Requirements.tsx', content);
