/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CommercialInputs {
  clientBillingRate: number; // Bill Rate to Client (e.g. ₹100,000 / month or ₹1,000 / hr)
  vendorPayRate: number;     // Pay Rate to Vendor / Candidate (e.g. ₹70,000 / month or ₹700 / hr)
  billingFrequency?: "monthly" | "hourly" | "annual" | "fixed";
  positions?: number;
  statutoryExpenses?: number; // ESI, PF, Insurance, or Overhead
  gstPercentage?: number;     // e.g. 18% GST
  paymentTermsDays?: number;  // e.g. 30, 45, 60 Days
}

export interface CommercialBreakdown {
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
  statutoryExpenses: number;
  netProfit: number;
  netMarginPercent: number | null;   // (Net Profit) / Billing * 100 or null
  gstAmount: number;
  totalInvoiceWithGst: number;
  paymentTerms: string;
  positions: number;
  billingFrequency: string;
  calculationBreakdown: {
    grossProfitFormula: string;
    grossMarginFormula: string;
    markupFormula: string;
  };
}

export interface PermanentRecruitmentInputs {
  candidateCtc: number;      // e.g. ₹12,00,000
  feePercent?: number;       // e.g. 8.33%
  fixedFee?: number;         // Fixed fee amount if not percentage
  feeType?: "percentage" | "fixed";
  gstPercentage?: number;    // e.g. 18%
  replacementGuaranteeDays?: number; // e.g. 90 days
}

export interface PermanentRecruitmentBreakdown {
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

/**
 * Pure commercial calculator strictly distinguishing Gross Margin % vs Markup %
 */
export function calculateCommercials(inputs: CommercialInputs): CommercialBreakdown {
  const billing = Math.max(0, Number(inputs.clientBillingRate) || 0);
  const cost = Math.max(0, Number(inputs.vendorPayRate) || 0);
  const statutory = Math.max(0, Number(inputs.statutoryExpenses) || 0);
  const gstPercent = inputs.gstPercentage !== undefined ? Number(inputs.gstPercentage) : 18;
  const days = inputs.paymentTermsDays || 30;
  const positions = Math.max(1, Number(inputs.positions) || 1);
  const freq = inputs.billingFrequency || "monthly";

  const grossProfit = Math.round((billing - cost) * 100) / 100;
  const isLossMaking = grossProfit < 0;
  
  // Gross Margin % = (Gross Profit / Billing) * 100. If billing is 0, margin is null (N/A).
  const grossMarginPercent = billing > 0 ? Math.round(((grossProfit / billing) * 100) * 100) / 100 : null;
  
  // Markup % = (Gross Profit / Cost) * 100. If cost is 0, markup is null (N/A - zero-cost).
  const markupPercent = cost > 0 ? Math.round(((grossProfit / cost) * 100) * 100) / 100 : null;

  // Monthly and Annual conversions
  let monthlyBilling = 0;
  let monthlyCost = 0;
  let annualizedBilling = 0;
  let annualizedCost = 0;

  if (freq === "hourly") {
    const hoursPerMonth = 160;
    monthlyBilling = Math.round(billing * hoursPerMonth * positions);
    monthlyCost = Math.round(cost * hoursPerMonth * positions);
    annualizedBilling = Math.round(monthlyBilling * 12);
    annualizedCost = Math.round(monthlyCost * 12);
  } else if (freq === "annual") {
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
    statutoryExpenses: statutory,
    netProfit,
    netMarginPercent,
    gstAmount,
    totalInvoiceWithGst,
    paymentTerms: `Net ${days} Days`,
    positions,
    billingFrequency: freq,
    calculationBreakdown: {
      grossProfitFormula: `Gross Profit = Billing (₹${billing.toLocaleString("en-IN")}) - Cost (₹${cost.toLocaleString("en-IN")}) = ₹${grossProfit.toLocaleString("en-IN")}`,
      grossMarginFormula: billing > 0
        ? `Gross Margin % = (Gross Profit ₹${grossProfit.toLocaleString("en-IN")} / Billing ₹${billing.toLocaleString("en-IN")}) × 100 = ${grossMarginText}`
        : `Gross Margin % = N/A (Billing is ₹0)`,
      markupFormula: cost > 0
        ? `Markup % = (Gross Profit ₹${grossProfit.toLocaleString("en-IN")} / Cost ₹${cost.toLocaleString("en-IN")}) × 100 = ${markupText}`
        : `Markup % = N/A (Resource Cost is ₹0)`,
    },
  };
}

/**
 * Pure permanent recruitment placement fee calculator
 */
export function calculatePermanentRecruitment(inputs: PermanentRecruitmentInputs): PermanentRecruitmentBreakdown {
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
    explanation = `Contingency placement fee of ${feePercent}% calculated on annual fixed CTC.`;
  } else {
    revenue = fixedFee;
    formula = `Fixed Placement Fee = ₹${fixedFee.toLocaleString("en-IN")}`;
    explanation = `Agreed direct hire fixed success fee.`;
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
