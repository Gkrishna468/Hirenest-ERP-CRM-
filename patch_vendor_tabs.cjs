const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

// Update the tab definitions
content = content.replace(
  `[
                { id: 'overview', label: 'Overview & Copilot', icon: BarChart3 },
                { id: 'requirements', label: 'Broadcast & Sourcing', icon: Briefcase },
                { id: 'inventory', label: 'Talent Inventory', icon: Layers },
                { id: 'submissions', label: 'Funnel Pipeline', icon: Activity },
                { id: 'feedback', label: 'SLA Dashboard', icon: CheckSquare },
                { id: 'commercials', label: 'Commercial Ledger', icon: DollarSign },
                { id: 'identity', label: 'Corporate Identity', icon: Fingerprint },
                { id: 'documents', label: 'Legal & Contracts', icon: FileText },
                { id: 'timeline', label: 'Immutable Ledger', icon: Clock }
              ]`,
  `[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'requirements', label: 'Broadcast & Sourcing', icon: Briefcase },
                { id: 'inventory', label: 'Talent Inventory', icon: Layers },
                { id: 'submissions', label: 'Funnel Pipeline', icon: Activity },
                { id: 'feedback', label: 'SLA Activity', icon: CheckSquare },
                { id: 'commercials', label: 'Commercial Ledger', icon: DollarSign },
                { id: 'documents', label: 'Legal & Contracts', icon: FileText }
              ]`
);

// Remove the Copilot from overview tab
content = content.replace(
  /\{vendorTab === 'overview' && \([\s\S]*?<VendorCopilot[\s\S]*?\/>\s*<\/div>\s*\)\}/,
  `{vendorTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Vendor Info */}
                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Vendor Relationship Tier</span>
                        <span className="text-sm font-extrabold text-indigo-600">{selectedVendor.tier || 'Tier 3 Basic'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Vendor classification and status overview.</p>
                    </div>
                  </div>
                </div>
              )}`
);

// Clean up commercial ledger scorecard
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-4 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Billings Table -->/,
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total gross revenue</span>
                      <h4 className="text-xl font-black text-slate-800">₹{totalRevenue.toLocaleString()}</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">outstanding commissions</span>
                      <h4 className="text-xl font-black text-indigo-600">₹{totalOutstanding.toLocaleString()}</h4>
                    </div>
                  </div>
                  {/* Billings Table */}`
);

// Remove Identity and Timeline tabs
content = content.replace(
  /\{\/\* TAB: CORPORATE IDENTITY & ORG MANAGEMENT \*\/\}[\s\S]*?<VendorIdentityEngine selectedVendor=\{selectedVendor\} \/>\s*\)\}/,
  ''
);

content = content.replace(
  /\{\/\* TAB: IMMUTABLE LEDGER TIMELINE \(Chronological timeline of 12 distinct milestones\) \*\/\}[\s\S]*?<\/div>\s*\)\}/,
  ''
);


fs.writeFileSync('src/pages/Vendors.tsx', content);
