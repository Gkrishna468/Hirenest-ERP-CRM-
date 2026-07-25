const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

content = content.replace(
  '<div>\n                      <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Temporary Password</label>\n                      <input\n                        type="text"\n                        value={partnerForm.temporaryPassword}\n                        onChange={e => setPartnerForm({...partnerForm, temporaryPassword: e.target.value})}\n                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none font-mono"\n                      />\n                    </div>\n                    <div className="text-[10px] text-slate-400 flex flex-col justify-center space-y-1">\n                      <p>✔ Password temporary token is valid for 24 hours.</p>\n                      <p>✔ Mandates force password reset on 3rd portal login.</p>\n                    </div>',
  '<div className="col-span-2 text-[10px] text-slate-400 flex flex-col justify-center space-y-1">\n                      <p>✔ A secure password reset link will be generated.</p>\n                      <p>✔ The vendor will be prompted to set their own password.</p>\n                    </div>'
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
