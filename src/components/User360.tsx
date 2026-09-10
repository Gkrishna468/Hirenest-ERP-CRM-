/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Shield, 
  KeyRound, 
  Lock, 
  Activity, 
  Briefcase, 
  Users, 
  FileText, 
  Building2, 
  Handshake, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Mail,
  Phone,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UserRepository } from '@/repositories/UserRepository';
import { SystemRepository } from '@/repositories/SystemRepository';
import { CandidateRepository } from '@/repositories/CandidateRepository';
import { RequirementRepository } from '@/repositories/RequirementRepository';
import { SubmissionRepository } from '@/repositories/SubmissionRepository';
import { useAuth } from '@/contexts/AuthContext';
import type { User as UserType } from '@/types';

interface User360Props {
  userId: string;
  onClose: () => void;
  onUserUpdated?: () => void;
  onOpenCandidate360?: (candidateId: string) => void;
  onOpenRequirement360?: (requirementId: string) => void;
}

export function User360({ 
  userId, 
  onClose, 
  onUserUpdated,
  onOpenCandidate360,
  onOpenRequirement360 
}: User360Props) {
  const { user: currentUser, apiFetch } = useAuth();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'records' | 'security'>('overview');
  
  // Real audit events for this user
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Real records created by or linked to this user
  const [userCandidates, setUserCandidates] = useState<any[]>([]);
  const [userRequirements, setUserRequirements] = useState<any[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Admin password reset state inside drawer
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessCreds, setResetSuccessCreds] = useState<{ name: string; email: string; tempPw: string } | null>(null);

  // Role / Status Edit mode state
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editedRole, setEditedRole] = useState<string>('');
  const [editedStatus, setEditedStatus] = useState<'active' | 'inactive'>('active');

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const profile = await UserRepository.getById(userId);
      if (profile) {
        setUserData(profile);
        setEditedRole(profile.role);
        setEditedStatus(profile.status || 'active');
      } else {
        toast.error('User profile not found');
      }
    } catch (err) {
      console.error('Error fetching user for 360 view:', err);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Fetch audit events when activity tab is clicked
  useEffect(() => {
    if (activeTab === 'activity' && userData) {
      async function fetchAudit() {
        setLoadingAudit(true);
        try {
          const res = await apiFetch(`/api/system_events?actorId=${userData.id}`);
          if (res.ok) {
            const data = await res.json();
            const events = Array.isArray(data) ? data : (data.events || []);
            setAuditEvents(events);
          } else {
            // Fallback to local system repository query if endpoint fails
            setAuditEvents([]);
          }
        } catch (err) {
          console.warn('Could not fetch user system events:', err);
        } finally {
          setLoadingAudit(false);
        }
      }
      fetchAudit();
    }
  }, [activeTab, userData]);

  // Fetch created records when records tab is clicked
  useEffect(() => {
    if (activeTab === 'records' && userData) {
      async function fetchRecords() {
        setLoadingRecords(true);
        try {
          const [cands, reqs, subs] = await Promise.all([
            CandidateRepository.list(),
            RequirementRepository.list(),
            SubmissionRepository.list()
          ]);
          
          // Filter records created or owned by this user
          const ownedCands = cands.filter(c => 
            c.userId === userData.id || 
            c.ownerUserId === userData.id || 
            (userData.vendorId && c.vendorId === userData.vendorId)
          );
          const ownedReqs = reqs.filter(r => 
            r.userId === userData.id || 
            (userData.clientId && r.clientId === userData.clientId)
          );
          const ownedSubs = subs.filter(s =>
            (s as any).createdBy === userData.id ||
            s.userId === userData.id ||
            (userData.vendorId && s.vendorId === userData.vendorId) ||
            (userData.clientId && (s as any).clientId === userData.clientId)
          );

          setUserCandidates(ownedCands);
          setUserRequirements(ownedReqs);
          setUserSubmissions(ownedSubs);
        } catch (err) {
          console.warn('Could not fetch user created records:', err);
        } finally {
          setLoadingRecords(false);
        }
      }
      fetchRecords();
    }
  }, [activeTab, userData]);

  const handleSaveRoleStatus = async () => {
    if (!userData) return;
    try {
      await UserRepository.update(userData.id, {
        role: editedRole as any,
        status: editedStatus
      });
      await SystemRepository.logEvent('USER_UPDATED', currentUser?.name || 'Admin', {
        targetUserId: userData.id,
        targetEmail: userData.email,
        updatedRole: editedRole,
        updatedStatus: editedStatus
      });
      toast.success('User access privileges updated');
      setIsEditingRole(false);
      fetchUserData();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleAdminResetPassword = async () => {
    if (!userData || !newPasswordInput.trim()) return;
    if (newPasswordInput.trim().length < 6) {
      return toast.error('Temporary password must be at least 6 characters');
    }

    try {
      await UserRepository.update(userData.id, {
        temporaryPassword: newPasswordInput.trim(),
        mustChangePassword: true,
        loginCount: 0
      });

      await SystemRepository.logEvent('PASSWORD_RESET_EXECUTED', currentUser?.name || 'Admin', {
        targetUserId: userData.id,
        targetEmail: userData.email
      });

      setResetSuccessCreds({
        name: userData.name || userData.email,
        email: userData.email,
        tempPw: newPasswordInput.trim()
      });

      setShowResetModal(false);
      toast.success('Password reset successfully!');
      fetchUserData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-extrabold text-slate-800">Loading Access 360 View...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-end z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center overflow-hidden border border-indigo-400/30 shadow-lg shrink-0">
              {userData.avatar ? (
                <img referrerPolicy="no-referrer" src={userData.avatar} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                userData.name ? userData.name.slice(0, 2).toUpperCase() : 'HN'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">{userData.name || 'Unnamed User'}</h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider",
                  userData.role === 'admin' && "bg-rose-500/20 text-rose-300 border border-rose-500/40",
                  userData.role === 'founder' && "bg-purple-500/20 text-purple-300 border border-purple-500/40",
                  userData.role === 'client_manager' && "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40",
                  userData.role === 'recruiter' && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
                  userData.role === 'vendor' && "bg-amber-500/20 text-amber-300 border border-amber-500/40",
                  userData.role === 'client' && "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40",
                )}>
                  {userData.role === 'client_manager' ? 'BDM' : userData.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <Mail className="w-3 h-3 text-slate-500" />
                {userData.email}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                <span>UID: <code className="text-indigo-400">{userData.id.slice(0, 12)}...</code></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full", userData.status === 'active' || !userData.status ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
                  {userData.status === 'active' || !userData.status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB BAR */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2 shrink-0">
          {[
            { id: 'overview', label: 'Identity & Access', icon: User },
            { id: 'security', label: 'Security & Auth', icon: Shield },
            { id: 'activity', label: 'Audit Activity', icon: Activity },
            { id: 'records', label: 'Records Created', icon: Briefcase },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase font-mono tracking-wider transition-all border-b-2",
                activeTab === tab.id
                  ? "bg-white text-indigo-600 border-indigo-600 shadow-sm"
                  : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-200/50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* STATUS & ROLE CARD */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono">Role & Access Control</h3>
                  </div>
                  {(currentUser?.role === 'admin' || currentUser?.role === 'founder') && (
                    <button
                      onClick={() => setIsEditingRole(!isEditingRole)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      {isEditingRole ? 'Cancel' : 'Edit Privilege'}
                    </button>
                  )}
                </div>

                {isEditingRole ? (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Platform Role</label>
                        <select
                          value={editedRole}
                          onChange={(e) => setEditedRole(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        >
                          <option value="admin">System Administrator (admin)</option>
                          <option value="founder">Founder (founder)</option>
                          <option value="client_manager">BDM Client Manager (client_manager)</option>
                          <option value="recruiter">Recruiter (recruiter)</option>
                          <option value="vendor">Vendor Bench Partner (vendor)</option>
                          <option value="client">Client Workspace User (client)</option>
                          <option value="viewer">Viewer (viewer)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Status</label>
                        <select
                          value={editedStatus}
                          onChange={(e) => setEditedStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                        >
                          <option value="active">Active</option>
                          <option value="disabled">Disabled / Suspended</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveRoleStatus}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Save Role & Status
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Role</span>
                      <span className="font-extrabold text-slate-800 font-mono capitalize">{userData.role}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Workspace Domain</span>
                      <span className="font-extrabold text-slate-800">{userData.workspace || 'CRM'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Account Status</span>
                      <span className={cn(
                        "font-extrabold capitalize",
                        userData.status === 'active' || !userData.status ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {userData.status || 'active'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* IDENTITY METADATA */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Contact & Identity Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                    <p className="font-bold text-slate-800 font-mono">{userData.email}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone / Mobile</span>
                    <p className="font-bold text-slate-800 font-mono">{userData.phone || 'Not Configured'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Organization Partition ID</span>
                    <p className="font-bold text-slate-800 font-mono">{userData.organizationId || 'bootstrap-org'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Created Date</span>
                    <p className="font-bold text-slate-800 font-mono">
                      {(userData as any).createdAt ? new Date((userData as any).createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Activity Detected</span>
                    <p className="font-bold text-slate-800 font-mono">
                      {(userData as any).lastActivity ? new Date((userData as any).lastActivity).toLocaleString() : (userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'N/A')}
                    </p>
                  </div>

                  {userData.vendorId && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Linked Vendor Account ID</span>
                      <p className="font-bold text-amber-900 font-mono">{userData.vendorId}</p>
                    </div>
                  )}

                  {userData.clientId && (
                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Linked Client Account ID</span>
                      <p className="font-bold text-cyan-900 font-mono">{userData.clientId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* PERMISSIONS ARRAY */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono">Assigned Permission Claims</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(userData.permissions) && userData.permissions.length > 0 ? (
                    userData.permissions.map((perm, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-bold shadow-2xs">
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">Default role permission inherited</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* AUTH SUMMARY METRICS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logins</span>
                  <p className="text-2xl font-black text-slate-800 font-mono">{userData.loginCount || 0}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Temp Password Status</span>
                  <p className="text-sm font-bold mt-1">
                    {userData.mustChangePassword ? (
                      <span className="text-amber-600 font-mono font-bold">Active (Must Change)</span>
                    ) : (
                      <span className="text-emerald-600 font-mono font-bold">Standard Password</span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 col-span-2 md:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Login Timestamp</span>
                  <p className="text-xs font-bold text-slate-700 font-mono mt-1">
                    {userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* PASSWORD RESET ACTION */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'founder') && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-6 h-6 text-indigo-600" />
                    <div>
                      <h4 className="font-extrabold text-indigo-900 text-sm">Administrative Password Reset</h4>
                      <p className="text-xs text-indigo-700 mt-0.5">Reset this user's password and issue temporary credentials.</p>
                    </div>
                  </div>

                  {resetSuccessCreds ? (
                    <div className="bg-white border border-indigo-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Password Reset Successfully!
                        </span>
                        <button onClick={() => setResetSuccessCreds(null)} className="text-slate-400 hover:text-slate-600">Dismiss</button>
                      </div>
                      <p className="text-xs text-slate-600">Send these credentials to the user:</p>
                      <pre className="p-3 bg-slate-900 text-indigo-300 rounded-lg text-xs font-mono select-all">
{`Email: ${resetSuccessCreds.email}
Temporary Password: ${resetSuccessCreds.tempPw}`}
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`Email: ${resetSuccessCreds.email}\nTemporary Password: ${resetSuccessCreds.tempPw}`);
                          toast.success('Credentials copied to clipboard');
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Credentials
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Enter new temporary password (e.g. Welcome@2026)"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-600"
                        />
                        <button
                          onClick={handleAdminResetPassword}
                          disabled={!newPasswordInput.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                        >
                          Reset Password
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* AUDIT ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Real Audit Trail (System Events Ledger)
                </h3>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{auditEvents.length} Events Logged</span>
              </div>

              {loadingAudit ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono animate-pulse">
                  Fetching audit logs from ledger...
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400 text-xs">
                  No activity events found for this user in the ledger.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditEvents.map((evt, idx) => (
                    <div key={evt.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-black text-indigo-700 text-[10px] uppercase tracking-wider">{evt.eventType || evt.action}</span>
                        <span className="text-[10px] text-slate-400">{evt.timestamp ? new Date(evt.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-slate-700 font-medium">
                        {evt.payload?.description || evt.description || evt.details || (evt.payload?.metadata ? JSON.stringify(evt.payload.metadata) : (evt.metadata ? JSON.stringify(evt.metadata) : 'System Event'))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RECORDS CREATED TAB */}
          {activeTab === 'records' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* CANDIDATES CREATED */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Candidates Ingested / Owned ({userCandidates.length})
                  </h4>
                </div>

                {loadingRecords ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-mono animate-pulse">Loading records...</div>
                ) : userCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No candidate profiles directly created or assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {userCandidates.slice(0, 10).map((cand) => (
                      <div 
                        key={cand.id} 
                        onClick={() => onOpenCandidate360 && onOpenCandidate360(cand.id)}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
                      >
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">{cand.name}</h5>
                          <p className="text-[10px] text-slate-500 font-mono">{cand.email} • {cand.currentTitle || 'Candidate'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase">
                            {cand.stage || 'New'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* REQUIREMENTS CREATED */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    Requirements Created ({userRequirements.length})
                  </h4>
                </div>

                {loadingRecords ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-mono animate-pulse">Loading records...</div>
                ) : userRequirements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No requirements created or owned by this user.</p>
                ) : (
                  <div className="space-y-2">
                    {userRequirements.slice(0, 10).map((req) => (
                      <div 
                        key={req.id} 
                        onClick={() => onOpenRequirement360 && onOpenRequirement360(req.id)}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
                      >
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">{req.title}</h5>
                          <p className="text-[10px] text-slate-500 font-mono">{req.clientName || 'Client'} • {req.location || 'Location'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                            req.status === 'open' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {req.status}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SUBMISSIONS CREATED */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Submissions Created ({userSubmissions.length})
                  </h4>
                </div>

                {loadingRecords ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-mono animate-pulse">Loading records...</div>
                ) : userSubmissions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">No submissions directly created or managed by this user.</p>
                ) : (
                  <div className="space-y-2">
                    {userSubmissions.slice(0, 10).map((sub) => (
                      <div 
                        key={sub.id} 
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div>
                          <h5 className="font-bold text-slate-900 text-xs">Submission ID: {sub.id.slice(0, 8)}...</h5>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Candidate: {sub.candidateName || sub.candidateId?.slice(0, 8)} • Requirement: {sub.requirementTitle || sub.requirementId?.slice(0, 8)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
                          {sub.status || 'Submitted'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
