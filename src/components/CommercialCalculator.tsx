import React, { useState } from "react";
import { calculateCommercials, CommercialInputs } from "@/utils/commercialCalculator";
import { Calculator, DollarSign, Percent, Info, ShieldCheck } from "lucide-react";

interface CommercialCalculatorProps {
  initialBilling?: number;
  initialVendorCost?: number;
  onSave?: (breakdown: ReturnType<typeof calculateCommercials>) => void;
}

export const CommercialCalculator: React.FC<CommercialCalculatorProps> = ({
  initialBilling = 100000,
  initialVendorCost = 75000,
  onSave,
}) => {
  const [inputs, setInputs] = useState<CommercialInputs>({
    clientBillingRate: initialBilling,
    vendorPayRate: initialVendorCost,
    statutoryExpenses: 2000,
    gstPercentage: 18,
    paymentTermsDays: 30,
  });

  const breakdown = calculateCommercials(inputs);

  return (
    <div id="commercial_calculator_container" className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Commercial & Margin Engine</h3>
            <p className="text-xs text-slate-500">Calculate Gross Margin %, Markup %, GST & Net Earnings</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Law 2 Compliance
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Fields */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Client Billing Rate (INR / Month)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
              <input
                id="commercial_billing_rate_input"
                type="number"
                value={inputs.clientBillingRate}
                onChange={(e) => setInputs({ ...inputs, clientBillingRate: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Vendor / Candidate Pay Rate (INR / Month)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
              <input
                id="commercial_vendor_cost_input"
                type="number"
                value={inputs.vendorPayRate}
                onChange={(e) => setInputs({ ...inputs, vendorPayRate: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Overhead / Statutory (₹)</label>
              <input
                type="number"
                value={inputs.statutoryExpenses}
                onChange={(e) => setInputs({ ...inputs, statutoryExpenses: Number(e.target.value) })}
                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={inputs.gstPercentage}
                onChange={(e) => setInputs({ ...inputs, gstPercentage: Number(e.target.value) })}
                className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Calculated Output Breakdown */}
        <div className="space-y-3 bg-indigo-50/50 p-4 rounded-lg border border-indigo-100 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-600 pb-1 border-b border-indigo-100">
              <span>Gross Profit Amount:</span>
              <span className="font-bold text-slate-900">₹{breakdown.grossProfit.toLocaleString("en-IN")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 py-1">
              <div id="gross_margin_stat_card" className="bg-white p-2.5 rounded-lg border border-indigo-100 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Gross Margin</span>
                  <span title="(Billing - Cost) / Billing"><Info className="w-3 h-3 text-slate-400" /></span>
                </div>
                <div className="text-lg font-bold text-indigo-700">{breakdown.grossMarginPercent}%</div>
                <div className="text-[10px] text-slate-400">% of Revenue</div>
              </div>

              <div id="markup_stat_card" className="bg-white p-2.5 rounded-lg border border-indigo-100 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500">
                  <span>Markup Rate</span>
                  <span title="(Billing - Cost) / Cost"><Info className="w-3 h-3 text-slate-400" /></span>
                </div>
                <div className="text-lg font-bold text-emerald-700">{breakdown.markupPercent}%</div>
                <div className="text-[10px] text-slate-400">% over Vendor Cost</div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
              <span>Net Profit (after Overhead):</span>
              <span className="font-bold text-emerald-600">₹{breakdown.netProfit.toLocaleString("en-IN")} ({breakdown.netMarginPercent}%)</span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-indigo-100">
              <span>Invoice Total (incl. {inputs.gstPercentage}% GST):</span>
              <span className="font-bold text-slate-800">₹{breakdown.totalInvoiceWithGst.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {onSave && (
            <button
              id="save_commercial_deal_btn"
              onClick={() => onSave(breakdown)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
            >
              Apply Commercial Structure to Deal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
