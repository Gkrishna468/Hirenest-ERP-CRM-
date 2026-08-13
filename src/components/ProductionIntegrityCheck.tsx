import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ShieldAlert, RefreshCw, Lock, Database, ShieldCheck } from 'lucide-react';
import { HireNestLogo } from './HireNestLogo';

interface ProductionIntegrityCheckProps {
  children: React.ReactNode;
}

export const ProductionIntegrityCheck: React.FC<ProductionIntegrityCheckProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const [integrityStatus, setIntegrityStatus] = useState<'checking' | 'passed' | 'failed'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || dataLoading) return;

    const validateIntegrity = async () => {
      try {
        // 1. Check if user is authenticated
        if (!user) {
          setIntegrityStatus('passed'); // Let AuthContext handle redirect to login
          return;
        }

        // 2. Validate User Profile & Role
        const allowedRoles = ['admin', 'founder', 'client_manager', 'vendor_manager', 'recruiter', 'manager', 'vendor', 'client', 'viewer', 'bdm'];
        if (!user.role || !allowedRoles.includes(user.role)) {
          setErrorMsg(`Invalid or unauthorized role detected: ${user.role}`);
          setIntegrityStatus('failed');
          return;
        }

        // 3. Validate Organization Context
        // Admins and Founders don't necessarily need a companyId in their profile if they are cross-org
        if (user.role !== 'admin' && user.role !== 'founder' && !user.companyId && !user.organizationId) {
          setErrorMsg("No organization context associated with this session.");
          setIntegrityStatus('failed');
          return;
        }
        
        setIntegrityStatus('passed');
      } catch (err: any) {
        setErrorMsg(err.message || "Integrity verification failed.");
        setIntegrityStatus('failed');
      }
    };

    validateIntegrity();
  }, [user, authLoading, dataLoading]);

  if (integrityStatus === 'checking' || authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
        {/* Ambient background glow */}
        <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute w-64 h-64 bg-amber-500/10 rounded-full blur-2xl animate-pulse [animation-delay:1s] pointer-events-none" />

        <div className="relative flex flex-col items-center z-10 text-center">
          {/* Outer Orbiting Ring Container holding the Logo */}
          <div className="relative mb-6 p-4 flex items-center justify-center">
            {/* Outer Spinning Ring */}
            <div className="absolute inset-0 border-2 border-cyan-500/30 border-t-cyan-400 border-r-blue-500 rounded-full animate-spin [animation-duration:4s]" />
            
            {/* Counter-spinning Inner Ring */}
            <div className="absolute inset-2 border-2 border-emerald-500/30 border-b-emerald-400 border-l-cyan-400 rounded-full animate-spin [animation-duration:2.5s] [animation-direction:reverse]" />

            {/* Glowing Backdrop */}
            <div className="absolute inset-4 bg-gradient-to-tr from-cyan-600/30 via-blue-600/30 to-emerald-600/30 rounded-full blur-md opacity-80 animate-pulse" />

            {/* Central HireNest Hummingbird & Circuit Nest Logo Emblem */}
            <div className="relative z-10 animate-spin [animation-duration:12s] p-2">
              <HireNestLogo size={90} animated />
            </div>
          </div>

          {/* Brand Name Typography */}
          <div className="mb-4">
            <h1 className="text-2xl font-black text-white tracking-tight uppercase font-sans">
              HIRENEST <span className="text-cyan-400 font-extrabold">WORKFORCE</span>
            </h1>
            <p className="text-xs font-semibold text-slate-400 tracking-wider">
              IT Staffing & Vendor Network
            </p>
            <p className="text-[11px] font-bold text-indigo-400 tracking-widest mt-1">
              Hire Faster. Scale Smarter.
            </p>
          </div>

          {/* System Integrity Verification Label */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-5 py-2.5 rounded-full shadow-inner shadow-black/50">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <p className="text-slate-200 font-mono text-xs tracking-widest uppercase font-semibold">
              Verifying System Integrity...
            </p>
          </div>

          {/* Security & SSOT Badge */}
          <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase SSOT & Role Claims Validation</span>
          </div>
        </div>
      </div>
    );
  }

  if (integrityStatus === 'failed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldAlert className="w-48 h-48 text-rose-500" />
          </div>
          
          <div className="text-center space-y-2 relative z-10">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight font-mono uppercase">Access Denied</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              The system integrity engine has blocked this session due to a security policy violation or invalid configuration.
            </p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3 relative z-10">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Database className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Incident Report</span>
            </div>
            <p className="text-xs text-rose-400 font-mono font-bold leading-relaxed">
              {errorMsg}
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 relative z-10"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Handshake</span>
          </button>

          <div className="border-t border-slate-800 pt-4 text-center">
            <span className="text-[10px] text-slate-500 font-mono">HIRENEST_OS_INTEGRITY_ENGINE_v1.0</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
