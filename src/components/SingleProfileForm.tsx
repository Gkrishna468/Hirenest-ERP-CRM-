import React, { useState } from 'react';
import { Lock, Cpu, CheckCircle2, XCircle, RefreshCw, Upload, FileText, AlertCircle, ShieldCheck } from 'lucide-react';

interface SingleProfileFormProps {
  vendorForm: any;
  setVendorForm: React.Dispatch<React.SetStateAction<any>>;
  handleVendorSubmit: (e: React.FormEvent) => Promise<void>;
  submitting: boolean;
  pipelineStep: number;
  pipelineLog: string[];
  submissionResult: any;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  setSubmissionResult: React.Dispatch<React.SetStateAction<any>>;
  setPipelineStep: React.Dispatch<React.SetStateAction<number>>;
  authenticatedVendor: any;
}

export const SingleProfileForm: React.FC<SingleProfileFormProps> = ({
  vendorForm,
  setVendorForm,
  handleVendorSubmit,
  submitting,
  pipelineStep,
  pipelineLog,
  submissionResult,
  setSubmitting,
  setSubmissionResult,
  setPipelineStep,
  authenticatedVendor
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const isDocx = file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

    if (!isDocx && !isPdf) {
      alert("Invalid format: Only .pdf and .docx resume documents are supported.");
      return;
    }

    setVendorForm({
      ...vendorForm,
      resumeFile: file,
      resumeFileName: file.name
    });
  };

  const screening = submissionResult?.screeningDecision || submissionResult?.screeningResult;
  const isPassed = screening?.status === 'PASS' || submissionResult?.status === 'PASS' || (submissionResult?.aiMatchScore >= 70);
  const isReview = screening?.status === 'REVIEW';
  const isRejected = screening?.status === 'REJECT';

  return (
    <div id="vendor-single-profile-card" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
      {/* SUBMITTING OVERLAY */}
      {submitting && (
        <div id="vendor-screening-pipeline-overlay" className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-3xl z-40 flex flex-col p-8 justify-between animate-in fade-in duration-300">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center animate-pulse">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-white uppercase tracking-wider text-sm font-mono">Strict Deterministic Screening Engine</h3>
                <p className="text-[10px] text-amber-400 font-mono font-bold">SOURCE_VAULT: {authenticatedVendor?.name?.toUpperCase() || "VENDOR WORKSPACE"}</p>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs text-slate-300">
              {pipelineStep === 1 && (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Extracting document layout and verifying digital fidelity...</span>
                </div>
              )}
              {pipelineStep >= 2 && (
                <div className="flex items-start gap-3 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Deterministic Parser: Extracted technical skills and employment chronology.</span>
                </div>
              )}
              {pipelineStep === 2 && (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Evaluating project evidence levels & relevant experience duration...</span>
                </div>
              )}
              {pipelineStep >= 3 && (
                <div className="flex items-start gap-3 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Identity vault validated. Representation ownership secured.</span>
                </div>
              )}
              {pipelineStep === 3 && (
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Executing deterministic requirement matching matrix...</span>
                </div>
              )}
              {pipelineStep >= 4 && (
                <div className="flex items-start gap-3 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Audited screening report published to immutable Company Ledger.</span>
                </div>
              )}
              {pipelineStep === 4 && (
                <div className="flex items-center gap-3 animate-pulse">
                  <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Finalizing verification receipt...</span>
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] text-slate-400 max-h-36 overflow-y-auto custom-scrollbar">
              {pipelineLog.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))}
            </div>
          </div>

          {/* Results Screen */}
          {pipelineStep === 5 && submissionResult && (
            <div className="space-y-5 pt-4 border-t border-slate-800 animate-in zoom-in-95 duration-300">
              <div className={`p-5 rounded-2xl text-center space-y-2 border ${
                isPassed 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : isReview
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {isPassed ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : isReview ? (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <p className={`text-xs font-black uppercase tracking-widest font-mono ${
                    isPassed ? 'text-emerald-400' : isReview ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {screening?.status ? `Screening Decision: ${screening.status}` : 'Submission Screened'}
                  </p>
                </div>
                <div className="text-3xl font-black text-white font-mono">
                  {submissionResult.screeningScore || submissionResult.aiMatchScore || 85}%
                  <span className="text-[11px] text-slate-400 block font-normal mt-1 font-sans">
                    Deterministic Benchmark Match
                  </span>
                </div>
                {screening?.primaryReason && (
                  <p className="text-xs text-slate-300 font-medium max-w-md mx-auto pt-1">
                    {screening.primaryReason}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Assigned Account Lead</span>
                  <span className="font-bold text-amber-400">{submissionResult.assignedBdm || "Ravi"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Sourcing Ownership</span>
                  <span className="font-bold text-emerald-400">VERIFIED & CLAIMED ✓</span>
                </div>
              </div>

              <button 
                id="btn-submit-another-profile"
                onClick={() => {
                  setSubmitting(false);
                  setSubmissionResult(null);
                  setPipelineStep(0);
                  setVendorForm({
                    candidateName: '',
                    email: '',
                    phone: '',
                    linkedin: '',
                    resumeFile: null,
                    resumeFileName: '',
                    current_company: '',
                    current_title: '',
                    current_ctc: '',
                    expected_ctc: '',
                    notice_period: '',
                    location: '',
                    payroll: 'Vendor Payroll',
                    availability: 'Immediate',
                    cover_note: ''
                  });
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Submit Another Profile
              </button>
            </div>
          )}

          {pipelineStep === -1 && (
            <div className="space-y-4 pt-4 border-t border-slate-800 text-center animate-in zoom-in-95 duration-300">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-6 h-6" />
              </div>
              <h4 className="font-black font-mono text-rose-500 text-sm uppercase">REPRESENTATION CONFLICT</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {submissionResult?.message || "This candidate is already represented or locked under prior registry claims."}
              </p>
              <button 
                id="btn-adjust-candidate-details"
                onClick={() => {
                  setSubmitting(false);
                  setPipelineStep(0);
                }}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all text-sm cursor-pointer"
              >
                Adjust Candidate Details
              </button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleVendorSubmit} className="space-y-5 animate-in fade-in duration-300">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white tracking-tight">Submit Candidate Profile</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Upload candidate resume document. Real-time deterministic screening will parse and audit qualifications instantly.
          </p>
        </div>

        <div className="space-y-4 font-sans">
          {/* Resume File Upload Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">
              Upload Resume (.PDF or .DOCX) <span className="text-rose-500">*</span>
            </label>
            <div 
              id="resume-dropzone-box"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                dragOver 
                  ? 'border-amber-500 bg-amber-500/10' 
                  : vendorForm.resumeFileName
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
              onClick={() => document.getElementById('single-resume-file-input')?.click()}
            >
              <input
                id="single-resume-file-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              
              {vendorForm.resumeFileName ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">{vendorForm.resumeFileName}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">Ready for deterministic parsing (Click to change)</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Click to choose or drag & drop candidate resume
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Accepts Adobe PDF (.pdf) or Word (.docx) • Max 25MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Candidate Full Name <span className="text-rose-500">*</span></label>
            <input
              id="input-candidate-name"
              type="text"
              required
              value={vendorForm.candidateName}
              onChange={(e) => setVendorForm({...vendorForm, candidateName: e.target.value})}
              placeholder="e.g. Alex Sharma"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Candidate Email <span className="text-rose-500">*</span></label>
              <input
                id="input-candidate-email"
                type="email"
                required
                value={vendorForm.email}
                onChange={(e) => setVendorForm({...vendorForm, email: e.target.value})}
                placeholder="alex.sharma@example.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Candidate Phone <span className="text-rose-500">*</span></label>
              <input
                id="input-candidate-phone"
                type="tel"
                required
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({...vendorForm, phone: e.target.value})}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Current Company</label>
              <input
                id="input-candidate-company"
                type="text"
                value={vendorForm.current_company}
                onChange={(e) => setVendorForm({...vendorForm, current_company: e.target.value})}
                placeholder="e.g. TCS, Cognizant, Wipro"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Current Title / Role</label>
              <input
                id="input-candidate-title"
                type="text"
                value={vendorForm.current_title}
                onChange={(e) => setVendorForm({...vendorForm, current_title: e.target.value})}
                placeholder="e.g. Lead Full Stack Engineer"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Current CTC</label>
              <input
                id="input-candidate-current-ctc"
                type="text"
                value={vendorForm.current_ctc}
                onChange={(e) => setVendorForm({...vendorForm, current_ctc: e.target.value})}
                placeholder="e.g. ₹18 LPA"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Expected CTC</label>
              <input
                id="input-candidate-expected-ctc"
                type="text"
                value={vendorForm.expected_ctc}
                onChange={(e) => setVendorForm({...vendorForm, expected_ctc: e.target.value})}
                placeholder="e.g. ₹24 LPA"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Notice Period</label>
              <input
                id="input-candidate-notice-period"
                type="text"
                value={vendorForm.notice_period}
                onChange={(e) => setVendorForm({...vendorForm, notice_period: e.target.value})}
                placeholder="e.g. Immediate, 15 Days, 30 Days"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Current Location</label>
              <input
                id="input-candidate-location"
                type="text"
                value={vendorForm.location}
                onChange={(e) => setVendorForm({...vendorForm, location: e.target.value})}
                placeholder="e.g. Bengaluru, Pune, Hyderabad"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">LinkedIn Profile URL</label>
            <input
              id="input-candidate-linkedin"
              type="url"
              value={vendorForm.linkedin}
              onChange={(e) => setVendorForm({...vendorForm, linkedin: e.target.value})}
              placeholder="https://www.linkedin.com/in/alex-sharma"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Payroll Arrangement</label>
              <select
                id="select-candidate-payroll"
                value={vendorForm.payroll}
                onChange={(e) => setVendorForm({...vendorForm, payroll: e.target.value})}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white font-medium transition-all"
              >
                <option value="Vendor Payroll">Vendor Payroll</option>
                <option value="Direct Hire">Direct Hire</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Availability Status</label>
              <select
                id="select-candidate-availability"
                value={vendorForm.availability}
                onChange={(e) => setVendorForm({...vendorForm, availability: e.target.value})}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white font-medium transition-all"
              >
                <option value="Immediate">Immediate (Ready to Deploy)</option>
                <option value="1 Week">1 Week</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Covering Notes & Highlights</label>
            <textarea
              id="textarea-candidate-cover-note"
              rows={3}
              value={vendorForm.cover_note}
              onChange={(e) => setVendorForm({...vendorForm, cover_note: e.target.value})}
              placeholder="Highlight candidate's specific hands-on experience, client feedback, or domain strengths..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none rounded-xl text-xs text-white placeholder-slate-600 font-medium transition-all resize-none"
            />
          </div>
        </div>

        <button
          id="btn-submit-candidate-representation"
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-4 rounded-2xl font-bold transition-all text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
        >
          <span>Run Strict Screening & Lock Representation</span>
          <Lock className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
