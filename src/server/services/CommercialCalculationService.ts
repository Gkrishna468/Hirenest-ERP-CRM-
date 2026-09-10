/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StaffingCommercialInputs {
  clientBillingRate: number; // e.g. 100000 (INR/month or /hr)
  vendorPayRate: number;     // e.g. 70000 (Resource/Vendor Cost)
  billingFrequency?: "monthly" | "hourly" | "annual" | "fixed";
  positions?: number;        // Number of resources (default 1)
  statutoryExpenses?: number; // Optional ESI, PF, insurance
  gstPercentage?: number;    // Optional GST (default 18%)
  paymentTermsDays?: number; // e.g. 30, 45, 60 days
}

export interface StaffingCommercialResult {
  clientBillingRate: number;
  vendorPayRate: number;
  grossProfit: number;
  grossMarginPercent: number | null; // (Billing - Cost) / Billing * 100 or null if Billing is 0
  markupPercent: number | null;      // (Billing - Cost) / Cost * 100 or null if Cost is 0
  isLossMaking: boolean;
  monthlyBilling: number;
  monthlyCost: number;
  monthlyGrossProfit: number;
  annualizedBilling: number;
  annualizedCost: number;
  annualizedGrossProfit: number;
  netProfit: number;
  netMarginPercent: number | null;
  gstAmount: number;
  totalInvoiceWithGst: number;
  billingFrequency: string;
  positions: number;
  calculationBreakdown: {
    grossProfitFormula: string;
    grossMarginFormula: string;
    markupFormula: string;
  };
}

export interface PermanentPlacementInputs {
  candidateCtc: number;      // e.g. 1200000 (Annual CTC in INR)
  feePercent?: number;       // e.g. 8.33%
  fixedFee?: number;         // Fixed placement fee
  feeType?: "percentage" | "fixed";
  gstPercentage?: number;    // default 18%
  replacementGuaranteeDays?: number; // default 90 days
}

export interface PermanentPlacementResult {
  candidateCtc: number;
  feePercent: number;
  fixedFee: number;
  feeType: "percentage" | "fixed";
  placementRevenue: number;
  gstAmount: number;
  totalInvoiceWithGst: number;
  replacementGuaranteeDays: number;
  calculationBreakdown: {
    formula: string;
    explanation: string;
  };
}

export interface PipelineValueInputs {
  opportunityValue: number;
  probabilityPercent: number; // 0 to 100
}

export interface PipelineValueResult {
  unweightedValue: number;
  probabilityPercent: number;
  weightedPipelineValue: number;
}

