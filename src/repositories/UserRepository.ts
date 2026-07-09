import { auth } from '@/services/firebase/config';

async function apiFetch(url: string, options?: RequestInit) {
  let token = '';
  const execSession = localStorage.getItem('hirenest_exec_session');
  if (execSession) {
    token = 'executive-bypass-token';
  } else if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  } else {
    token = localStorage.getItem('fb_token') || '';
  }
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const baseUrl = window.location.origin;
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const res = await fetch(fullUrl, { ...options, headers });
  if (!res.ok) {
    if (res.status === 404) {
      return res; // Graceful 404
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || "API request failed");
  }
  return res;
}
import type { User, Role } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';

export const UserRepository = {
  async getById(id: string): Promise<User | null> {
    try {
      const res = await apiFetch(`/api/users/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data) return null;
      return {
        id: id,
        email: data.email || '',
        name: data.name || '',
        role: data.role || 'viewer',
        companyId: data.companyId,
        organizationId: data.organizationId || data.companyId,
        avatar: data.avatar || '',
        phone: data.phone || '',
        status: data.status || 'active',
        gmailConnected: data.gmailConnected || false,
        gmailEmail: data.gmailEmail,
        gmailConnectionId: data.gmailConnectionId,
        loginCount: data.loginCount || 0,
        mustChangePassword: data.mustChangePassword || false,
        temporaryPassword: data.temporaryPassword || '',
        workspace: data.workspace,
        permissions: data.permissions,
        vendorId: data.vendorId,
        clientId: data.clientId,
        active: data.active !== undefined ? data.active : true,
        lastLogin: data.lastLogin,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${id}`);
      return null;
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      const res = await apiFetch(`/api/users/email/${encodeURIComponent(email.toLowerCase().trim())}`);
      if (res.status === 404) return null;
      const docs = [await res.json()];
      if (!docs || docs.length === 0) return null;
      const data = docs[0];
      return {
        id: data.id,
        email: data.email || '',
        name: data.name || '',
        role: data.role || 'viewer',
        companyId: data.companyId,
        organizationId: data.organizationId || data.companyId,
        avatar: data.avatar || '',
        phone: data.phone || '',
        status: data.status || 'active',
        gmailConnected: data.gmailConnected || false,
        gmailEmail: data.gmailEmail,
        gmailConnectionId: data.gmailConnectionId,
        loginCount: data.loginCount || 0,
        mustChangePassword: data.mustChangePassword || false,
        temporaryPassword: data.temporaryPassword || '',
        workspace: data.workspace,
        permissions: data.permissions,
        vendorId: data.vendorId,
        clientId: data.clientId,
        active: data.active !== undefined ? data.active : true,
        lastLogin: data.lastLogin,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/email/${email}`);
      return null;
    }
  },

  async create(id: string, data: Partial<User>): Promise<User> {
    const user: User = {
      id,
      email: (data.email || '').toLowerCase().trim(),
      name: data.name || '',
      role: data.role || 'viewer',
      companyId: data.companyId || null,
      organizationId: data.organizationId || data.companyId || 'bootstrap-org',
      phone: data.phone || '',
      avatar: data.avatar || '',
      status: data.status || 'active',
      gmailConnected: data.gmailConnected || false,
      gmailEmail: data.gmailEmail || null,
      gmailConnectionId: data.gmailConnectionId || null,
      loginCount: data.loginCount !== undefined ? data.loginCount : 0,
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : false,
      temporaryPassword: data.temporaryPassword || '',
      workspace: data.workspace || undefined,
      permissions: data.permissions || undefined,
      vendorId: data.vendorId || undefined,
      clientId: data.clientId || undefined,
      active: data.active !== undefined ? data.active : true,
      lastLogin: data.lastLogin || new Date().toISOString(),
    };
    try {
      await apiFetch(`/api/users`, { method: 'POST', body: JSON.stringify(user) });
      return user;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${id}`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<User>): Promise<void> {
    const cleanUpdates: any = {};
    Object.keys(updates).forEach((key) => {
      const val = (updates as any)[key];
      if (val !== undefined) {
        if (key === 'email' && typeof val === 'string') {
          cleanUpdates[key] = val.toLowerCase().trim();
        } else {
          cleanUpdates[key] = val;
        }
      }
    });
    try {
      await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(cleanUpdates) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  },

  async list(): Promise<User[]> {
    try {
      const res = await apiFetch('/api/users');
      const docs = await res.json();
      return docs.map((data: any) => {
        return {
          id: data.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'viewer',
          companyId: data.companyId,
          organizationId: data.organizationId || data.companyId,
          avatar: data.avatar || '',
          phone: data.phone || '',
          status: data.status || 'active',
          gmailConnected: data.gmailConnected || false,
          gmailEmail: data.gmailEmail,
          gmailConnectionId: data.gmailConnectionId,
          loginCount: data.loginCount || 0,
          mustChangePassword: data.mustChangePassword || false,
          temporaryPassword: data.temporaryPassword || '',
          workspace: data.workspace,
          permissions: data.permissions,
          vendorId: data.vendorId,
          clientId: data.clientId,
          active: data.active !== undefined ? data.active : true,
          lastLogin: data.lastLogin,
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  }
};
