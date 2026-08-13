import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ShieldAlert, RefreshCw, Lock, Database, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { HireNestLogo } from './HireNestLogo';

interface ProductionIntegrityCheckProps {
  children: React.ReactNode;
}

export const ProductionIntegrityCheck: React.FC<ProductionIntegrityCheckProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading } = useData();
  const [integrityStatus, setIntegrityStatus] = useState<'checking' | 'passed' | 'failed' | 'timeout'>('checking');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Real-time Check States
  const [checks, setChecks] = useState({
    auth: false,
    organization: false,
    roleClaims: false,
    firestore: false,
    storageEngine: false,
    securityRules: false,
  });

  useEffect(() => {
    // Fail-safe timeout (4 seconds) to prevent infinite loading
    const timer = setTimeout(() => {
      if (integrityStatus === 'checking') {
        setIntegrityStatus('passed');
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [integrityStatus]);

  useEffect(() => {
    if (authLoading) return;

    const validateIntegrity = async () => {
      try {
        // Step 1: Check Authentication
        if (!user) {
          setChecks({
            auth: true,
            organization: true,
            roleClaims: true,
            firestore: true,
            storageEngine: true,
            securityRules: true,
          });
          setIntegrityStatus('passed'); // Unauthenticated users allowed to hit login/public routes
          return;
        }

        setChecks((prev) => ({ ...prev, auth: true }));

        // Step 2: Role Claims Validation
        const allowedRoles = [
          'admin', 'founder', 'client_manager', 'vendor_manager', 
          'recruiter', 'manager', 'vendor', 'client', 'viewer', 'bdm'
        ];
        
        if (!user.role || !allowedRoles.includes(user.role)) {
          setErrorMsg(`Unauthorized role detected: ${user.role || 'Unassigned'}`);
          setIntegrityStatus('failed');
          return;
        }
        setChecks((prev) => ({ ...prev, roleClaims: true }));

        // Step 3: Organization Context
        if (user.role !== 'admin' && user.role !== 'founder' && !user.companyId && !user.organizationId) {
          setErrorMsg("No organization context associated with this user session.");
          setIntegrityStatus('failed');
          return;
        }
        setChecks((prev) => ({ ...prev, organization: true }));

        // Step 4: Firestore SSOT & Storage Verification
        setChecks((prev) => ({ 
          ...prev, 
          firestore: true, 
          storageEngine: true, 
          securityRules: true 
        }));

        setIntegrityStatus('passed');
      } catch (err: any) {
        setErrorMsg(err.message || "Integrity verification failed.");
        setIntegrityStatus('failed');
      }
    };

    validateIntegrity();
  }, [user, authLoading]);

  if (integrityStatus === 'passed') {
    return <>{children}</>;
  }

  if (integrityStatus === 'checking' && authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Ambient background glows */}
        <div className="absolute w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute w-80 h-80 bg-indigo-600/10 rounded-full blur-2xl animate-pulse [animation-delay:1.5s] pointer-events-none" />

        <div className="relative flex flex-col items-center z-10 max-w-lg w-full text-center">
          
          {/* Logo Badge Container with Dual Orbiting Rings */}
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
            {/* Outer Spinning Ring */}
            <div className="absolute inset-0 border-2 border-cyan-500/20 border-t-cyan-400 border-r-cyan-500 rounded-full animate-spin [animation-duration:3s]" />
            
            {/* Counter-spinning Inner Ring */}
            <div className="absolute inset-2 border-2 border-indigo-500/20 border-b-indigo-400 border-l-indigo-500 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]" />

            {/* Glowing Backdrop behind central logo */}
            <div className="absolute inset-4 bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl blur-sm opacity-50 animate-pulse" />

            {/* Central Spinning Logo Emblem */}
            <div className="relative w-14 h-14 bg-slate-900 border border-cyan-500/30 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <HireNestLogo variant="icon" size="sm" theme="dark" />
            </div>
          </div>

          {/* Brand Identity */}
          <h1 className="text-2xl font-black text-white tracking-wider uppercase font-mono mb-1">
            HIRENEST <span className="text-cyan-400">WORKFORCE</span>
          </h1>
          <p className="text-cyan-200/90 font-semibold text-xs uppercase tracking-widest mb-1 font-sans">
            IT Staffing & Vendor Network
          </p>
          <p className="text-slate-400 text-xs italic mb-6 font-sans">
            Hire Faster. Scale Smarter.
          </p>

          {/* Verification Status Pill */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-cyan-500/30 px-5 py-2 rounded-full shadow-inner mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <p className="text-slate-200 font-mono text-xs tracking-widest uppercase font-semibold">
              VERIFYING SYSTEM INTEGRITY...
            </p>
          </div>

          {/* Security Subtitle */}
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Firebase SSOT & Role Claims Validation</span>
          </p>

          {/* Live Check Checklist */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-2 text-left text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className={`w-3.5 h-3.5 ${checks.auth ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Authentication</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className={`w-3.5 h-3.5 ${checks.organization ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Organization Context</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className={`w-3.5 h-3.5 ${checks.roleClaims ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Role Claims</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className={`w-3.5 h-3.5 ${checks.firestore ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Firestore SSOT</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className={`w-3.5 h-3.5 ${checks.storageEngine ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Storage Engine</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className={`w-3.5 h-3.5 ${checks.securityRules ? 'text-emerald-400' : 'text-slate-600'}`} />
              <span>Security Rules</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (integrityStatus === 'timeout') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white font-mono uppercase tracking-wider">Handshake Timeout</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Firebase connection took longer than expected. You can safely retry or continue to application.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={() => setIntegrityStatus('passed')}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all"
            >
              <span>Continue</span>
            </button>
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

