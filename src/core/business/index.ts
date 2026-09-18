/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core Shared Business Services
 * Single Source of Truth for CRM and OS Business Logic
 * 
 * Core Services:
 * - ClientService
 * - RequirementService
 * - VendorService
 * - RecruiterService
 * - CandidateService
 * - Candidate360Service
 * - SubmissionService
 * - InterviewService
 * - OfferService
 * - PlacementService
 * - SLAService
 * - BudgetService
 * - PerformanceService
 */

import {
  CoreClient,
  CoreRequirement,
  CoreVendor,
  CoreCandidate,
  CoreSubmission,
  CorePlacement,
  AuthUserContext
} from '../types';

export class BudgetService {
  /**
   * Domestic Operations default to INR ₹, US Staffing Wing converts to USD $
   */
  static formatCurrency(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return currency === 'INR' ? '₹0' : '$0';
    }

    if (currency === 'INR') {
      // In LPA or exact figure
      if (amount >= 100000) {
        const lpa = (amount / 100000).toFixed(1).replace(/\.0$/, '');
        return `₹${lpa} LPA`;
      }
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    } else {
      // USD format
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    }
  }

  static convertInrToUsd(inrAmount: number, exchangeRate: number = 83.5): number {
    return Math.round(inrAmount / exchangeRate);
  }

  static convertUsdToInr(usdAmount: number, exchangeRate: number = 83.5): number {
    return Math.round(usdAmount * exchangeRate);
  }
}

export class RequirementService {
  static generateCanonicalId(index?: number): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HN-REQ-${year}-${index ? String(index).padStart(4, '0') : rand}`;
  }

  static calculateFinancials(
    budgetMin: number,
    budgetMax: number,
    currency: 'INR' | 'USD' = 'INR',
    placementFeePercentage: number = 8.33
  ) {
    const avgBudget = (budgetMin + budgetMax) / 2;
    const projectedRevenue = Math.round((avgBudget * placementFeePercentage) / 100);
    const vendorCost = Math.round(projectedRevenue * 0.3); // 30% standard vendor share
    const platformMargin = projectedRevenue - vendorCost;

    return {
      currency,
      budgetMin,
      budgetMax,
      displayBudget: `${BudgetService.formatCurrency(budgetMin, currency)} – ${BudgetService.formatCurrency(budgetMax, currency)}`,
      clientBilling: avgBudget,
      vendorCost,
      platformMargin,
      projectedRevenue
    };
  }
}

export class CandidateService {
  static generateCanonicalId(index?: number): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HN-CAN-${year}-${index ? String(index).padStart(4, '0') : rand}`;
  }
}

export class Candidate360Service {
  static synthesizeProfile(candidate: CoreCandidate, submissions: CoreSubmission[] = []) {
    const totalSubmissions = submissions.length;
    const activeSubmissions = submissions.filter(s => !['rejected', 'withdrawn'].includes(s.status));
    const interviews = submissions.filter(s => ['interview', 'offer', 'joined'].includes(s.status));
    const offers = submissions.filter(s => ['offer', 'joined'].includes(s.status));

    const conversionRate = totalSubmissions > 0 ? Math.round((interviews.length / totalSubmissions) * 100) : 0;

    return {
      candidate,
      metrics: {
        totalSubmissions,
        activeSubmissionsCount: activeSubmissions.length,
        interviewsScheduled: interviews.length,
        offersReceived: offers.length,
        interviewConversionRate: conversionRate
      },
      skillsSummary: candidate.skills,
      readinessState: candidate.status === 'available' ? 'Immediate Joiner' : 'In Active Process'
    };
  }
}

export class SLAService {
  static checkFeedbackSla(submittedAt: string): { daysElapsed: number; slaState: 'ON_TRACK' | 'REMINDER_DUE' | 'ESCALATION' | 'FOUNDER_ALERT' } {
    const submittedTime = new Date(submittedAt).getTime();
    const now = Date.now();
    const daysElapsed = Math.floor((now - submittedTime) / (1000 * 60 * 60 * 24));

    if (daysElapsed >= 10) {
      return { daysElapsed, slaState: 'FOUNDER_ALERT' };
    }
    if (daysElapsed >= 7) {
      return { daysElapsed, slaState: 'ESCALATION' };
    }
    if (daysElapsed >= 3) {
      return { daysElapsed, slaState: 'REMINDER_DUE' };
    }
    return { daysElapsed, slaState: 'ON_TRACK' };
  }
}

export class PerformanceService {
  static calculateVendorScore(vendor: Partial<CoreVendor['performance']>): number {
    const profiles = vendor.profilesShared || 1;
    const shortlists = vendor.shortlistedCount || 0;
    const joins = vendor.joiningsCount || 0;
    const sla = vendor.slaCompliancePercent || 80;

    const shortlistRatio = Math.min(100, (shortlists / profiles) * 100);
    const joinRatio = Math.min(100, (joins / profiles) * 300);

    const weightedScore = Math.round((shortlistRatio * 0.4) + (joinRatio * 0.35) + (sla * 0.25));
    return Math.max(10, Math.min(100, weightedScore));
  }
}

export class ClientService {
  static updateHiringMetrics(client: CoreClient, requirements: CoreRequirement[], placements: CorePlacement[]): CoreClient {
    const activeReqs = requirements.filter(r => ['open', 'active', 'in_progress'].includes(r.status));
    const totalPositions = requirements.reduce((acc, r) => acc + (r.openings || 1), 0);
    const placedPositions = placements.length;
    const openPositions = Math.max(0, totalPositions - placedPositions);
    const fillRate = totalPositions > 0 ? Math.round((placedPositions / totalPositions) * 100) : 0;
    const pipelineValue = activeReqs.reduce((acc, r) => acc + (r.financials?.projectedRevenue || 0), 0);
    const realizedRevenue = placements.reduce((acc, p) => acc + (p.grossMargin || 0), 0);

    return {
      ...client,
      hiringProgress: {
        activeRequirementsCount: activeReqs.length,
        totalPositions,
        openPositions,
        inInterviewCount: requirements.filter(r => r.status === 'in_progress').length,
        offeredCount: 0,
        placedCount: placedPositions,
        fillRate,
        averageTimeToFillDays: 18,
        pipelineValue,
        realizedRevenue
      },
      updatedAt: new Date().toISOString()
    };
  }
}
