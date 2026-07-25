const fs = require('fs');
let content = fs.readFileSync('src/pages/VendorSubmit.tsx', 'utf8');

const ndaLogic = `
  const signupDate = authenticatedVendor?.signupDate ? new Date(authenticatedVendor.signupDate) : null;
  const daysSinceSignup = signupDate ? Math.floor((new Date().getTime() - signupDate.getTime()) / (1000 * 3600 * 24)) : 0;
  
  const needsNda = authenticatedVendor?.ndaStatus !== 'signed';
  const isNdaBlocked = needsNda && daysSinceSignup >= 5;

  if (isNdaBlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md bg-slate-900 border border-red-900/50 p-8 rounded-2xl space-y-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Action Required: NDA Missing</h2>
          <p className="text-sm text-slate-400">
            It has been 5 days since you registered. You must sign and upload your NDA to continue submitting profiles. Please contact the team to verify your account.
          </p>
          <button onClick={handleLogout} className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (`;

content = content.replace("  return (", ndaLogic);

const ndaBanner = `
      <div className="max-w-7xl mx-auto space-y-8">
        
        {needsNda && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-500">Non-Disclosure Agreement Required</h3>
              <p className="text-xs text-amber-500/80 mt-1">
                Please remember to sign and submit your NDA. {daysSinceSignup >= 3 ? "You have less than 2 days left before your account is restricted." : "It must be completed within 5 days of registration."}
              </p>
            </div>
          </div>
        )}
`;

content = content.replace('      <div className="max-w-7xl mx-auto space-y-8">', ndaBanner);

fs.writeFileSync('src/pages/VendorSubmit.tsx', content);
