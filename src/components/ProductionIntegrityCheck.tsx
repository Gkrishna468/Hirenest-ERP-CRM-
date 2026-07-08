import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ShieldAlert, RefreshCw, Lock, Database } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 relative mb-6">
          <div className="absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-spin" />
          <div className="absolute inset-2 border-r-2 border-amber-500 rounded-full animate-spin [animation-duration:1.5s]" />
          <div className="absolute inset-4 border-b-2 border-emerald-500 rounded-full animate-spin [animation-duration:2s]" />
        </div>
        <p className="text-slate-400 font-mono text-xs tracking-widest uppercase">Verifying System Integrity...</p>
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
