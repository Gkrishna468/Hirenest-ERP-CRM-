import { requirementRepository } from "../repositories/RequirementRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export function normalizeRequirementData(data: any, userContext?: any): any {
  if (!data) return data;
  
  // 1. Resolve ID and keep id/requirementId/canonicalRequirementId in sync
  const id = data.id || data.requirementId || data.canonicalRequirementId || crypto.randomUUID();
  
  // 2. Resolve organizationId
  let orgId = userContext?.organizationId || data.organizationId;
  if (!orgId || orgId === "default" || orgId === "bootstrap-org") {
    orgId = "bootstrap-org";
  }

  // 3. Resolve status: convert to uppercase standard, keep lowercase compat
  const rawStatus = (data.status || 'draft').toString().toUpperCase();
  let canonicalStatus: 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'FILLED' | 'CLOSED' = 'DRAFT';
  if (['OPEN', 'PUBLISHED', 'ACTIVE'].includes(rawStatus)) {
    canonicalStatus = 'OPEN';
  } else if (['CLOSED', 'INACTIVE'].includes(rawStatus)) {
    canonicalStatus = 'CLOSED';
  } else if (['FILLED'].includes(rawStatus)) {
    canonicalStatus = 'FILLED';
  } else if (['ON_HOLD', 'ONHOLD'].includes(rawStatus)) {
    canonicalStatus = 'ON_HOLD';
  }

  const lowercaseStatus = canonicalStatus.toLowerCase();

  // 4. Resolve approvalStatus
  const rawApproval = (data.approvalStatus || data.approval_status || (data.adminApproved ? 'APPROVED' : 'PENDING')).toString().toUpperCase();
  let canonicalApproval: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT' = 'PENDING';
  if (rawApproval === 'APPROVED' || rawApproval === 'TRUE') {
    canonicalApproval = 'APPROVED';
  } else if (rawApproval === 'REJECTED') {
    canonicalApproval = 'REJECTED';
  } else if (rawApproval === 'DRAFT') {
    canonicalApproval = 'DRAFT';
  }

  const lowercaseApproval = canonicalApproval.toLowerCase();

  // 5. Staffing model & Type
  let staffingModel = data.staffingModel || 'FTE';
  let employmentType = data.employmentType || data.type || 'Full-time';
  if (employmentType === 'Full-time' || employmentType === 'Permanent') {
    staffingModel = 'FTE';
  } else if (employmentType === 'Contract' || employmentType === 'C2C') {
    staffingModel = 'C2C';
  } else if (employmentType === 'C2H' || employmentType === 'Contract-to-Hire') {
    staffingModel = 'C2H';
  }

  let typeCompat = employmentType;
  if (staffingModel === 'FTE') typeCompat = 'Full-time';
  else if (staffingModel === 'C2C') typeCompat = 'C2C';
  else if (staffingModel === 'C2H') typeCompat = 'C2H';

  // 6. Experience
  const expMin = data.experienceMin !== undefined ? Number(data.experienceMin) : (data.experience?.min !== undefined ? Number(data.experience.min) : 0);
  const expMax = data.experienceMax !== undefined ? Number(data.experienceMax) : (data.experience?.max !== undefined ? Number(data.experience.max) : 10);
  const experienceRequiredCompat = data.experienceRequired || data.experience_required || `${expMin} – ${expMax} Years`;

  // 7. Visibility & PublishTo
  const publishTo = data.publishTo || {
    vendorPortal: data.publishToVendorPortal !== undefined ? data.publishToVendorPortal : true,
    clientPortal: data.publishToClientPortal !== undefined ? data.publishToClientPortal : true,
    whatsApp: data.publishToWhatsApp !== undefined ? data.publishToWhatsApp : true,
    linkedIn: data.publishToLinkedIn !== undefined ? data.publishToLinkedIn : true,
    internalRecruiters: data.publishToInternalRecruiters !== undefined ? data.publishToInternalRecruiters : true,
    emailCampaign: data.publishToEmailCampaign !== undefined ? data.publishToEmailCampaign : true,
  };

  const visibility = data.visibility || {
    vendors: publishTo.vendorPortal ?? true,
    clients: publishTo.clientPortal ?? true,
    public: publishTo.linkedIn ?? false
  };

  publishTo.vendorPortal = visibility.vendors;
  publishTo.clientPortal = visibility.clients;
  publishTo.linkedIn = visibility.public;

  // 8. Financials / Budget / pricing_data
  const budget = data.budget || {};
  const financials = data.financials || {
    clientBilling: data.pricing_data?.c2cClientBillingLpm || Number(data.salaryMin || 0),
    vendorCost: data.pricing_data?.c2cVendorCostLpm || Number(data.salaryMin || 0) * 0.8,
    platformMargin: data.pricing_data?.adjustedBudget || 0
  };

  const pricing_data = data.pricing_data || {
    c2cClientBillingLpm: financials.clientBilling,
    c2cVendorCostLpm: financials.vendorCost,
    adjustedBudget: financials.platformMargin
  };

  return {
    ...data,
    id,
    requirementId: id,
    canonicalRequirementId: id,
    
    organizationId: orgId,
    
    title: data.title || '',
    description: data.description || '',
    location: data.location || '',
    
    clientId: data.clientId || data.companyId || '',
    clientName: data.clientName || data.client_name || data.client || '',
    companyId: data.companyId || data.clientId || '',
    
    status: lowercaseStatus,
    status_upper: canonicalStatus,
    statusUpper: canonicalStatus,
    
    approvalStatus: lowercaseApproval,
    approval_status: lowercaseApproval,
    approvalStatusUpper: canonicalApproval,
    adminApproved: canonicalApproval === 'APPROVED',
    
    staffingModel,
    type: typeCompat,
    employmentType: typeCompat,
    
    experienceMin: expMin,
    experienceMax: expMax,
    experience: {
      min: expMin,
      max: expMax
    },
    experienceRequired: experienceRequiredCompat,
    experience_required: experienceRequiredCompat,

    visibility,
    publishTo,
    publishToVendorPortal: publishTo.vendorPortal,
    publishToClientPortal: publishTo.clientPortal,
    publishToWhatsApp: publishTo.whatsApp,
    publishToLinkedIn: publishTo.linkedIn,
    publishToInternalRecruiters: publishTo.internalRecruiters,
    publishToEmailCampaign: publishTo.emailCampaign,

    budget,
    financials,
    pricing_data,
    adjustedBudget: financials.platformMargin,

    source: data.source || data.createdVia?.toLowerCase() || 'crm',
    createdVia: data.createdVia || (data.source === 'os' ? 'OS' : 'CRM'),

    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export class RequirementService {
  async getById(id: string, userContext?: any) {
    const requirement = await requirementRepository.findById(id);
    if (!requirement) return null;
    const normalized = normalizeRequirementData(requirement, userContext);
    if (userContext) {
      if (userContext.userId === "executive-root") return normalized;
      if (userContext.organizationId && normalized.organizationId && normalized.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && normalized.clientId !== userContext.clientId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && normalized.status !== "open" && normalized.status !== "broadcast" && normalized.broadcast !== true) {
        return null;
      }
    }
    return normalized;
  }

  async list(userContext?: any) {
    let list = await requirementRepository.findAll();
    list = list.map((item: any) => normalizeRequirementData(item, userContext));
    if (userContext) {
      list = list.filter((item: any) => {
        if (userContext.userId === "executive-root") return true;
        
        // Tenant isolation
        if (userContext.organizationId && item.organizationId && item.organizationId !== userContext.organizationId) {
          return false;
        }

        // Role/Workspace-specific filtering
        if (userContext.workspace === "Client" && userContext.clientId) {
          return item.clientId === userContext.clientId || item.companyId === userContext.clientId || item.accountId === userContext.clientId;
        }

        if (userContext.workspace === "Vendor") {
          return item.status === "open" || item.broadcast === true || item.status === "broadcast";
        }

        return true;
      });
    }
    const compareDates = (aVal: any, bVal: any): number => {
      const getMs = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'string') {
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        }
        if (val instanceof Date) {
          return val.getTime();
        }
        if (val && typeof val.toDate === 'function') {
          try {
            return val.toDate().getTime();
          } catch {
            // ignore
          }
        }
        if (val && typeof val.seconds === 'number') {
          return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
        }
        if (val && typeof val._seconds === 'number') {
          return val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000);
        }
        if (typeof val === 'number') {
          return val;
        }
        return 0;
      };
      return getMs(bVal) - getMs(aVal);
    };

    return list.sort((a: any, b: any) => compareDates(a.createdAt, b.createdAt));
  }

  async create(data: any, performedBy: string = 'System', userContext?: any) {
    const normalized = normalizeRequirementData({
      ...data,
      submissionsCount: data.submissionsCount || 0
    }, userContext);

    const created = await requirementRepository.create(normalized, performedBy);

    await DomainEventPublisher.publishDomainEvent({
      type: "REQUIREMENT_CREATED",
      aggregateType: "Requirement",
      aggregateId: created.id,
      organizationId: created.organizationId || "bootstrap-org",
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: userContext?.workspace === "Client" ? "OS" : "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const existing = await requirementRepository.findById(id);
    const merged = { ...(existing || {}), ...updates };
    const normalized = normalizeRequirementData(merged);
    
    await requirementRepository.update(id, normalized, performedBy);
    const updated = await requirementRepository.findById(id);

    if (updated) {
      await DomainEventPublisher.publishDomainEvent({
        type: "REQUIREMENT_UPDATED",
        aggregateType: "Requirement",
        aggregateId: id,
        organizationId: updated.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: updated
      });

      // Broadcast event
      if (
        (updates.status === "open" || updates.status === "broadcast" || updates.broadcast === true) &&
        (!existing || (existing.status !== "open" && existing.status !== "closed"))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_BROADCAST",
          aggregateType: "Requirement",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Closed event
      if (updates.status === "closed" && (!existing || existing.status !== "closed")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_CLOSED",
          aggregateType: "Requirement",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Cancelled event
      if (updates.status === "cancelled" && (!existing || existing.status !== "cancelled")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "REQUIREMENT_CANCELLED",
          aggregateType: "Requirement",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }
    }
  }

  async delete(id: string, performedBy: string = 'System') {
    const existing = await requirementRepository.findById(id);
    await requirementRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "REQUIREMENT_CANCELLED",
        aggregateType: "Requirement",
        aggregateId: id,
        organizationId: existing.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: { id, deleted: true }
      });
    }
  }
}

export const requirementService = new RequirementService();

