const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-4 gap-4">[\s\S]*?\{\/\* Billings Table \*\/\}/,
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total gross revenue</span>
                      <h4 className="text-xl font-black text-slate-800">₹{totalRevenue.toLocaleString()}</h4>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Outstanding commissions</span>
                      <h4 className="text-xl font-black text-indigo-600">₹{totalOutstanding.toLocaleString()}</h4>
                    </div>
                  </div>
                  {/* Billings Table */}`
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
