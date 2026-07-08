import { dbProxy } from '@/services/firebase/db-proxy';
import type { Candidate } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const CandidateRepository = {
  async getById(id: string): Promise<Candidate | null> {
    try {
      const data = await dbProxy.getDoc('candidates', id);
      if (!data) return null;
      return {
        id: id,
        source: data.source || 'os',
        vendorCompanyId: data.vendorCompanyId || data.vendor_company_id || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        skills: data.skills || [],
        experience: data.experience || 0,
        yearsExperience: data.yearsExperience || data.years_experience || 0,
        currentCompany: data.currentCompany || data.current_company || '',
        currentTitle: data.currentTitle || data.current_title || '',
        expectedSalary: safeBudget(data.expectedSalary || data.expected_salary),
        location: data.location || '',
        status: data.status || 'active',
        stage: data.stage || 'sourced',
        vendorId: data.vendorId || data.vendor_id || '',
        vendorName: data.vendorName || data.vendor_name || '',
        vendorCode: data.vendorCode || data.vendor_code || '',
        clientId: data.clientId || data.client_id || '',
        jobId: data.jobId || data.job_id || '',
        jobTitle: data.jobTitle || data.job_title || '',
        resumeUrl: data.resumeUrl || data.resume_url || '',
        notes: data.notes || '',
        aiMatchScore: data.aiMatchScore || data.ai_match_score || 0,
        assignedBdm: data.assignedBdm || data.assigned_bdm || '',
        fraudDetected: data.fraudDetected || data.fraud_detected || false,
        userId: data.userId || data.user_id || '',
        companyId: data.companyId || data.company_id || '',
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `candidates/${id}`);
      return null;
    }
  },

  async list(): Promise<Candidate[]> {
    try {
      const docs = await dbProxy.getDocs('candidates');
      const candidates = docs.map((data: any) => {
        return {
          id: data.id,
          source: data.source || 'os',
          vendorCompanyId: data.vendorCompanyId || data.vendor_company_id || '',
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          skills: data.skills || [],
          experience: data.experience || 0,
          yearsExperience: data.yearsExperience || data.years_experience || 0,
          currentCompany: data.currentCompany || data.current_company || '',
          currentTitle: data.currentTitle || data.current_title || '',
          expectedSalary: safeBudget(data.expectedSalary || data.expected_salary),
          location: data.location || '',
          status: data.status || 'active',
          stage: data.stage || 'sourced',
          vendorId: data.vendorId || data.vendor_id || '',
          vendorName: data.vendorName || data.vendor_name || '',
          vendorCode: data.vendorCode || data.vendor_code || '',
          clientId: data.clientId || data.client_id || '',
          jobId: data.jobId || data.job_id || '',
          jobTitle: data.jobTitle || data.job_title || '',
          resumeUrl: data.resumeUrl || data.resume_url || '',
          notes: data.notes || '',
          aiMatchScore: data.aiMatchScore || data.ai_match_score || 0,
          assignedBdm: data.assignedBdm || data.assigned_bdm || '',
          fraudDetected: data.fraudDetected || data.fraud_detected || false,
          userId: data.userId || data.user_id || '',
          companyId: data.companyId || data.company_id || '',
          createdAt: safeISOString(data.createdAt || data.created_at),
          updatedAt: safeISOString(data.updatedAt || data.updated_at),
        };
      });

      return candidates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'candidates');
      return [];
    }
  },

  async create(data: Partial<Candidate>): Promise<Candidate> {
    const id = data.id || crypto.randomUUID();
    const candidate: Candidate = {
      id,
      source: data.source || 'os',
      vendorCompanyId: data.vendorCompanyId || '',
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      skills: data.skills || [],
      experience: data.experience || 0,
      yearsExperience: data.yearsExperience || 0,
      currentCompany: data.currentCompany || '',
      currentTitle: data.currentTitle || '',
      expectedSalary: data.expectedSalary || '',
      location: data.location || '',
      status: data.status || 'active',
      stage: data.stage || 'sourced',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || '',
      vendorCode: data.vendorCode || '',
      clientId: data.clientId || '',
      jobId: data.jobId || '',
      jobTitle: data.jobTitle || '',
      resumeUrl: data.resumeUrl || '',
      notes: data.notes || '',
      aiMatchScore: data.aiMatchScore || 0,
      assignedBdm: data.assignedBdm || '',
      fraudDetected: data.fraudDetected || false,
      userId: data.userId || '',
      companyId: data.companyId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await dbProxy.setDoc('candidates', id, candidate);
      return candidate;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `candidates/${id}`);
      throw error;
    }
  },

  // Transactions: Use transactions for operations such as Candidate submissions/creation
  async createWithTransaction(data: Partial<Candidate>): Promise<Candidate> {
    const id = data.id || crypto.randomUUID();
    const candidate: Candidate = {
      id,
      source: data.source || 'os',
      vendorCompanyId: data.vendorCompanyId || '',
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      skills: data.skills || [],
      experience: data.experience || 0,
      yearsExperience: data.yearsExperience || 0,
      currentCompany: data.currentCompany || '',
      currentTitle: data.currentTitle || '',
      expectedSalary: data.expectedSalary || '',
      location: data.location || '',
      status: data.status || 'active',
      stage: data.stage || 'sourced',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || '',
      vendorCode: data.vendorCode || '',
      clientId: data.clientId || '',
      jobId: data.jobId || '',
      jobTitle: data.jobTitle || '',
      resumeUrl: data.resumeUrl || '',
      notes: data.notes || '',
      aiMatchScore: data.aiMatchScore || 0,
      assignedBdm: data.assignedBdm || '',
      fraudDetected: data.fraudDetected || false,
      userId: data.userId || '',
      companyId: data.companyId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Proxying transaction to simple setDoc for now
      await dbProxy.setDoc('candidates', id, candidate);
      return candidate;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `candidates/${id}`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Candidate>): Promise<void> {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    if (updates.vendorCompanyId !== undefined) cleanUpdates.vendor_company_id = updates.vendorCompanyId;
    if (updates.aiMatchScore !== undefined) cleanUpdates.ai_match_score = updates.aiMatchScore;
    try {
      await dbProxy.updateDoc('candidates', id, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await dbProxy.deleteDoc('candidates', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `candidates/${id}`);
    }
  }
};
