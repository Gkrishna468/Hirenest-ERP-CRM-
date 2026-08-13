import { apiFetch } from '@/lib/api';
import type { Job } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const RequirementRepository = {
  async getById(id: string): Promise<Job | null> {
    try {
      const res = await apiFetch(`/api/requirements/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data || data.error) return null;
      return {
        id: id,
        companyId: data.companyId || data.company_id || '',
        title: data.title || '',
        description: data.description || '',
        location: data.location || '',
        type: data.type || '',
        salary: safeBudget(data.salary),
        budget: safeBudget(data.budget),
        adjustedBudget: data.adjustedBudget || data.adjusted_budget || 0,
        skills: data.skills || [],
        experienceRequired: data.experienceRequired || data.experience_required || '',
        openings: data.openings || 1,
        submissionsCount: data.submissionsCount || data.submissions_count || 0,
        status: (data.status || 'pending').toLowerCase(),
        approvalStatus: (data.approvalStatus || data.approval_status || 'pending').toLowerCase(),
        clientId: data.clientId || data.client_id || '',
        clientName: data.clientName || data.client_name || '',
        userId: data.userId || data.user_id || '',
        closedDate: data.closedDate || data.closed_date || '',
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
        pricing_data: data.pricing_data || null,
        broadcast_to_vendors: data.broadcast_to_vendors || false,
        experienceMin: data.experienceMin !== undefined ? data.experienceMin : null,
        experienceMax: data.experienceMax !== undefined ? data.experienceMax : null,
        salaryMin: data.salaryMin !== undefined ? data.salaryMin : null,
        salaryMax: data.salaryMax !== undefined ? data.salaryMax : null,
        salaryType: data.salaryType || null,
        workMode: data.workMode || null,
        noticePeriod: data.noticePeriod || null,
        shiftTiming: data.shiftTiming || null,
        interviewMode: data.interviewMode || null,
        interviewRounds: data.interviewRounds !== undefined ? data.interviewRounds : null,
        joiningTimeline: data.joiningTimeline || null,
        education: data.education || null,
        certifications: data.certifications || null,
        visaAuthorization: data.visaAuthorization || null,
        replacementPeriod: data.replacementPeriod || null,
        priority: data.priority || 'Medium',
        publishTo: data.publishTo || null,
        versions: data.versions || [],
        changeLog: data.changeLog || [],
        pendingUpdates: data.pendingUpdates || null,
      } as any;
    } catch (error) {
      console.warn(`[RequirementRepository.getById] Could not fetch requirement ${id}:`, error);
      return null;
    }
  },

  async list(): Promise<Job[]> {
    try {
      const res = await apiFetch('/api/requirements');
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      const firebaseJobs = docs.map((data: any) => {
        return {
          id: data.id,
          companyId: data.companyId || data.company_id || '',
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          type: data.type || '',
          salary: safeBudget(data.salary),
          budget: safeBudget(data.budget),
          adjustedBudget: data.adjustedBudget || data.adjusted_budget || 0,
          skills: data.skills || [],
          experienceRequired: data.experienceRequired || data.experience_required || '',
          openings: data.openings || 1,
          submissionsCount: data.submissionsCount || data.submissions_count || 0,
          status: (data.status || 'pending').toLowerCase(),
          approvalStatus: (data.approvalStatus || data.approval_status || 'pending').toLowerCase(),
          clientId: data.clientId || data.client_id || '',
          clientName: data.clientName || data.client_name || '',
          userId: data.userId || data.user_id || '',
          closedDate: data.closedDate || data.closed_date || '',
          createdAt: safeISOString(data.createdAt || data.created_at),
          updatedAt: safeISOString(data.updatedAt || data.updated_at),
          pricing_data: data.pricing_data || null,
          broadcast_to_vendors: data.broadcast_to_vendors || false,
          experienceMin: data.experienceMin !== undefined ? data.experienceMin : null,
          experienceMax: data.experienceMax !== undefined ? data.experienceMax : null,
          salaryMin: data.salaryMin !== undefined ? data.salaryMin : null,
          salaryMax: data.salaryMax !== undefined ? data.salaryMax : null,
          salaryType: data.salaryType || null,
          workMode: data.workMode || null,
          noticePeriod: data.noticePeriod || null,
          shiftTiming: data.shiftTiming || null,
          interviewMode: data.interviewMode || null,
          interviewRounds: data.interviewRounds !== undefined ? data.interviewRounds : null,
          joiningTimeline: data.joiningTimeline || null,
          education: data.education || null,
          certifications: data.certifications || null,
          visaAuthorization: data.visaAuthorization || null,
          replacementPeriod: data.replacementPeriod || null,
          priority: data.priority || 'Medium',
          publishTo: data.publishTo || null,
          versions: data.versions || [],
          changeLog: data.changeLog || [],
          pendingUpdates: data.pendingUpdates || null,
          source: 'os'
        } as any;
      });
      return firebaseJobs;
    } catch (error) {
      console.warn("[RequirementRepository.list] Unable to list requirements:", error);
      return [];
    }
  },

  async create(data: Partial<Job>, performedBy: string = 'System'): Promise<Job> {
    try {
      const res = await apiFetch('/api/requirements', {
        method: 'POST',
        body: JSON.stringify({ payload: data, performedBy })
      });
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `requirements`);
      throw error;
    }
  },

  async createWithTransaction(data: Partial<Job>, performedBy: string = 'System'): Promise<Job> {
    return this.create(data, performedBy);
  },

  async update(id: string, updates: Partial<Job>, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/requirements/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload: updates, performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requirements/${id}`);
      throw error;
    }
  },

  async delete(id: string, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/requirements/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `requirements/${id}`);
      throw error;
    }
  }
};
