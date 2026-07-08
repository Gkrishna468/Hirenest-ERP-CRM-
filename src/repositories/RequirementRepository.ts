import { dbProxy } from '@/services/firebase/db-proxy';
import type { Job } from '@/types';
import { SystemRepository } from '@/repositories/SystemRepository';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const RequirementRepository = {
  async getById(id: string): Promise<Job | null> {
    try {
      const data = await dbProxy.getDoc('requirements', id);
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
      const docs = await dbProxy.getDocs('requirements');
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

      return firebaseJobs.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'requirements');
      return [];
    }
  },

  async create(data: Partial<Job>, performedBy: string = 'System'): Promise<Job> {
    const id = data.id || crypto.randomUUID();
    const requirement: any = {
      id,
      companyId: data.companyId || data.clientId || '',
      title: data.title || '',
      description: data.description || '',
      location: data.location || '',
      type: data.type || '',
      salary: safeBudget(data.salary),
      budget: safeBudget(data.budget),
      adjustedBudget: data.adjustedBudget || 0,
      skills: data.skills || [],
      experienceRequired: data.experienceRequired || '',
      openings: data.openings || 1,
      submissionsCount: 0,
      status: data.status || 'pending',
      approvalStatus: data.approvalStatus || 'pending',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      userId: data.userId || '',
      closedDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      broadcastToVendors: data.broadcastToVendors || false,
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
    };
    try {
      await dbProxy.setDoc('requirements', id, requirement);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `requirements/${id}`);
    }

    try {
      // Publish to central Sync Orchestrator / Company Ledger
      await SystemRepository.logEvent('REQUIREMENT_CREATED', "system", {
        requirementId: id,
        title: requirement.title,
        performedBy
      });
    } catch (error) {
      console.warn('Sync events publishing skipped or failed:', error);
    }

    return requirement as Job;
  },

  // Transactions: Use transactions for operations such as Requirement creation/modification
  async createWithTransaction(data: Partial<Job>, performedBy: string = 'System'): Promise<Job> {
    const id = data.id || crypto.randomUUID();
    const requirement: any = {
      id,
      companyId: data.companyId || data.clientId || '',
      title: data.title || '',
      description: data.description || '',
      location: data.location || '',
      type: data.type || '',
      salary: safeBudget(data.salary),
      budget: safeBudget(data.budget),
      adjustedBudget: data.adjustedBudget || 0,
      skills: data.skills || [],
      experienceRequired: data.experienceRequired || '',
      openings: data.openings || 1,
      submissionsCount: 0,
      status: data.status || 'pending',
      approvalStatus: data.approvalStatus || 'pending',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      userId: data.userId || '',
      closedDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      broadcastToVendors: data.broadcastToVendors || false,
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
    };

    try {
      // Proxying transaction to simple setDoc for now
      await dbProxy.setDoc('requirements', id, requirement);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `requirements/${id}`);
    }

    try {
      // Publish to central Sync Orchestrator / Company Ledger
      await SystemRepository.logEvent('REQUIREMENT_CREATED', "system", {
        requirementId: id,
        title: requirement.title,
        performedBy,
        transaction: true
      });
    } catch (error) {
      console.warn('Sync events publishing skipped or failed:', error);
    }

    return requirement;
  },

  async update(id: string, updates: Partial<Job>, performedBy: string = 'System'): Promise<void> {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    
    // Support legacy field mappings
    if (updates.experienceRequired !== undefined) cleanUpdates.experience_required = updates.experienceRequired;
    if (updates.approvalStatus !== undefined) {
      cleanUpdates.approval_status = updates.approvalStatus;
      cleanUpdates.approvalStatus = updates.approvalStatus;
    }
    if (updates.clientId !== undefined) cleanUpdates.client_id = updates.clientId;
    if (updates.clientName !== undefined) cleanUpdates.client_name = updates.clientName;
    if (updates.budget !== undefined) cleanUpdates.budget = updates.budget;

    try {
      await dbProxy.updateDoc('requirements', id, cleanUpdates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requirements/${id}`);
    }

    try {
      // Publish to central Sync Orchestrator / Company Ledger
      await SystemRepository.logEvent('REQUIREMENT_UPDATED', "system", {
        requirementId: id,
        updates: Object.keys(updates),
        performedBy
      });
    } catch (error) {
      console.warn('Sync events publishing skipped or failed:', error);
    }
  },

  async delete(id: string, performedBy: string = 'System'): Promise<void> {
    try {
      await dbProxy.deleteDoc('requirements', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `requirements/${id}`);
    }

    try {
      // Publish to central Sync Orchestrator / Company Ledger
      await SystemRepository.logEvent('REQUIREMENT_DELETED', "system", {
        requirementId: id,
        performedBy
      });
    } catch (error) {
      console.warn('Sync events publishing skipped or failed:', error);
    }
  }
};
