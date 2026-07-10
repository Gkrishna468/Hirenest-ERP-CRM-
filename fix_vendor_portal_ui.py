import re

with open("src/pages/VendorPortal.tsx", "r") as f:
    content = f.read()

# Replace the UI Form
old_form = """          {!otpStep ? (
            <form onSubmit={handleVendorLoginChallenge} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Unique Vendor ID</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500"><Landmark className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    placeholder="HN-VND-000001"
                    value={vendorCodeInput}
                    onChange={(e) => setVendorCodeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Security Secret Key</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500"><Lock className="w-4 h-4" /></span>
                  <input 
                    type="password" 
                    placeholder="••••-••••-••••"
                    value={vendorSecretInput}
                    onChange={(e) => setVendorSecretInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={authChecking}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black tracking-tight py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {authChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Securing Handshake...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Initiate Connection Handshake
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                <p className="text-slate-300 text-xs font-semibold leading-relaxed">
                  Dual-Factor challenge issued! Enter the 6-digit OTP dispatched to your partner registry email to verify session.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Verification OTP Code</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="••••••"
                  value={otpCodeInput}
                  onChange={(e) => setOtpCodeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3.5 text-center text-xl font-black tracking-[0.5em] placeholder:text-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setOtpStep(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold py-3.5 rounded-xl text-xs transition-colors"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={otpChecking}
                  className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
                >
                  {otpChecking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Authorize Credentials"
                  )}
                </button>
              </div>
            </form>
          )}"""

new_form = """
            <div className="space-y-5">
              {!isRegistering ? (
                 <div className="flex justify-center mb-6">
                    <p className="text-sm font-medium text-slate-400">
                      Are you already a HireNest Partner? 
                      <span className="text-amber-500 ml-2">Yes</span>
                    </p>
                 </div>
              ) : (
                 <div className="flex justify-center mb-6">
                    <p className="text-sm font-medium text-slate-400">
                      Registering New Organization
                    </p>
                 </div>
              )}
            <form onSubmit={handleVendorLoginChallenge} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Work Email</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500"><Users className="w-4 h-4" /></span>
                  <input 
                    type="email" 
                    placeholder="partner@company.com"
                    value={vendorEmailInput}
                    onChange={(e) => setVendorEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                  {!isRegistering && <button type="button" className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider">Forgot Password?</button>}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500"><Lock className="w-4 h-4" /></span>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={vendorPasswordInput}
                    onChange={(e) => setVendorPasswordInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-11 pr-4 text-sm font-semibold placeholder:text-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={authChecking}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black tracking-tight py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {authChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isRegistering ? "Registering..." : "Authenticating..."}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    {isRegistering ? "Register Organization" : "Sign In to Workspace"}
                  </>
                )}
              </button>
            </form>
            
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-bold uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={authChecking}
                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold tracking-tight py-3 rounded-xl transition-all flex items-center justify-center gap-3 text-sm"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
            </button>
            
            <div className="text-center mt-4">
               {isRegistering ? (
                 <button onClick={() => setIsRegistering(false)} className="text-slate-400 hover:text-amber-500 text-xs font-bold transition-colors">
                   Already have an account? Sign In
                 </button>
               ) : (
                 <button onClick={() => setIsRegistering(true)} className="text-slate-400 hover:text-amber-500 text-xs font-bold transition-colors">
                   New Partner? Register Organization
                 </button>
               )}
            </div>
            </div>"""

content = content.replace(old_form, new_form)

# And remove handleVerifyOtp
old_verify_otp = """  // OTP Verification
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setOtpChecking(true);
    setTimeout(() => {
      setOtpChecking(false);
      if (otpCodeInput.trim() === generatedOtp || otpCodeInput.trim() === "123456") { // 123456 as backdoor for demo
        const match = vendors.find(v => 
          (v.vendorCode && v.vendorCode.toLowerCase() === vendorCodeInput.trim().toLowerCase()) || 
          (v.id && v.id.toLowerCase() === vendorCodeInput.trim().toLowerCase())
        );
        if (match) {
          toast.success(`Identity Verified. Welcome, ${match.name}`);
          setAuthenticatedVendor(match);
          sessionStorage.setItem("hn_vendor_code", match.vendorCode || match.id);
        }
      } else {
        toast.error("Invalid verification code");
      }
    }, 1000);
  };
"""

content = content.replace(old_verify_otp, "")

# And we also need to change the references of vendorCodeInput to vendorEmailInput in VendorPortal.tsx (there shouldn't be any left since I deleted it above)
content = content.replace("vendorCodeInput", "vendorEmailInput")

with open("src/pages/VendorPortal.tsx", "w") as f:
    f.write(content)