export class CommercialCalculationService {
  /**
   * Deterministic calculation for Contract / C2C / C2H / Staffing
   */
  static calculateStaffingCommercials(inputs: StaffingCommercialInputs): StaffingCommercialResult {
    const billing = Math.max(0, Number(inputs.clientBillingRate) || 0);
    const cost = Math.max(0, Number(inputs.vendorPayRate) || 0);
    const positions = Math.max(1, Number(inputs.positions) || 1);
    const frequency = inputs.billingFrequency || "monthly";
    const statutory = Math.max(0, Number(inputs.statutoryExpenses) || 0);
    const gstPercent = inputs.gstPercentage !== undefined ? Number(inputs.gstPercentage) : 18;

    const grossProfit = Math.round((billing - cost) * 100) / 100;
    const isLossMaking = grossProfit < 0;

    // Gross Margin % = (Gross Profit / Client Billing) * 100. If billing is 0, margin is null (N/A).
    const grossMarginPercent = billing > 0 ? Math.round(((grossProfit / billing) * 100) * 100) / 100 : null;

    // Markup % = (Gross Profit / Resource Cost) * 100. If cost is 0, markup is null (N/A - zero-cost).
    const markupPercent = cost > 0 ? Math.round(((grossProfit / cost) * 100) * 100) / 100 : null;

    // Monthly and Annual conversions
    let monthlyBilling = 0;
    let monthlyCost = 0;
    let annualizedBilling = 0;
    let annualizedCost = 0;

    if (frequency === "hourly") {
      const hoursPerMonth = 160;
      monthlyBilling = Math.round(billing * hoursPerMonth * positions);
      monthlyCost = Math.round(cost * hoursPerMonth * positions);
      annualizedBilling = Math.round(monthlyBilling * 12);
      annualizedCost = Math.round(monthlyCost * 12);
    } else if (frequency === "annual") {
      annualizedBilling = Math.round(billing * positions);
      annualizedCost = Math.round(cost * positions);
      monthlyBilling = Math.round((annualizedBilling / 12) * 100) / 100;
      monthlyCost = Math.round((annualizedCost / 12) * 100) / 100;
    } else {
      // Monthly or fixed monthly
      monthlyBilling = Math.round(billing * positions);
      monthlyCost = Math.round(cost * positions);
      annualizedBilling = Math.round(monthlyBilling * 12);
      annualizedCost = Math.round(monthlyCost * 12);
    }

    const monthlyGrossProfit = Math.round((monthlyBilling - monthlyCost) * 100) / 100;
    const annualizedGrossProfit = annualizedBilling - annualizedCost;

    const netProfit = Math.round((grossProfit - statutory) * 100) / 100;
    const netMarginPercent = billing > 0 ? Math.round(((netProfit / billing) * 100) * 100) / 100 : null;

    const gstAmount = Math.round(((billing * gstPercent) / 100) * 100) / 100;
    const totalInvoiceWithGst = Math.round((billing + gstAmount) * 100) / 100;

    const grossMarginText = grossMarginPercent !== null ? `${grossMarginPercent}%` : "N/A (Billing is ₹0)";
    const markupText = markupPercent !== null ? `${markupPercent}%` : "N/A (Resource Cost is ₹0)";

    return {
      clientBillingRate: billing,
      vendorPayRate: cost,
      grossProfit,
      grossMarginPercent,
      markupPercent,
      isLossMaking,
      monthlyBilling,
      monthlyCost,
      monthlyGrossProfit,
      annualizedBilling,
      annualizedCost,
      annualizedGrossProfit,
      netProfit,
      netMarginPercent,
      gstAmount,
      totalInvoiceWithGst,
      billingFrequency: frequency,
      positions,
      calculationBreakdown: {
        grossProfitFormula: `Gross Profit = Client Billing (₹${billing.toLocaleString("en-IN")}) - Resource Cost (₹${cost.toLocaleString("en-IN")}) = ₹${grossProfit.toLocaleString("en-IN")}`,
        grossMarginFormula: billing > 0
          ? `Gross Margin % = (Gross Profit ₹${grossProfit.toLocaleString("en-IN")} / Client Billing ₹${billing.toLocaleString("en-IN")}) × 100 = ${grossMarginText}`
          : `Gross Margin % = N/A (Client Billing is ₹0)`,
        markupFormula: cost > 0
          ? `Markup % = (Gross Profit ₹${grossProfit.toLocaleString("en-IN")} / Resource Cost ₹${cost.toLocaleString("en-IN")}) × 100 = ${markupText}`
          : `Markup % = N/A (Resource Cost is ₹0)`,
      },
    };
  }

  /**
   * Deterministic calculation for Permanent Recruitment / Direct Hire
   */
  static calculatePermanentPlacement(inputs: PermanentPlacementInputs): PermanentPlacementResult {
    const ctc = Math.max(0, Number(inputs.candidateCtc) || 0);
    const feeType = inputs.feeType || "percentage";
    const feePercent = inputs.feePercent !== undefined ? Number(inputs.feePercent) : 8.33;
    const fixedFee = Math.max(0, Number(inputs.fixedFee) || 0);
    const gstPercent = inputs.gstPercentage !== undefined ? Number(inputs.gstPercentage) : 18;
    const replacementDays = inputs.replacementGuaranteeDays || 90;

    let revenue = 0;
    let formula = "";
    let explanation = "";

    if (feeType === "percentage") {
      revenue = Math.round((ctc * (feePercent / 100)) * 100) / 100;
      formula = `Placement Fee = Annual CTC (₹${ctc.toLocaleString("en-IN")}) × ${feePercent}% = ₹${revenue.toLocaleString("en-IN")}`;
      explanation = `Standard Contingency/Direct Hire rate of ${feePercent}% applied on annual cost-to-company.`;
    } else {
      revenue = fixedFee;
      formula = `Fixed Placement Fee = ₹${fixedFee.toLocaleString("en-IN")}`;
      explanation = `Agreed fixed direct placement retainer/success fee.`;
    }

    const gstAmount = Math.round(((revenue * gstPercent) / 100) * 100) / 100;
    const totalInvoiceWithGst = Math.round((revenue + gstAmount) * 100) / 100;

    return {
      candidateCtc: ctc,
      feePercent,
      fixedFee,
      feeType,
      placementRevenue: revenue,
      gstAmount,
      totalInvoiceWithGst,
      replacementGuaranteeDays: replacementDays,
      calculationBreakdown: {
        formula,
        explanation,
      },
    };
  }

  /**
   * Deterministic calculation for Sales Opportunity Pipeline Value
   */
  static calculatePipelineValue(inputs: PipelineValueInputs): PipelineValueResult {
    const value = Math.max(0, Number(inputs.opportunityValue) || 0);
    const prob = Math.min(100, Math.max(0, Number(inputs.probabilityPercent) || 0));
    const weighted = Math.round((value * (prob / 100)) * 100) / 100;

    return {
      unweightedValue: value,
      probabilityPercent: prob,
      weightedPipelineValue: weighted,
    };
  }
}
