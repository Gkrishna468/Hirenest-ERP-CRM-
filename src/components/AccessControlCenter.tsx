import React, { useState, useEffect } from 'react';
import { Shield, Users, Lock, Key, Activity, CheckCircle2, AlertCircle, Plus, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function AccessControlCenter() {
  const { apiFetch } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles' | 'policies' | 'audit'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'BDM',
    organizationId: 'org_hirenest',
    teamId: 'Enterprise Team',
    scope: 'ASSIGNED'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, policiesRes] = await Promise.all([
        apiFetch('/api/access-control/users').then(r => r.json()),
        apiFetch('/api/access-control/policies').then(r => r.json())
      ]);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setPolicies(Array.isArray(policiesRes) ? policiesRes : []);
    } catch (err) {
      console.error("Failed to load Access Control data:", err);
      toast.error("Failed to load access control data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/access-control/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: newUser })
      });
      if (!res.ok) throw new Error("Failed to invite user");
      toast.success(`User ${newUser.email} invited successfully!`);
      setShowInviteModal(false);
      setNewUser({ name: '', email: '', role: 'BDM', organizationId: 'org_hirenest', teamId: 'Enterprise Team', scope: 'ASSIGNED' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user");
    }
  };

  const handleUpdatePolicy = async (policyId: string, mode: string, approvalRole: string) => {
    try {
      const res = await apiFetch(`/api/access-control/policies/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { mode, approvalRole } })
      });
      if (!res.ok) throw new Error("Failed to update policy");
      toast.success("Automation policy updated successfully!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update policy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">HireNest Access Control Center</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Centralized RBAC, ABAC Resource Scopes, and RevenueOS Automation Policies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeSubTab === 'users' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Users className="w-4 h-4" /> Users & Scopes ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('roles')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeSubTab === 'roles' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Key className="w-4 h-4" /> Roles & Permissions Registry
        </button>
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeSubTab === 'policies' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Lock className="w-4 h-4" /> RevenueOS Automation Policies ({policies.length})
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`pb-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeSubTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <Activity className="w-4 h-4" /> Access Audit Log
        </button>
      </div>

      {/* Tab Content: Users */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-800">Organization Users & Scope Assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">User Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Resource Scope</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">No users found in this tenant.</td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        {u.displayName || u.name || 'Unnamed User'}
                      </td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">
                          {u.role || 'Recruiter'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-xs">{u.organizationId || 'org_hirenest'}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full">
                          {u.scope || 'ASSIGNED'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Roles & Permissions */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Super Admin', 'BDM', 'Recruiter', 'Finance', 'Vendor Admin', 'Client Admin'].map((roleName) => (
            <div key={roleName} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-base">{roleName}</h4>
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs text-slate-500 mb-4">Standardized enterprise role mapped to granular permissions and scopes.</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CRM Records Access</div>
                  <div className="flex items-center gap-2 text-slate-700"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> RevenueOS Recommendation Engine</div>
                  {['Super Admin', 'BDM'].includes(roleName) && (
                    <div className="flex items-center gap-2 text-slate-700"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> RevenueOS Action Execution</div>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Scope: {roleName === 'Super Admin' ? 'GLOBAL' : 'ORGANIZATION'}</span>
                <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">View Permissions</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Automation Policies */}
      {activeSubTab === 'policies' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">RevenueOS Automation & Approval Policies</h3>
              <p className="text-xs text-slate-500">Govern whether AI actions execute automatically or require explicit human approval.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Action</th>
                  <th className="p-4">Required Permission</th>
                  <th className="p-4">Automation Mode</th>
                  <th className="p-4">Approval Role</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {policies.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-900 font-mono text-xs">{p.action}</td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{p.requiredPermission}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${p.mode === 'AUTOMATIC' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {p.mode}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{p.approvalRole}</td>
                    <td className="p-4">
                      <select
                        value={p.mode}
                        onChange={(e) => handleUpdatePolicy(p.id, e.target.value, p.approvalRole)}
                        className="px-3 py-1 text-xs border border-slate-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="AUTOMATIC">AUTOMATIC</option>
                        <option value="APPROVAL_REQUIRED">APPROVAL_REQUIRED</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Access Audit Log */}
      {activeSubTab === 'audit' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Security & Access Audit Trail (system_events)</h3>
          <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-center text-sm text-slate-500">
            All user invitations, permission grants, role changes, and policy modifications are cryptographically logged in the immutable company ledger (`system_events`).
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Invite New User</h3>
            <p className="text-xs text-slate-500 mb-4">Provision a new user with organizational scoping and RBAC permissions.</p>
            
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Rahul Sharma" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="rahul@hirenestworkforce.com" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="BDM">BDM</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Finance">Finance</option>
                    <option value="Vendor Admin">Vendor Admin</option>
                    <option value="Client Admin">Client Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Scope</label>
                  <select 
                    value={newUser.scope}
                    onChange={(e) => setNewUser({...newUser, scope: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GLOBAL">GLOBAL</option>
                    <option value="ORGANIZATION">ORGANIZATION</option>
                    <option value="TEAM">TEAM</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
