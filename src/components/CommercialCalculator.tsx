/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  calculateCommercials, 
  calculatePermanentRecruitment,
  CommercialInputs, 
  PermanentRecruitmentInputs 
} from "@/utils/commercialCalculator";
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  Info, 
  ShieldCheck, 
  Briefcase, 
  UserCheck, 
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommercialCalculatorProps {
  initialBilling?: number;
  initialVendorCost?: number;
  initialCtc?: number;
  initialFeePercent?: number;
  initialModel?: "staffing" | "permanent";
  onSave?: (breakdown: any) => void;
  readOnly?: boolean;
}

export const CommercialCalculator: React.FC<CommercialCalculatorProps> = ({
  initialBilling = 100000,
  initialVendorCost = 70000,
  initialCtc = 1200000,
  initialFeePercent = 8.33,
  initialModel = "staffing",
  onSave,
  readOnly = false,
}) => {
  const [model, setModel] = useState<"staffing" | "permanent">(initialModel);

  // Staffing Inputs
  const [staffingInputs, setStaffingInputs] = useState<CommercialInputs>({
    clientBillingRate: initialBilling,
    vendorPayRate: initialVendorCost,
    billingFrequency: "monthly",
    positions: 1,
    statutoryExpenses: 0,
    gstPercentage: 18,
    paymentTermsDays: 30,
  });

  // Permanent Inputs
  const [permInputs, setPermInputs] = useState<PermanentRecruitmentInputs>({
    candidateCtc: initialCtc,
    feePercent: initialFeePercent,
    fixedFee: 0,
    feeType: "percentage",
    gstPercentage: 18,
    replacementGuaranteeDays: 90,
  });

  const staffingBreakdown = calculateCommercials(staffingInputs);
  const permBreakdown = calculatePermanentRecruitment(permInputs);

  return (
    <div id="commercial_calculator_container" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Commercial & Margin Engine</h3>
            <p className="text-xs text-slate-500">Deterministic Gross Margin, Markup, CTC Fee & Revenue Modeling</p>
          </div>
        </div>

        {/* Model Selector Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModel("staffing")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
              model === "staffing"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Contract / C2C
          </button>
          <button
            type="button"
            onClick={() => setModel("permanent")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
              model === "permanent"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Permanent (CTC %)
          </button>
        </div>
      </div>

      {model === "staffing" ? (
        /* Staffing / C2C Model */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Inputs Section */}
          <div className="lg:col-span-6 space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Billing & Cost Parameters</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Client Bill Rate (₹ / month)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    id="client_billing_rate_input"
                    type="number"
                    disabled={readOnly}
                    value={staffingInputs.clientBillingRate || ""}
                    onChange={(e) => setStaffingInputs({ ...staffingInputs, clientBillingRate: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resource / Vendor Cost (₹ / month)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    id="vendor_pay_rate_input"
                    type="number"
                    disabled={readOnly}
                    value={staffingInputs.vendorPayRate || ""}
                    onChange={(e) => setStaffingInputs({ ...staffingInputs, vendorPayRate: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    placeholder="70000"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Frequency</label>
                <select
                  disabled={readOnly}
                  value={staffingInputs.billingFrequency}
                  onChange={(e) => setStaffingInputs({ ...staffingInputs, billingFrequency: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  <option value="monthly">Monthly</option>
                  <option value="hourly">Hourly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Positions</label>
                <input
                  type="number"
                  disabled={readOnly}
                  min="1"
                  value={staffingInputs.positions}
                  onChange={(e) => setStaffingInputs({ ...staffingInputs, positions: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Payment Terms</label>
                <select
                  disabled={readOnly}
                  value={staffingInputs.paymentTermsDays}
                  onChange={(e) => setStaffingInputs({ ...staffingInputs, paymentTermsDays: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md font-medium text-slate-800"
                >
                  <option value="15">Net 15</option>
                  <option value="30">Net 30</option>
                  <option value="45">Net 45</option>
                  <option value="60">Net 60</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-6 space-y-4 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Commercial Breakdown</span>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded">
                  {staffingBreakdown.paymentTerms}
                </span>
              </div>

              {/* Primary Comparison Cards */}
              <div className="space-y-3 mt-3">
                {staffingBreakdown.isLossMaking && (
                  <div id="loss_making_warning" className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>LOSS-MAKING CONTRACT: Direct cost exceeds client billing. Negative margins detected.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div
                    id="gross_margin_card"
                    className={cn(
                      "p-3 rounded-lg border shadow-sm text-center",
                      staffingBreakdown.isLossMaking
                        ? "bg-rose-50/70 border-rose-200"
                        : "bg-white border-indigo-100"
                    )}
                  >
                    <div className="text-[11px] font-semibold text-slate-500">Gross Margin %</div>
                    <div
                      className={cn(
                        "text-2xl font-extrabold mt-0.5",
                        staffingBreakdown.isLossMaking
                          ? "text-rose-600"
                          : "text-indigo-700"
                      )}
                    >
                      {staffingBreakdown.grossMarginPercent !== null
                        ? `${staffingBreakdown.grossMarginPercent}%`
                        : "N/A"}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Profit / Client Billing</div>
                  </div>

                  <div
                    id="markup_card"
                    className={cn(
                      "p-3 rounded-lg border shadow-sm text-center",
                      staffingBreakdown.isLossMaking
                        ? "bg-rose-50/70 border-rose-200"
                        : "bg-white border-emerald-100"
                    )}
                  >
                    <div className="text-[11px] font-semibold text-slate-500">Markup Rate %</div>
                    <div
                      className={cn(
                        "text-2xl font-extrabold mt-0.5",
                        staffingBreakdown.isLossMaking
                          ? "text-rose-600"
                          : "text-emerald-700"
                      )}
                    >
                      {staffingBreakdown.markupPercent !== null
                        ? `${staffingBreakdown.markupPercent}%`
                        : "N/A"}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Profit / Resource Cost</div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="space-y-2 mt-3 pt-2 text-xs border-t border-indigo-100/80">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Monthly Gross Profit:</span>
                  <span
                    className={cn(
                      "font-bold",
                      staffingBreakdown.isLossMaking ? "text-rose-600" : "text-slate-900"
                    )}
                  >
                    ₹{staffingBreakdown.grossProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Annualized Billing ({staffingInputs.positions} pos):</span>
                  <span className="font-semibold text-slate-800">₹{staffingBreakdown.annualizedBilling.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Annualized Gross Profit:</span>
                  <span
                    className={cn(
                      "font-bold",
                      staffingBreakdown.isLossMaking ? "text-rose-600" : "text-emerald-700"
                    )}
                  >
                    ₹{staffingBreakdown.annualizedGrossProfit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-dashed border-indigo-100">
                  <span>Invoice Total (excl. TDS):</span>
                  <span className="font-bold text-slate-900">₹{staffingBreakdown.clientBillingRate.toLocaleString("en-IN")} / mo</span>
                </div>
              </div>
            </div>

            {onSave && !readOnly && (
              <button
                type="button"
                id="apply_staffing_commercial_btn"
                onClick={() => onSave({ model: "staffing", ...staffingBreakdown })}
                className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
              >
                Apply Commercial Terms
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Permanent Recruitment / Direct Hire Model */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Inputs Section */}
          <div className="lg:col-span-6 space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Permanent Hiring Terms</h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Candidate Annual CTC (Fixed + Variable)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    id="candidate_ctc_input"
                    type="number"
                    disabled={readOnly}
                    value={permInputs.candidateCtc || ""}
                    onChange={(e) => setPermInputs({ ...permInputs, candidateCtc: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    placeholder="1200000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Recruitment Fee (%)</label>
                  <div className="relative">
                    <input
                      id="recruitment_fee_percent_input"
                      type="number"
                      step="0.01"
                      disabled={readOnly}
                      value={permInputs.feePercent}
                      onChange={(e) => setPermInputs({ ...permInputs, feePercent: Number(e.target.value) })}
                      className="w-full pr-7 pl-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-sm font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Replacement Guarantee</label>
                  <select
                    disabled={readOnly}
                    value={permInputs.replacementGuaranteeDays}
                    onChange={(e) => setPermInputs({ ...permInputs, replacementGuaranteeDays: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
                  >
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days (Standard)</option>
                    <option value="180">180 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-6 space-y-4 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Placement Commercials</span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {permBreakdown.replacementGuaranteeDays} Days Guarantee
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm mt-3 text-center">
                <div className="text-xs font-semibold text-slate-500">Expected Direct Placement Revenue</div>
                <div id="perm_placement_revenue" className="text-3xl font-extrabold text-emerald-700 mt-1">
                  ₹{permBreakdown.placementRevenue.toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  ₹{permBreakdown.candidateCtc.toLocaleString("en-IN")} × {permBreakdown.feePercent}%
                </div>
              </div>

              <div className="space-y-2 mt-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Fee Model:</span>
                  <span className="font-semibold text-slate-800">Contingency Direct Hire</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice Trigger:</span>
                  <span className="font-semibold text-slate-800">Candidate Joining Date</span>
                </div>
              </div>
            </div>

            {onSave && !readOnly && (
              <button
                type="button"
                id="apply_perm_commercial_btn"
                onClick={() => onSave({ model: "permanent", ...permBreakdown })}
                className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
              >
                Apply Permanent Placement Terms
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mathematical Breakdown Explanations */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-[11px] text-slate-600 space-y-1">
        <div className="font-bold text-slate-700 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          <span>Formulas & Calculation Transparency</span>
        </div>
        {model === "staffing" ? (
          <>
            <div>• <strong>Gross Profit:</strong> {staffingBreakdown.calculationBreakdown.grossProfitFormula}</div>
            <div>• <strong>Gross Margin %:</strong> {staffingBreakdown.calculationBreakdown.grossMarginFormula}</div>
            <div>• <strong>Markup %:</strong> {staffingBreakdown.calculationBreakdown.markupFormula}</div>
          </>
        ) : (
          <div>• <strong>Placement Revenue:</strong> {permBreakdown.calculationBreakdown.formula} ({permBreakdown.calculationBreakdown.explanation})</div>
        )}
      </div>
    </div>
  );
};
