import { dbProxy } from '@/services/firebase/db-proxy';
import type { Vendor } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString } from '@/utils/safe';

export const VendorRepository = {
  async getById(id: string): Promise<Vendor | null> {
    try {
      const data = await dbProxy.getDoc('vendors', id);
      if (!data) return null;
      return {
        id: id,
        name: data.name || '',
        type: data.type || 'vendor',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        specialization: data.specialization || [],
        isRecruiter: data.isRecruiter || false,
        recruiterCompany: data.recruiterCompany || '',
        vendorCode: data.vendorCode || '',
        userId: data.userId || '',
        companyId: data.companyId || '',
        status: data.status || 'active',
        secretKey: data.secretKey || '',
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `vendors/${id}`);
      return null;
    }
  },

  async list(): Promise<Vendor[]> {
    try {
      const docs = await dbProxy.getDocs('vendors');
      const firebaseVendors: Vendor[] = docs.map((data: any) => {
        return {
          id: data.id,
          name: data.name || '',
          type: data.type || 'vendor',
          company: data.company || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          specialization: data.specialization || [],
          isRecruiter: data.isRecruiter || false,
          recruiterCompany: data.recruiterCompany || '',
          vendorCode: data.vendorCode || '',
          userId: data.userId || '',
          companyId: data.companyId || '',
          status: data.status || 'active',
          secretKey: data.secretKey || '',
          createdAt: safeISOString(data.createdAt || data.created_at),
          updatedAt: safeISOString(data.updatedAt || data.updated_at),
          source: 'os'
        };
      });

      return firebaseVendors.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vendors');
      return [];
    }
  },

  async create(data: Partial<Vendor>): Promise<Vendor> {
    const id = data.id || crypto.randomUUID();
    const vendor: Vendor = {
      id,
      name: data.name || '',
      type: data.type || 'vendor',
      company: data.company || '',
      email: data.email || '',
      phone: data.phone || '',
      location: data.location || '',
      specialization: data.specialization || [],
      isRecruiter: data.isRecruiter || false,
      recruiterCompany: data.recruiterCompany || '',
      vendorCode: data.vendorCode || '',
      userId: data.userId || '',
      companyId: data.companyId || '',
      status: data.status || 'active',
      secretKey: data.secretKey || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await dbProxy.setDoc('vendors', id, vendor);
      return vendor;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vendors/${id}`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Vendor>): Promise<void> {
    const cleanUpdates = { ...updates, updatedAt: new Date().toISOString() };
    try {
      await dbProxy.updateDoc('vendors', id, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vendors/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await dbProxy.deleteDoc('vendors', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vendors/${id}`);
    }
  }
};
