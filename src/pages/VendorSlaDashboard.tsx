/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, TrendingUp, AlertTriangle, ShieldCheck, CheckSquare, MessageSquare, Award, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VendorSlaDashboardProps {
  selectedVendor: any;
  activeVendorCandidates: any[];
  onApplyBulkFeedback: (candidateIds: string[], feedbackText: string, actionType: string) => Promise<void>;
}

export default function VendorSlaDashboard({
  selectedVendor,
  activeVendorCandidates,
  onApplyBulkFeedback,
}: VendorSlaDashboardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkFeedbackText, setBulkFeedbackText] = useState('');
  const [bulkActionType, setBulkActionType] = useState('Screening Approved');
  const [dispatchChannel, setDispatchChannel] = useState<'all' | 'portal' | 'email' | 'whatsapp'>('all');

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === activeVendorCandidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeVendorCandidates.map(c => c.id || ''));
    }
  };

  const handleExecuteBulkAction = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one candidate first.');
      return;
    }
    if (!bulkFeedbackText.trim()) {
      toast.error('Feedback details cannot be empty.');
      return;
    }

    try {
      await onApplyBulkFeedback(selectedIds, bulkFeedbackText, bulkActionType);
      toast.success(`Bulk feedback applied successfully to ${selectedIds.length} candidates!`);
      setBulkFeedbackText('');
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit feedback.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SLA SCORECARD GRID */}
      {/* BULK FEEDBACK CENTER TERMINAL */}
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] border border-slate-800 shadow-xl space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <div>
              <h4 className="text-sm font-black tracking-tight">Bulk SLA Feedback Center</h4>
              <p className="text-[10px] text-slate-400 font-mono">Select profiles to push bulk feedback, audit trails, and client portal updates.</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded">
            IDEMPOTENT EVENT-DRIVEN • SECURE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* List of selectables (5 cols) */}
          <div className="lg:col-span-5 space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 h-[280px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <button 
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-indigo-300 hover:underline"
              >
                {selectedIds.length === activeVendorCandidates.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-[10px] font-mono text-slate-500">{selectedIds.length} Selected</span>
            </div>

            {activeVendorCandidates.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-8 text-center">No active profiles to select.</p>
            ) : activeVendorCandidates.map((cand, index) => {
              const isChecked = selectedIds.includes(cand.id || '');
              return (
                <div 
                  key={cand.id || index}
                  onClick={() => handleToggleSelect(cand.id || '')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-indigo-600/15 border-indigo-500/40' 
                      : 'bg-slate-900 hover:bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div>
                    <h5 className="font-bold text-white text-[11px]">{cand.name}</h5>
                    <p className="text-[9px] text-slate-400 font-mono">{cand.currentTitle || 'Staff Candidate'}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Swallowed since parent handles click
                    className="w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-800"
                  />
                </div>
              );
            })}
          </div>

          {/* Action Input Terminal (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Unified Placement Action</label>
                <select
                  value={bulkActionType}
                  onChange={e => setBulkActionType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Screening Approved">Screening Approved</option>
                  <option value="L1 Interview Scheduled">Schedule L1 Technical</option>
                  <option value="L2 Management Round">Schedule Client Manager L2</option>
                  <option value="Offer Extended">Release Placement Offer</option>
                  <option value="Profile Rejected">Reject Candidate</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Notification channel</label>
                <select
                  value={dispatchChannel}
                  onChange={e => setDispatchChannel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="all">Dispatch All Channels (SSOT)</option>
                  <option value="portal">Vendor Portal Only</option>
                  <option value="email">Email Notification Only</option>
                  <option value="whatsapp">Automated WhatsApp Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">SLA Feedback details</label>
              <textarea
                value={bulkFeedbackText}
                onChange={e => setBulkFeedbackText(e.target.value)}
                placeholder="Write unified technical screening assessment notes here..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <button
              onClick={handleExecuteBulkAction}
              disabled={selectedIds.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              Apply Event Ledger & Notify {selectedIds.length} Candidates
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
