export interface CommercialInputs {
  clientBillingRate: number; // Bill Rate to Client (e.g. ₹100,000 / month or ₹1,000 / hr)
  vendorPayRate: number;     // Pay Rate to Vendor / Candidate (e.g. ₹70,000 / month or ₹700 / hr)
  billingFrequency?: "monthly" | "hourly" | "fixed";
  statutoryExpenses?: number; // ESI, PF, Insurance, or Software overhead
  gstPercentage?: number;     // e.g. 18% GST in India
  paymentTermsDays?: number;  // e.g. 30 Days
}

export interface CommercialBreakdown {
  clientBillingRate: number;
  vendorPayRate: number;
  grossProfit: number;
  grossMarginPercent: number; // (Billing - Cost) / Billing * 100
  markupPercent: number;      // (Billing - Cost) / Cost * 100
  statutoryExpenses: number;
  netProfit: number;
  netMarginPercent: number;   // (Net Profit) / Billing * 100
  gstAmount: number;
  totalInvoiceWithGst: number;
  paymentTerms: string;
}

/**
 * Pure commercial calculator strictly distinguishing Gross Margin % vs Markup %
 */
export function calculateCommercials(inputs: CommercialInputs): CommercialBreakdown {
  const billing = Math.max(0, inputs.clientBillingRate || 0);
  const cost = Math.max(0, inputs.vendorPayRate || 0);
  const statutory = Math.max(0, inputs.statutoryExpenses || 0);
  const gstPercent = inputs.gstPercentage !== undefined ? inputs.gstPercentage : 18;
  const days = inputs.paymentTermsDays || 30;

  const grossProfit = billing - cost;
  
  // Gross Margin % = (Gross Profit / Billing) * 100
  const grossMarginPercent = billing > 0 ? (grossProfit / billing) * 100 : 0;
  
  // Markup % = (Gross Profit / Cost) * 100
  const markupPercent = cost > 0 ? (grossProfit / cost) * 100 : 0;

  const netProfit = grossProfit - statutory;
  const netMarginPercent = billing > 0 ? (netProfit / billing) * 100 : 0;

  const gstAmount = (billing * gstPercent) / 100;
  const totalInvoiceWithGst = billing + gstAmount;

  return {
    clientBillingRate: billing,
    vendorPayRate: cost,
    grossProfit,
    grossMarginPercent: Math.round(grossMarginPercent * 100) / 100,
    markupPercent: Math.round(markupPercent * 100) / 100,
    statutoryExpenses: statutory,
    netProfit,
    netMarginPercent: Math.round(netMarginPercent * 100) / 100,
    gstAmount,
    totalInvoiceWithGst,
    paymentTerms: `Net ${days} Days`,
  };
}
