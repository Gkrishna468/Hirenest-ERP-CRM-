import { dbProxy } from '@/services/firebase/db-proxy';
import type { User, Role } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';

export const UserRepository = {
  async getById(id: string): Promise<User | null> {
    try {
      const data = await dbProxy.getDoc('users', id);
      if (!data) return null;
      return {
        id: id,
        email: data.email || '',
        name: data.name || '',
        role: data.role || 'viewer',
        companyId: data.companyId,
        avatar: data.avatar || '',
        phone: data.phone || '',
        status: data.status || 'active',
        gmailConnected: data.gmailConnected || false,
        gmailEmail: data.gmailEmail,
        gmailConnectionId: data.gmailConnectionId,
        loginCount: data.loginCount || 0,
        mustChangePassword: data.mustChangePassword || false,
        temporaryPassword: data.temporaryPassword || '',
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${id}`);
      return null;
    }
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      const docs = await dbProxy.getDocs('users', {
        where: [{ field: 'email', op: '==', value: email.toLowerCase().trim() }]
      });
      if (!docs || docs.length === 0) return null;
      const data = docs[0];
      return {
        id: data.id,
        email: data.email || '',
        name: data.name || '',
        role: data.role || 'viewer',
        companyId: data.companyId,
        avatar: data.avatar || '',
        phone: data.phone || '',
        status: data.status || 'active',
        gmailConnected: data.gmailConnected || false,
        gmailEmail: data.gmailEmail,
        gmailConnectionId: data.gmailConnectionId,
        loginCount: data.loginCount || 0,
        mustChangePassword: data.mustChangePassword || false,
        temporaryPassword: data.temporaryPassword || '',
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
      phone: data.phone || '',
      avatar: data.avatar || '',
      status: data.status || 'active',
      gmailConnected: data.gmailConnected || false,
      gmailEmail: data.gmailEmail || null,
      gmailConnectionId: data.gmailConnectionId || null,
      loginCount: data.loginCount !== undefined ? data.loginCount : 0,
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : false,
      temporaryPassword: data.temporaryPassword || '',
    };
    try {
      await dbProxy.setDoc('users', id, user);
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
      await dbProxy.updateDoc('users', id, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await dbProxy.deleteDoc('users', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  },

  async list(): Promise<User[]> {
    try {
      const docs = await dbProxy.getDocs('users');
      return docs.map((data: any) => {
        return {
          id: data.id,
          email: data.email || '',
          name: data.name || '',
          role: data.role || 'viewer',
          companyId: data.companyId,
          avatar: data.avatar || '',
          phone: data.phone || '',
          status: data.status || 'active',
          gmailConnected: data.gmailConnected || false,
          gmailEmail: data.gmailEmail,
          gmailConnectionId: data.gmailConnectionId,
          loginCount: data.loginCount || 0,
          mustChangePassword: data.mustChangePassword || false,
          temporaryPassword: data.temporaryPassword || '',
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  }
};
