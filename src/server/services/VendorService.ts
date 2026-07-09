import { vendorRepository } from "../repositories/VendorRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class VendorService {
  async getById(id: string, userContext?: any) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor) return null;
    if (userContext) {
      if (userContext.userId === "executive-root") return vendor;
      if (userContext.organizationId && vendor.organizationId && vendor.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Vendor" && userContext.vendorId && vendor.id !== userContext.vendorId) {
        return null;
      }
    }
    return vendor;
  }

  async list(userContext?: any) {
    const db = getAdminDb();
    
    // 1. Fetch existing vendors from the database
    const firebaseVendors = await vendorRepository.findAll().catch(err => {
      console.error("Failed to find all vendors:", err);
      return [] as any[];
    });

    // 2. Query users who are vendor admins
    const vendorUsers: any[] = [];
    try {
      const usersSnap = await db.collection("users").get();
      usersSnap.forEach(doc => {
        const data = doc.data();
        if (data.role && data.role.toLowerCase().includes("vendor")) {
          vendorUsers.push({ id: doc.id, ...data });
        }
      });
    } catch (err) {
      console.error("Failed to list vendor users:", err);
    }

    // 3. Query candidates to extract vendors referenced in sourceOrganizations or vendorId
    const candidateDocs: any[] = [];
    try {
      const candidatesSnap = await db.collection("candidates").get();
      candidatesSnap.forEach(doc => {
        candidateDocs.push({ id: doc.id, ...doc.data() });
      });
    } catch (err) {
      console.error("Failed to list candidates for vendor extraction:", err);
    }

    const resolveSpecialOrgName = (orgId: string, fallbackName?: string): string => {
      if (orgId === 'DIRECT_CAREERS') return 'Direct Careers';
      if (orgId === 'ORG-GLOBAL-HQ') return 'HireNest HQ';
      if (orgId === 'ORG-1w4v1vb57') return 'Vendor Corp';
      if (orgId === 'ORG-ta32b9b9t') return 'Shreeji Consulting';
      if (orgId === 'ORG-y0kbdp8oh') return 'Worknexa Inf';
      if (orgId === 'ORG-xezyl6k71') return 'Tiein';
      if (fallbackName && fallbackName !== orgId && !fallbackName.startsWith('ORG-')) return fallbackName;
      if (orgId.startsWith('ORG-')) {
        const sub = orgId.replace('ORG-', '');
        return `Vendor ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
      }
      return orgId;
    };

    const parseCompany = (user: any) => {
      const orgId = user.organizationId || user.uid || user.id;
      if (orgId && (orgId === 'DIRECT_CAREERS' || orgId === 'ORG-GLOBAL-HQ' || orgId === 'ORG-1w4v1vb57' || orgId === 'ORG-ta32b9b9t' || orgId === 'ORG-y0kbdp8oh' || orgId === 'ORG-xezyl6k71')) {
        return resolveSpecialOrgName(orgId);
      }
      if (user.companyName) return user.companyName;
      if (user.company) return user.company;
      if (user.email) {
        const [local, domain] = user.email.split('@');
        if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain.toLowerCase())) {
          const part = domain.split('.')[0];
          return part.charAt(0).toUpperCase() + part.slice(1);
        }
        if (local) {
          const parts = local.split(/[._-]/);
          const cleanParts = parts.filter((p: string) => !['director', 'info', 'contact', 'sales', 'admin', 'vendor', 'support', 'mail'].includes(p.toLowerCase()));
          if (cleanParts.length > 0) {
            return cleanParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          }
          return local.charAt(0).toUpperCase() + local.slice(1);
        }
      }
      return 'Vendor Partner';
    };

    const extractedMap = new Map<string, any>();

    // Process vendor users
    vendorUsers.forEach(u => {
      const orgId = u.organizationId || u.uid || u.id;
      if (!orgId) return;
      
      const compName = parseCompany(u);
      extractedMap.set(orgId, {
        id: orgId,
        name: u.name || compName,
        company: compName,
        email: u.email || '',
        phone: u.phone || '',
        country: u.country || 'India',
        state: u.state || '',
        city: u.city || '',
        address: u.address || '',
        pan: u.pan || '',
        gst: u.gst || '',
        sla: u.sla || '24 hours',
        source: 'crm',
        type: 'vendor',
        vendorCode: u.vendorCode || `HN-VND-${orgId.slice(-6).toUpperCase()}`,
        organizationId: orgId,
        tier: u.tier || 'Tier 1',
        createdAt: u.createdAt || new Date().toISOString(),
        updatedAt: u.updatedAt || new Date().toISOString()
      });
    });

    // Process candidate references
    candidateDocs.forEach(c => {
      const orgs = c.sourceOrganizations || [];
      orgs.forEach((orgId: string) => {
        if (!orgId || extractedMap.has(orgId)) return;
        
        const compName = resolveSpecialOrgName(orgId);
        
        extractedMap.set(orgId, {
          id: orgId,
          name: compName,
          company: compName,
          email: '',
          phone: '',
          country: 'India',
          state: '',
          city: '',
          address: '',
          pan: '',
          gst: '',
          sla: '24 hours',
          source: 'crm',
          type: 'vendor',
          vendorCode: `HN-VND-${orgId.slice(-6).toUpperCase()}`,
          organizationId: orgId,
          tier: 'Tier 1',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString()
        });
      });

      const vId = c.vendorId;
      if (vId && !extractedMap.has(vId)) {
        const compName = resolveSpecialOrgName(vId, c.vendorName);
        extractedMap.set(vId, {
          id: vId,
          name: compName,
          company: compName,
          email: '',
          phone: '',
          country: 'India',
          state: '',
          city: '',
          address: '',
          pan: '',
          gst: '',
          sla: '24 hours',
          source: 'crm',
          type: 'vendor',
          vendorCode: `HN-VND-${vId.slice(-6).toUpperCase()}`,
          organizationId: vId,
          tier: 'Tier 1',
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString()
        });
      }
    });

    // Merge collections
    const combined = [...firebaseVendors];
    for (const [vId, vDoc] of extractedMap.entries()) {
      if (!combined.some(v => v.id === vId)) {
        combined.push(vDoc);
      }
    }

    // Apply filtering
    let filtered = combined;
    if (userContext) {
      filtered = combined.filter(v => {
        // Executive / Admin / Founder sees all vendors
        if (
          userContext.userId === "executive-root" ||
          userContext.role === "admin" ||
          userContext.role === "founder" ||
          userContext.workspace === "Executive"
        ) {
          return true;
        }
        
        // Vendor workspace is isolated to their own vendorId
        if (userContext.workspace === "Vendor" && userContext.vendorId) {
          return v.id === userContext.vendorId;
        }

        // Standard tenant isolation for other roles
        if (userContext.organizationId && v.organizationId && v.organizationId !== userContext.organizationId) {
          return false;
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

    return filtered.sort((a: any, b: any) => compareDates(a.createdAt, b.createdAt));
  }

  async create(data: any, performedBy: string = 'System', userContext?: any) {
    const id = data.id || crypto.randomUUID();
    const item: any = {
      ...data,
      id,
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await vendorRepository.create(item, performedBy);

    await DomainEventPublisher.publishDomainEvent({
      type: "VENDOR_CREATED",
      aggregateType: "Vendor",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || id,
      actorId: performedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: "CRM",
      sourceWorkspace: userContext?.workspace || "Admin",
      payload: created
    });

    return created;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const cleanUpdates: any = { ...updates, updatedAt: new Date().toISOString() };
    const existing = await vendorRepository.findById(id);
    await vendorRepository.update(id, cleanUpdates, performedBy);
    const updated = await vendorRepository.findById(id);

    if (updated) {
      // Trigger VENDOR_SLA_UPDATED if SLA terms or metrics changed
      if (
        (updates.sla !== undefined && (!existing || existing.sla !== updates.sla)) ||
        (updates.slaResponseTime !== undefined && (!existing || existing.slaResponseTime !== updates.slaResponseTime))
      ) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_SLA_UPDATED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger VENDOR_APPROVED
      if (updates.status === "approved" && (!existing || existing.status !== "approved")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_APPROVED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger VENDOR_ONBOARDED
      if (updates.status === "onboarded" && (!existing || existing.status !== "onboarded")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_ONBOARDED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      // Trigger VENDOR_MONTHLY_VALIDATED if compliance checked or lastValidationTime changed
      if (updates.lastValidationTime !== undefined && (!existing || existing.lastValidationTime !== updates.lastValidationTime)) {
        await DomainEventPublisher.publishDomainEvent({
          type: "VENDOR_MONTHLY_VALIDATED",
          aggregateType: "Vendor",
          aggregateId: id,
          organizationId: updated.organizationId || id,
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
    await vendorRepository.archive(id, performedBy);
  }
}

export const vendorService = new VendorService();
