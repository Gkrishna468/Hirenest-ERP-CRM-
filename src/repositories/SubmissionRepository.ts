import { dbProxy } from '@/services/firebase/db-proxy';
import type { Submission } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString } from '@/utils/safe';

export const SubmissionRepository = {
  async getById(id: string): Promise<Submission | null> {
    try {
      const data = await dbProxy.getDoc('submissions', id);
      if (!data) return null;
      return {
        id: id,
        jobId: data.jobId || data.job_id || '',
        candidateId: data.candidateId || data.candidate_id || '',
        vendorId: data.vendorId || data.vendor_id || '',
        candidateName: data.candidateName || data.candidate_name || '',
        jobTitle: data.jobTitle || data.job_title || '',
        status: data.status || 'submitted',
        notes: data.notes || '',
        userId: data.userId || data.user_id || '',
        createdAt: safeISOString(data.createdAt || data.created_at),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `submissions/${id}`);
      return null;
    }
  },

  async list(): Promise<Submission[]> {
    try {
      const docs = await dbProxy.getDocs('submissions');
      return docs.map((data: any) => {
        return {
          id: data.id,
          jobId: data.jobId || data.job_id || '',
          candidateId: data.candidateId || data.candidate_id || '',
          vendorId: data.vendorId || data.vendor_id || '',
          candidateName: data.candidateName || data.candidate_name || '',
          jobTitle: data.jobTitle || data.job_title || '',
          status: data.status || 'submitted',
          notes: data.notes || '',
          userId: data.userId || data.user_id || '',
          createdAt: safeISOString(data.createdAt || data.created_at),
        };
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
      return [];
    }
  },

  async create(data: Partial<Submission>): Promise<Submission> {
    const id = data.id || crypto.randomUUID();
    const submission: Submission = {
      id,
      jobId: data.jobId || '',
      candidateId: data.candidateId || '',
      vendorId: data.vendorId || '',
      candidateName: data.candidateName || '',
      jobTitle: data.jobTitle || '',
      status: data.status || 'submitted',
      notes: data.notes || '',
      userId: data.userId || '',
      createdAt: new Date().toISOString(),
    };
    try {
      await dbProxy.setDoc('submissions', id, submission);
      return submission;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `submissions/${id}`);
      throw error;
    }
  },

  // Transactions: Use transactions for operations such as Candidate submissions
  async createWithTransaction(data: Partial<Submission>): Promise<Submission> {
    const id = data.id || crypto.randomUUID();
    const submission: Submission = {
      id,
      jobId: data.jobId || '',
      candidateId: data.candidateId || '',
      vendorId: data.vendorId || '',
      candidateName: data.candidateName || '',
      jobTitle: data.jobTitle || '',
      status: data.status || 'submitted',
      notes: data.notes || '',
      userId: data.userId || '',
      createdAt: new Date().toISOString(),
    };

    try {
      // Proxying transaction to simple setDoc for now
      await dbProxy.setDoc('submissions', id, submission);
      return submission;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `submissions/${id}`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Submission>): Promise<void> {
    try {
      await dbProxy.updateDoc('submissions', id, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await dbProxy.deleteDoc('submissions', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `submissions/${id}`);
    }
  }
};
