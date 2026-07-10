import re

with open("src/pages/VendorSubmit.tsx", "r") as f:
    content = f.read()

# Add useAuth import
if "import { useAuth }" not in content:
    content = content.replace("import { useData } from '../contexts/DataContext';", "import { useData } from '../contexts/DataContext';\nimport { useAuth } from '../contexts/AuthContext';")

# Add useAuth hook inside component
if "const { apiFetch, user } = useAuth();" not in content:
    content = content.replace("const { addCandidate } = useData();", "const { addCandidate } = useData();\n  const { signIn, signUp, signInWithGoogle, user, apiFetch } = useAuth();")


# Replace State variables
content = content.replace(
"""  const [vendorCodeInput, setVendorCodeInput] = useState('');
  const [vendorSecretInput, setVendorSecretInput] = useState('');""",
"""  const [vendorEmailInput, setVendorEmailInput] = useState('');
  const [vendorPasswordInput, setVendorPasswordInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);"""
)

# Remove generatedOtp and otpStep states if possible, or just ignore them.
content = content.replace("""const [generatedOtp, setGeneratedOtp] = useState('');""", "")
content = content.replace("""const [otpCodeInput, setOtpCodeInput] = useState('');""", "")

# Rewrite the login handler
old_login_handler = """  // Handle Vendor ID + Secret Key Challenge Handshake
  const handleVendorLoginChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorCodeInput.trim()) {
      toast.error('Please enter your unique Vendor ID');
      return;
    }
    if (!vendorSecretInput.trim()) {
      toast.error('Please enter your Secret Key');
      return;
    }

    setAuthChecking(true);
    setTimeout(() => {
      const match = vendorsList.find(v => 
        (v.vendorCode && v.vendorCode.toLowerCase() === vendorCodeInput.trim().toLowerCase()) || 
        (v.id && v.id.toLowerCase() === vendorCodeInput.trim().toLowerCase())
      );

      setAuthChecking(false);
      if (!match) {
        toast.error('Invalid Vendor ID. Access Denied.');
        return;
      }

      // If they have a stored secretKey, we check it. If they don't, we assign it for secure support
      const storedKey = match.secretKey || '';
      if (storedKey && storedKey.toLowerCase() !== vendorSecretInput.trim().toLowerCase()) {
        toast.error('Invalid Secret Key. Access Denied.');
        return;
      }

      if (!storedKey) {
        match.secretKey = vendorSecretInput.trim();
        VendorRepository.update(match.id, { secretKey: vendorSecretInput.trim() }).catch(console.error);
        toast.info('Initial authentication registered. Secret Key locked.');
      }

      setMatchingVendor(match);
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(randomOtp);
      setOtpStep(true);
      
      toast.success(`Security Verification Code Dispatched!`, {
        description: `Please check your registered email for the 6-digit verification code.`,
        duration: 12000,
      });
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCodeInput.trim() !== generatedOtp) {
      toast.error('Invalid OTP Verification Code.');
      return;
    }

    setOtpChecking(true);
    setTimeout(() => {
      setOtpChecking(false);
      if (matchingVendor) {
        setAuthenticatedVendor(matchingVendor);
      }
    }, 800);
  };"""

new_login_handler = """  // Handle Vendor Login
  const handleVendorLoginChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorEmailInput.trim()) {
      toast.error('Please enter your Work Email');
      return;
    }
    if (!vendorPasswordInput.trim()) {
      toast.error('Please enter your Password');
      return;
    }

    setAuthChecking(true);
    try {
      if (isRegistering) {
        await signUp(vendorEmailInput, vendorPasswordInput, vendorEmailInput.split('@')[0], 'vendor');
        toast.success("Organization Registered! Pending Admin Verification.");
      } else {
        await signIn(vendorEmailInput, vendorPasswordInput);
        // User state will update, which triggers the useEffect
      }
    } catch(err: any) {
      console.error(err);
      toast.error(err.message || "Authentication Failed. Access Denied.");
    } finally {
      setAuthChecking(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
       setAuthChecking(true);
       await signInWithGoogle();
    } catch(err: any) {
       console.error(err);
       toast.error(err.message || "Google Sign In Failed");
    } finally {
       setAuthChecking(false);
    }
  };
"""

content = content.replace(old_login_handler, new_login_handler)


# Update User useEffect
old_user_effect = """  // If a user is already logged in (like admin testing the page), auto-auth as vendor if they have a vendor role
  useEffect(() => {
    // Basic mock check - in real app would use the context
  }, []);"""

new_user_effect = """  useEffect(() => {
    if (user) {
       if (user.role === 'admin' || user.role === 'founder') {
          // If admin, they shouldn't really be here but we can just let them view
          // Ideally they use the impersonation in VendorPortal
       } else if (user.role === 'vendor') {
          const matching = vendorsList.find(v => v.userId === user.id || v.email === user.email);
          if (matching) {
             setAuthenticatedVendor(matching);
          } else if (vendorsList.length > 0) {
             setAuthenticatedVendor(vendorsList[0]); // Fallback for dev
          }
       }
    }
  }, [user, vendorsList]);"""

content = content.replace(old_user_effect, new_user_effect)


# Rewrite form UI
# We'll use a regex to replace the entire <form>...</form> and the otp block.
ui_pattern = r"\{!otpStep \? \([\s\S]*?\}</form>[\s\S]*?\)\}"
ui_replacement = """{
            <div className="space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <form onSubmit={handleVendorLoginChallenge} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={vendorEmailInput}
                    onChange={(e) => setVendorEmailInput(e.target.value)}
                    placeholder="partner@company.com"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-center text-white placeholder-slate-600 font-mono tracking-wider transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Password</label>
                    {!isRegistering && <button type="button" className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider">Forgot?</button>}
                  </div>
                  <input
                    type="password"
                    required
                    value={vendorPasswordInput}
                    onChange={(e) => setVendorPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-center text-white placeholder-slate-600 font-mono tracking-wider transition-all font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authChecking}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 py-3.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95"
                >
                  {authChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRegistering ? "Registering..." : "Authenticating..."}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>{isRegistering ? "Register Organization" : "Sign In to Workspace"}</span>
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
              
              <div className="text-center mt-2">
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
            </div>
          }"""
          
content = re.sub(ui_pattern, ui_replacement, content)

content = content.replace("const [otpStep, setOtpStep] = useState(false);", "")

with open("src/pages/VendorSubmit.tsx", "w") as f:
    f.write(content)

