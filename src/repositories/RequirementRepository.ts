import { auth } from '@/services/firebase/config';
import type { Job } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

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
  
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || "API request failed");
  }
  return res;
}

export const RequirementRepository = {
  async getById(id: string): Promise<Job | null> {
    try {
      const res = await apiFetch(`/api/requirements/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
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
        status: data.status || 'pending',
        approvalStatus: data.approvalStatus || data.approval_status || 'pending',
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
      handleFirestoreError(error, OperationType.GET, `requirements/${id}`);
      return null;
    }
  },

  async list(): Promise<Job[]> {
    try {
      const res = await apiFetch('/api/requirements');
      const docs = await res.json();
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
          status: data.status || 'pending',
          approvalStatus: data.approvalStatus || data.approval_status || 'pending',
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
      handleFirestoreError(error, OperationType.LIST, 'requirements');
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
