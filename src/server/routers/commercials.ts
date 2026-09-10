/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from "express";
import { getAdminDb } from "../utils/firebaseAdmin";
import { DomainEventPublisher } from "../events/DomainEventPublisher";
import { CommercialCalculationService } from "../services/CommercialCalculationService";
import * as crypto from "crypto";

export const commercialsRouter = Router();

// Calculate on the fly (Deterministic commercial engine)
commercialsRouter.post("/calculate", (req: any, res: any) => {
  try {
    const { modelType, ...params } = req.body;
    if (modelType === "permanent") {
      const result = CommercialCalculationService.calculatePermanentPlacement({
        candidateCtc: params.candidateCtc || params.annualCtc,
        feePercent: params.feePercent,
        fixedFee: params.fixedFee,
        feeType: params.feeType,
        gstPercentage: params.gstPercentage,
        replacementGuaranteeDays: params.replacementGuaranteeDays,
      });
      return res.status(200).json(result);
    } else {
      const result = CommercialCalculationService.calculateStaffingCommercials({
        clientBillingRate: params.clientBillingRate,
        vendorPayRate: params.vendorPayRate || params.resourceCost,
        billingFrequency: params.billingFrequency,
        positions: params.positions,
        statutoryExpenses: params.statutoryExpenses,
        gstPercentage: params.gstPercentage,
        paymentTermsDays: params.paymentTermsDays,
      });
      return res.status(200).json(result);
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// List commercials
commercialsRouter.get("/", async (req: any, res: any) => {
  try {
    const userContext = req.user;
    if (userContext && userContext.workspace === "Vendor") {
      return res.status(403).json({ error: "Access denied: Vendors cannot view commercial details" });
    }

    const { clientId, requirementId, candidateId } = req.query;
    const db = getAdminDb();
    let query: any = db.collection("commercials");

    if (clientId) {
      query = query.where("clientId", "==", clientId);
    }
    if (requirementId) {
      query = query.where("requirementId", "==", requirementId);
    }

    const snapshot = await query.get();
    const items: any[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (!candidateId || data.candidateId === candidateId) {
        items.push({ id: doc.id, ...data });
      }
    });

    res.status(200).json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new commercial record (Version 1)
commercialsRouter.post("/", async (req: any, res: any) => {
  try {
    const userContext = req.user;
    if (userContext && userContext.workspace === "Vendor") {
      return res.status(403).json({ error: "Access denied: Vendors cannot create commercials" });
    }

    const db = getAdminDb();
    const payload = req.body.payload || req.body;
    const id = payload.id || crypto.randomUUID();

    let computedBreakdown: any = {};
    if (payload.serviceType === "Permanent Placement" || payload.serviceType === "Direct Hire") {
      computedBreakdown = CommercialCalculationService.calculatePermanentPlacement({
        candidateCtc: payload.candidateCtc || 0,
        feePercent: payload.feePercent || 8.33,
        fixedFee: payload.fixedFee,
        feeType: payload.feeType || "percentage",
      });
    } else {
      computedBreakdown = CommercialCalculationService.calculateStaffingCommercials({
        clientBillingRate: payload.clientBillingRate || 0,
        vendorPayRate: payload.vendorPayRate || 0,
        billingFrequency: payload.billingFrequency || "monthly",
        positions: payload.positions || 1,
        statutoryExpenses: payload.statutoryExpenses || 0,
      });
    }

    const initialVersion = {
      versionNumber: 1,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.email || payload.performedBy || "BDM",
      reason: payload.versionReason || "Initial commercial agreement",
      clientBillingRate: payload.clientBillingRate || 0,
      vendorPayRate: payload.vendorPayRate || 0,
      grossProfit: computedBreakdown.grossProfit ?? 0,
      grossMarginPercent: computedBreakdown.grossMarginPercent ?? null,
      markupPercent: computedBreakdown.markupPercent ?? null,
      candidateCtc: payload.candidateCtc || 0,
      feePercent: payload.feePercent || 8.33,
      placementRevenue: computedBreakdown.placementRevenue || 0,
      positions: payload.positions || 1,
      billingFrequency: payload.billingFrequency || "monthly",
      status: "pending_approval",
    };

    const docData: any = {
      id,
      organizationId: userContext?.organizationId || payload.organizationId || "bootstrap-org",
      clientId: payload.clientId || "",
      clientName: payload.clientName || "",
      requirementId: payload.requirementId || "",
      requirementTitle: payload.requirementTitle || "",
      candidateId: payload.candidateId || "",
      candidateName: payload.candidateName || "",
      submissionId: payload.submissionId || "",
      vendorId: payload.vendorId || "",
      serviceType: payload.serviceType || "Contract Staffing",
      activeVersion: 1,
      status: "pending_approval",
      approvalStatus: "pending_approval",
      clientBillingRate: payload.clientBillingRate || 0,
      vendorPayRate: payload.vendorPayRate || 0,
      grossProfit: computedBreakdown.grossProfit ?? 0,
      grossMarginPercent: computedBreakdown.grossMarginPercent ?? null,
      markupPercent: computedBreakdown.markupPercent ?? null,
      candidateCtc: payload.candidateCtc || 0,
      feePercent: payload.feePercent || 8.33,
      placementRevenue: computedBreakdown.placementRevenue || 0,
      positions: payload.positions || 1,
      billingFrequency: payload.billingFrequency || "monthly",
      notes: payload.notes || "",
      versions: [initialVersion],
      createdBy: req.user?.email || payload.performedBy || "BDM",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection("commercials").doc(id).set(docData);

    await DomainEventPublisher.publishDomainEvent({
      type: "COMMERCIAL_TERMS_CREATED",
      aggregateType: "Commercial",
      aggregateId: id,
      organizationId: docData.organizationId,
      actorId: docData.createdBy,
      actorRole: userContext?.role || "BDM",
      sourceApp: "CRM",
      sourceWorkspace: "CRM",
      payload: docData,
    });

    res.status(201).json(docData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new version for an existing commercial (Historical audit preservation)
commercialsRouter.post("/:id/version", async (req: any, res: any) => {
  try {
    const userContext = req.user;
    if (userContext && userContext.workspace === "Vendor") {
      return res.status(403).json({ error: "Access denied: Vendors cannot update commercials" });
    }

    const db = getAdminDb();
    const docRef = db.collection("commercials").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Commercial record not found" });
    }

    const currentData = docSnap.data() as any;
    const payload = req.body.payload || req.body;
    const nextVersionNum = (currentData.activeVersion || currentData.versions?.length || 1) + 1;

    let computedBreakdown: any = {};
    if (payload.serviceType === "Permanent Placement" || currentData.serviceType === "Permanent Placement") {
      computedBreakdown = CommercialCalculationService.calculatePermanentPlacement({
        candidateCtc: payload.candidateCtc ?? currentData.candidateCtc ?? 0,
        feePercent: payload.feePercent ?? currentData.feePercent ?? 8.33,
        fixedFee: payload.fixedFee ?? currentData.fixedFee,
        feeType: payload.feeType ?? currentData.feeType ?? "percentage",
      });
    } else {
      computedBreakdown = CommercialCalculationService.calculateStaffingCommercials({
        clientBillingRate: payload.clientBillingRate ?? currentData.clientBillingRate ?? 0,
        vendorPayRate: payload.vendorPayRate ?? currentData.vendorPayRate ?? 0,
        billingFrequency: payload.billingFrequency ?? currentData.billingFrequency ?? "monthly",
        positions: payload.positions ?? currentData.positions ?? 1,
        statutoryExpenses: payload.statutoryExpenses ?? currentData.statutoryExpenses ?? 0,
      });
    }

    const newVersion = {
      versionNumber: nextVersionNum,
      createdAt: new Date().toISOString(),
      createdBy: req.user?.email || payload.performedBy || "BDM",
      reason: payload.reason || payload.versionReason || `Renegotiated Commercial Terms (V${nextVersionNum})`,
      clientBillingRate: payload.clientBillingRate ?? currentData.clientBillingRate ?? 0,
      vendorPayRate: payload.vendorPayRate ?? currentData.vendorPayRate ?? 0,
      grossProfit: computedBreakdown.grossProfit ?? 0,
      grossMarginPercent: computedBreakdown.grossMarginPercent ?? null,
      markupPercent: computedBreakdown.markupPercent ?? null,
      candidateCtc: payload.candidateCtc ?? currentData.candidateCtc ?? 0,
      feePercent: payload.feePercent ?? currentData.feePercent ?? 8.33,
      placementRevenue: computedBreakdown.placementRevenue || 0,
      positions: payload.positions ?? currentData.positions ?? 1,
      billingFrequency: payload.billingFrequency ?? currentData.billingFrequency ?? "monthly",
      status: "pending_approval",
    };

    const existingVersions = Array.isArray(currentData.versions) ? currentData.versions : [];
    const updatedVersions = [...existingVersions, newVersion];

    const updates: any = {
      activeVersion: nextVersionNum,
      status: "pending_approval",
      approvalStatus: "pending_approval",
      clientBillingRate: newVersion.clientBillingRate,
      vendorPayRate: newVersion.vendorPayRate,
      grossProfit: newVersion.grossProfit,
      grossMarginPercent: newVersion.grossMarginPercent,
      markupPercent: newVersion.markupPercent,
      candidateCtc: newVersion.candidateCtc,
      feePercent: newVersion.feePercent,
      placementRevenue: newVersion.placementRevenue,
      positions: newVersion.positions,
      billingFrequency: newVersion.billingFrequency,
      versions: updatedVersions,
      notes: payload.notes || currentData.notes || "",
      updatedAt: new Date().toISOString(),
      lastModifiedBy: req.user?.email || payload.performedBy || "BDM",
    };

    await docRef.update(updates);

    await DomainEventPublisher.publishDomainEvent({
      type: "COMMERCIAL_TERMS_VERSION_CREATED",
      aggregateType: "Commercial",
      aggregateId: req.params.id,
      organizationId: currentData.organizationId || "default",
      actorId: req.user?.email || payload.performedBy || "BDM",
      actorRole: userContext?.role || "BDM",
      sourceApp: "CRM",
      sourceWorkspace: "CRM",
      payload: { ...currentData, ...updates, newVersion },
    });

    res.status(200).json({ success: true, activeVersion: nextVersionNum, commercial: { ...currentData, ...updates } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Commercial Approval endpoint
commercialsRouter.put("/:id/approve", async (req: any, res: any) => {
  try {
    const userContext = req.user;
    if (userContext && userContext.workspace === "Vendor") {
      return res.status(403).json({ error: "Access denied: Vendors cannot approve commercials" });
    }

    const db = getAdminDb();
    const docRef = db.collection("commercials").doc(req.params.id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Commercial record not found" });
    }

    const currentData = docSnap.data() as any;
    const payload = req.body;
    const isApproved = payload.decision !== "rejected";
    const status = isApproved ? "approved" : "rejected";
    const approvedBy = req.user?.email || payload.performedBy || "Admin";
    const approvedAt = new Date().toISOString();

    // Update active version's status in versions list as well
    const versions = Array.isArray(currentData.versions) ? currentData.versions.map((v: any) => {
      if (v.versionNumber === currentData.activeVersion) {
        return { ...v, status, approvedBy, approvedAt };
      }
      return v;
    }) : [];

    const updates: any = {
      status,
      approvalStatus: status,
      approvedBy,
      approvedAt,
      rejectionReason: !isApproved ? (payload.reason || "Rejected by Manager") : null,
      versions,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);

    await DomainEventPublisher.publishDomainEvent({
      type: isApproved ? "COMMERCIAL_TERMS_APPROVED" : "COMMERCIAL_TERMS_REJECTED",
      aggregateType: "Commercial",
      aggregateId: req.params.id,
      organizationId: currentData.organizationId || "default",
      actorId: approvedBy,
      actorRole: userContext?.role || "Admin",
      sourceApp: "CRM",
      sourceWorkspace: "Admin",
      payload: { ...currentData, ...updates },
    });

    res.status(200).json({ success: true, status, approvedBy, approvedAt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
