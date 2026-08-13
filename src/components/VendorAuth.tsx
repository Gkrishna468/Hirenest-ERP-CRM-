import React, { useState } from 'react';
import { ShieldCheck, Lock, RefreshCw, Unlock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/services/firebase/config';
import { VendorRepository } from '@/repositories/VendorRepository';
import { HireNestLogo } from './HireNestLogo';

export function VendorAuth({ onAuthSuccess }: { onAuthSuccess: (vendor: any) => void }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Wait a moment for token to be available in middleware
      await new Promise(r => setTimeout(r, 500));
      
      const vendors = await VendorRepository.list();
      if (vendors.length > 0) {
        onAuthSuccess(vendors[0]);
        toast.success(`Welcome back, ${vendors[0].name}`);
      } else {
        toast.error('Vendor profile not found.');
      }
    } catch (error: any) {
      toast.error('Authentication failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !companyName) return toast.error('Please fill in required fields');
    
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/public/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName, contactName, phone })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      // Auto-login after signup
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await new Promise(r => setTimeout(r, 500));
      
      const vendors = await VendorRepository.list();
      if (vendors.length > 0) {
        onAuthSuccess(vendors[0]);
        toast.success('Registration successful. Welcome!');
      } else {
        toast.error('Registration successful, but profile could not be loaded.');
      }
    } catch (error: any) {
      toast.error('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Lock className="w-32 h-32 text-indigo-500" />
        </div>

        <div className="text-center space-y-3 relative z-10">
          <div className="flex justify-center mb-1">
            <HireNestLogo size={72} animated />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight uppercase font-sans">
              HIRENEST <span className="text-cyan-400">WORKFORCE</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              IT Staffing & Vendor Network
            </p>
          </div>
          <h2 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest pt-1">
            {isRegistering ? "VENDOR REGISTRATION" : "VENDOR AUTHENTICATION"}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {isRegistering 
              ? "Register your agency to start submitting talent."
              : "Access is restricted to verified recruitment partner organizations."}
          </p>
        </div>

        {isRegistering ? (
          <form onSubmit={handleSignup} className="space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Agency Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 transition-all"
                placeholder="Acme Recruiting"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 transition-all"
                placeholder="partner@acme.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 py-3.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Register</span>
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setIsRegistering(false)} className="text-xs text-amber-500 hover:text-amber-400 font-medium">
                Already have an account? Sign in
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@agency.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-center text-white placeholder-slate-600 font-mono tracking-wider transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Password</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        toast.error("Please enter your email first");
                        return;
                      }
                      try {
                        await sendPasswordResetEmail(auth, email);
                        toast.success("Password reset email sent!");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to send reset email");
                      }
                    }}
                    className="text-[10px] text-amber-500 hover:text-amber-400 font-bold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-center text-white placeholder-slate-600 font-mono tracking-wider transition-all font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 py-3.5 rounded-xl font-bold transition-all text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>Authenticate Session</span>
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setIsRegistering(true)} className="text-xs text-amber-500 hover:text-amber-400 font-medium">
                Not a partner yet? Register here
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
