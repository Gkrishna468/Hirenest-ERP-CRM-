import { clientRepository } from "../repositories/ClientRepository";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import * as crypto from "crypto";

export class ClientService {
  async getById(id: string, userContext?: any) {
    const client = await clientRepository.findById(id);
    if (!client) return null;
    
    if (userContext) {
      if (userContext.userId === "executive-root") return client;
      if (userContext.organizationId && client.organizationId && client.organizationId !== userContext.organizationId) {
        return null;
      }
      if (userContext.workspace === "Client" && userContext.clientId && client.id !== userContext.clientId) {
        return null;
      }
    }
    return client;
  }

  async list(userContext?: any) {
    const firebaseClients = await clientRepository.findAll();
    const users = await clientRepository.listUsers();
    
    const orgNames = new Map<string, string>();
    users.forEach((data: any) => {
      if (data.organizationId) {
        let name = data.companyName;
        if (!name && data.email) {
           const domain = data.email.split('@')[1];
           if (domain && domain !== 'gmail.com' && domain !== 'yahoo.com' && domain !== 'outlook.com') {
             name = domain.split('.')[0];
             name = name.charAt(0).toUpperCase() + name.slice(1);
           }
        }
        if (name) orgNames.set(data.organizationId, name);
      }
    });

    const reqsDocs = await clientRepository.listRequirements();
    const reqsClientsMap = new Map<string, any>();
    reqsDocs.forEach((data: any) => {
      const clientId = data.clientId || data.client_id;
      let clientName = data.clientName || data.client_name;
      if (!clientName && clientId) {
        clientName = orgNames.get(clientId) || `Client ${clientId.slice(-5)}`;
      }
      if (clientId && !reqsClientsMap.has(clientId)) {
        reqsClientsMap.set(clientId, {
          id: clientId,
          company: clientName,
          name: clientName,
          email: '',
          phone: '',
          location: '',
          industry: '',
          budget: 'Medium',
          contactPerson: '',
          website: '',
          clientCode: clientId,
          notes: 'Extracted from Requirements (OS)',
          userId: '',
          companyId: clientId,
          organizationId: data.organizationId || "bootstrap-org",
          createdAt: data.createdAt || data.created_at || new Date().toISOString(),
          updatedAt: data.updatedAt || data.updated_at || new Date().toISOString(),
          source: 'os'
        });
      }
    });

    const extractedClients = Array.from(reqsClientsMap.values());
    const existingIds = new Set(firebaseClients.map(c => c.id));
    const newExtracted = extractedClients.filter(c => !existingIds.has(c.id));
    const combined = [...firebaseClients, ...newExtracted];
    const seen = new Set<string>();
    
    let unique = combined.filter(c => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    // Apply context-based filtering
    if (userContext) {
      unique = unique.filter(c => {
        if (userContext.userId === "executive-root") return true;
        
        // Tenant isolation
        if (userContext.organizationId && c.organizationId && c.organizationId !== userContext.organizationId) {
          return false;
        }

        // Role-based filtering
        if (userContext.workspace === "Client" && userContext.clientId) {
          return c.id === userContext.clientId || c.companyId === userContext.clientId;
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

    return unique.sort((a: any, b: any) => compareDates(a.createdAt, b.createdAt));
  }

  async create(data: any, performedBy: string = 'System', userContext?: any) {
    const id = data.id || crypto.randomUUID();
    const client: any = {
      ...data,
      id,
      company: data.company || '',
      name: data.name || '',
      organizationId: userContext?.organizationId || data.organizationId || "bootstrap-org",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await clientRepository.create(client, performedBy);

    await DomainEventPublisher.publishDomainEvent({
      type: "CLIENT_CREATED",
      aggregateType: "Client",
      aggregateId: id,
      organizationId: created.organizationId || data.organizationId || "bootstrap-org",
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
    const existing = await clientRepository.findById(id);
    await clientRepository.update(id, cleanUpdates, performedBy);
    const updated = await clientRepository.findById(id);

    if (updated) {
      await DomainEventPublisher.publishDomainEvent({
        type: "CLIENT_UPDATED",
        aggregateType: "Client",
        aggregateId: id,
        organizationId: updated.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: updated
      });

      if (updates.status === "approved" && (!existing || existing.status !== "approved")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CLIENT_APPROVED",
          aggregateType: "Client",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }

      if ((updates.status === "deactivated" || updates.status === "inactive") && (!existing || (existing.status !== "deactivated" && existing.status !== "inactive"))) {
        await DomainEventPublisher.publishDomainEvent({
          type: "CLIENT_DEACTIVATED",
          aggregateType: "Client",
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
    const existing = await clientRepository.findById(id);
    await clientRepository.archive(id, performedBy);
    if (existing) {
      await DomainEventPublisher.publishDomainEvent({
        type: "CLIENT_DEACTIVATED",
        aggregateType: "Client",
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

  async getClient360(clientId: string, userContext?: any) {
    const db = getAdminDb();
    const client = await this.getById(clientId, userContext);
    if (!client) {
      // Try finding by name or companyId as fallback
      const allClients = await this.list(userContext);
      const found = allClients.find((c: any) => c.id === clientId || c.name === clientId || c.company === clientId || c.clientCode === clientId);
      if (!found) return null;
      return this.buildClient360Data(found, db, userContext);
    }
    return this.buildClient360Data(client, db, userContext);
  }

  private async buildClient360Data(client: any, db: any, userContext?: any) {
    const clientId = client.id;
    const clientName = client.company || client.name || "";

    // 1. Requirements for this client
    const reqsSnapshot = await db.collection("requirements").get();
    const clientRequirements: any[] = [];
    const requirementIds: string[] = [];

    reqsSnapshot.forEach((doc: any) => {
      const data = { id: doc.id, ...doc.data() };
      const matchesClient = data.clientId === clientId || 
                            data.client_id === clientId || 
                            (clientName && (data.clientName === clientName || data.client_name === clientName));
      if (matchesClient) {
        clientRequirements.push(data);
        requirementIds.push(doc.id);
      }
    });

    // 2. Submissions for these requirements
    const submissionsSnapshot = await db.collection("submissions").get();
    const clientSubmissions: any[] = [];
    const reqSubmissionsMap = new Map<string, any[]>();

    submissionsSnapshot.forEach((doc: any) => {
      const data = { id: doc.id, ...doc.data() };
      const matchesJob = data.jobId && requirementIds.includes(data.jobId);
      const matchesClient = data.clientId === clientId || (clientName && data.clientName === clientName);

      if (matchesJob || matchesClient) {
        clientSubmissions.push(data);
        const jId = data.jobId || "unassigned";
        if (!reqSubmissionsMap.has(jId)) {
          reqSubmissionsMap.set(jId, []);
        }
        reqSubmissionsMap.get(jId)!.push(data);
      }
    });

    // 3. Placements / Deals
    const dealsSnapshot = await db.collection("placements").get();
    const clientDeals: any[] = [];
    dealsSnapshot.forEach((doc: any) => {
      const data = { id: doc.id, ...doc.data() };
      const matchesClient = data.clientId === clientId || (clientName && data.clientName === clientName);
      const matchesJob = data.jobId && requirementIds.includes(data.jobId);
      if (matchesClient || matchesJob) {
        clientDeals.push(data);
      }
    });

    // 4. Contacts
    const contactsSnapshot = await db.collection("contacts").get();
    const clientContacts: any[] = [];
    contactsSnapshot.forEach((doc: any) => {
      const data = { id: doc.id, ...doc.data() };
      if (data.clientId === clientId || data.companyId === clientId || (clientName && (data.company === clientName || data.clientName === clientName))) {
        clientContacts.push(data);
      }
    });

    // 5. Commercials
    let clientCommercials: any[] = [];
    const isVendor = userContext && userContext.workspace === "Vendor";
    if (!isVendor) {
      try {
        const commSnapshot = await db.collection("commercials").where("clientId", "==", clientId).get();
        commSnapshot.forEach((doc: any) => {
          clientCommercials.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn("[ClientService.getClient360] Failed fetching commercials:", err);
      }
    }

    // 6. Pipeline calculation
    let countSubmitted = 0;
    let countClientReview = 0;
    let countShortlisted = 0;
    let countInterview = 0;
    let countSelected = 0;
    let countOffer = 0;
    let countJoined = 0;
    let countPlaced = 0;

    clientSubmissions.forEach((s: any) => {
      const stage = (s.status || s.stage || "").toLowerCase();
      countSubmitted++;

      if (stage === "review" || stage === "client_review" || stage === "under_review" || stage === "evaluating") {
        countClientReview++;
      } else if (stage === "shortlisted" || stage === "shortlist") {
        countShortlisted++;
      } else if (stage === "interview" || stage === "interviewing" || stage === "scheduled" || stage === "round1" || stage === "round2") {
        countInterview++;
      } else if (stage === "selected" || stage === "selection" || stage === "cleared") {
        countSelected++;
      } else if (stage === "offer" || stage === "offered" || stage === "offer_released") {
        countOffer++;
      } else if (stage === "joined" || stage === "joining") {
        countJoined++;
      } else if (stage === "placed" || stage === "hired" || stage === "placement") {
        countPlaced++;
      }
    });

    // Also include direct placements count
    clientDeals.forEach((d: any) => {
      const status = (d.status || d.stage || "").toLowerCase();
      if (status === "placed" || status === "hired" || status === "won" || status === "closed won" || d.payment_received) {
        if (countPlaced === 0) countPlaced++;
      }
    });

    // 7. Commercial Summary & Realized Revenue
    const activeReqs = clientRequirements.filter((r: any) => r.status !== "closed" && r.status !== "filled");
    const openPositionsCount = activeReqs.reduce((sum: number, r: any) => sum + (Number(r.openings) || Number(r.positions) || 1), 0);

    // Explicit Commercial State Calculation (Audit Rule 13 & 16)
    const pipelineValue = clientRequirements.reduce((sum: number, r: any) => {
      const budget = Number(r.budget) || Number(r.adjustedBudget) || 100000;
      const openings = Number(r.openings) || Number(r.positions) || 1;
      return sum + (budget * openings);
    }, 0);

    const contractedValue = clientCommercials
      .filter((c: any) => c.status === "approved" || c.approvalStatus === "approved")
      .reduce((sum: number, c: any) => sum + (Number(c.clientBillingRate ? c.clientBillingRate * 12 * (c.positions || 1) : c.placementRevenue || 0)), 0);

    const placedValue = clientDeals
      .filter((d: any) => d.status === "placed" || d.status === "hired" || d.stage === "Won" || d.stage === "Closed Won" || d.payment_received)
      .reduce((sum: number, d: any) => sum + (Number(d.revenue_amount) || Number(d.revenueAmount) || Number(d.finalCtc ? d.finalCtc * 0.0833 : 0)), 0);

    const billableValue = clientDeals
      .filter((d: any) => d.status === "placed" || d.status === "hired" || d.isBillable || d.payment_received)
      .reduce((sum: number, d: any) => sum + (Number(d.revenue_amount) || Number(d.revenueAmount) || 0), 0);

    const invoicedValue = clientDeals
      .filter((d: any) => d.isInvoiced || d.status === "invoiced" || d.payment_received)
      .reduce((sum: number, d: any) => sum + (Number(d.revenue_amount) || Number(d.revenueAmount) || 0), 0);

    const collectedValue = clientDeals
      .filter((d: any) => d.payment_received || d.status === "paid")
      .reduce((sum: number, d: any) => sum + (Number(d.revenue_amount) || Number(d.revenueAmount) || 0), 0);

    // Unbilled Commercials = Billable Value - Invoiced Value (Rule 17: NEVER pipeline minus invoiced)
    const unbilledValue = Math.max(0, billableValue - invoicedValue);

    const realizedRevenue = collectedValue > 0 ? collectedValue : placedValue;
    const outstandingCommercialValue = unbilledValue > 0 ? unbilledValue : Math.max(0, placedValue - collectedValue);

    // 8. Enriched Requirements
    const enrichedRequirements = clientRequirements.map((r: any) => {
      const reqSubs = reqSubmissionsMap.get(r.id) || [];
      const shortlists = reqSubs.filter((s: any) => ["shortlisted", "interview", "selected", "offer", "placed", "hired"].includes((s.status || "").toLowerCase())).length;
      const interviews = reqSubs.filter((s: any) => ["interview", "selected", "offer", "placed", "hired"].includes((s.status || "").toLowerCase())).length;
      const selections = reqSubs.filter((s: any) => ["selected", "offer", "placed", "hired"].includes((s.status || "").toLowerCase())).length;
      const placements = reqSubs.filter((s: any) => ["placed", "hired"].includes((s.status || "").toLowerCase())).length;

      return {
        ...r,
        submissionsCount: reqSubs.length,
        shortlistedCount: shortlists,
        interviewCount: interviews,
        selectionCount: selections,
        placementCount: placements,
      };
    });

    // 9. Client Timeline from system_events
    let clientTimeline: any[] = [];
    try {
      const eventsSnap = await db.collection("system_events")
        .limit(100)
        .get();

      eventsSnap.forEach((doc: any) => {
        const ev = { id: doc.id, ...doc.data() };
        const matchesClient = ev.aggregateId === clientId || 
                              ev.entityId === clientId || 
                              (ev.payload && (ev.payload.clientId === clientId || ev.payload.clientName === clientName));
        const matchesReq = requirementIds.includes(ev.aggregateId) || 
                           requirementIds.includes(ev.entityId) || 
                           (ev.payload && requirementIds.includes(ev.payload.jobId || ev.payload.requirementId));

        if (matchesClient || matchesReq) {
          clientTimeline.push(ev);
        }
      });

      clientTimeline.sort((a: any, b: any) => {
        const tA = new Date(a.timestamp || a.createdAt || 0).getTime();
        const tB = new Date(b.timestamp || b.createdAt || 0).getTime();
        return tB - tA;
      });
    } catch (err) {
      console.warn("[ClientService.getClient360] Timeline fetch error:", err);
    }

    return {
      client: {
        id: client.id,
        name: clientName,
        company: clientName,
        clientCode: client.clientCode || `CLI-${client.id.slice(0, 6).toUpperCase()}`,
        industry: client.industry || "Information Technology & Services",
        location: client.location || "Hyderabad / Bangalore",
        accountOwner: client.bdmOwner || client.contactPerson || client.owner || "Gopal Krishna",
        status: client.status || "Active",
        website: client.website || "",
        contactEmail: client.contactEmail || client.email || "",
        contactPhone: client.contactPhone || client.phone || "",
        commercialTerms: client.commercialTerms || "Net 45 / Standard 8.33%",
        notes: client.notes || "",
        createdAt: client.createdAt || new Date().toISOString(),
        updatedAt: client.updatedAt || new Date().toISOString(),
      },
      summary: {
        activeRequirements: activeReqs.length,
        openPositions: openPositionsCount,
        totalSubmissions: clientSubmissions.length,
        shortlisted: countShortlisted,
        interviews: countInterview,
        selections: countSelected,
        placements: countPlaced,
        revenuePotential: isVendor ? 0 : pipelineValue,
        pipelineValue: isVendor ? 0 : pipelineValue,
        contractedValue: isVendor ? 0 : contractedValue,
        placedValue: isVendor ? 0 : placedValue,
        billableValue: isVendor ? 0 : billableValue,
        invoicedValue: isVendor ? 0 : invoicedValue,
        collectedValue: isVendor ? 0 : collectedValue,
        unbilledValue: isVendor ? 0 : unbilledValue,
        realizedRevenue: isVendor ? 0 : realizedRevenue,
        outstandingCommercialValue: isVendor ? 0 : outstandingCommercialValue,
      },
      contacts: clientContacts,
      requirements: enrichedRequirements,
      pipeline: {
        submitted: countSubmitted,
        clientReview: countClientReview,
        shortlisted: countShortlisted,
        interview: countInterview,
        selected: countSelected,
        offer: countOffer,
        joined: countJoined,
        placed: countPlaced,
      },
      commercials: isVendor ? [] : clientCommercials,
      deals: isVendor ? [] : clientDeals,
      timeline: clientTimeline.slice(0, 30),
    };
  }
}

export const clientService = new ClientService();
