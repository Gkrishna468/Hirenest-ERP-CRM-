import { safeJson } from '@/utils/safeJson';
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  Search,
  Clock,
  Bot,
  Zap,
  Send,
  Building2,
  Users,
  Handshake,
  ArrowRight,
  RefreshCw,
  Plus,
  Briefcase,
  AlertCircle,
  FileText,
  Paperclip,
  Database,
  CheckCircle2,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { processInteraction, BrainInsight } from "@/services/brainService";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import DOMPurify from 'dompurify';

type EntityType = "actionable" | "Requirement" | "Vendor Submission" | "Interview" | "Spam" | "Noise" | "all";

export default function CommunicationCenter() {
  const { user, apiFetch } = useAuth();
  const { jobs, candidates, deals, addJob, addCandidate } = useData();

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Stats for KPI Strip
  const metrics = {
    source_gmail: emails.length,
    type_requirement: emails.filter(e => e.entityType === 'Requirement' || e.mail_classification === 'Requirement').length,
    type_candidate: emails.filter(e => e.entityType === 'Vendor Submission' || e.mail_classification === 'Vendor Submission').length,
    status_manual_review: emails.filter(e => e.isAiAnalyzed === false || !e.mail_classification).length
  };

  const fetchEmails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userQuery = user?.id
        ? `&userId=${encodeURIComponent(user.id)}`
        : "";
      const response = await apiFetch(`/api/gmail/list${userQuery.replace("&", "?")}`);
      if (!response.ok) throw new Error("Failed to fetch emails");
      const data = await safeJson(response);
      
      const formattedMails = (data.emails || []).map((e: any) => {
        return {
          ...e,
          classification: {
             type: e.mail_classification || e.entityType || 'Unknown',
             summary: e.aiSummary || 'Waiting for AI processing...',
             confidence: 85
          }
        };
      });
      setEmails(formattedMails);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error fetching emails");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id) {
      toast.error("User ID not found");
      return;
    }
    setIsSyncing(true);
    setError('');
    try {
      const response = await apiFetch(
        `/api/gmail/sync?userId=${encodeURIComponent(user.id)}`,
        {
          method: "POST",
        },
      );
      const data = await safeJson(response);
      if (!response.ok) {
        if (response.status === 404 && data.error === 'No connection found for this user') {
           throw new Error('Gmail is not connected. Please go to Settings to connect your account.');
        }
        throw new Error(data.error || "Failed to sync");
      }
      toast.success(data.message || "Inbox synced successfully");
      await fetchEmails();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error syncing inbox");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [user]);

  const runIntelligence = async () => {
     if (!selectedMessage) return;
     setIsAnalyzing(true);
     try {
       const res = await processInteraction(
          selectedMessage.body || selectedMessage.snippet,
          { source: "email", from: selectedMessage.from, entityType: selectedMessage.classification?.type },
          selectedMessage.id
       );
       
       toast.success("AI Analysis complete");
       await fetchEmails(); // Refresh list to get updated classification
     } catch (e: any) {
       toast.error(e.message || "Failed to run intelligence");
     } finally {
       setIsAnalyzing(false);
     }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <header className="p-4 bg-white border-b border-slate-200 shrink-0">
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Mail size={20} />
                 </div>
                 <div>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">Business Inbox</h1>
                    <p className="text-xs text-slate-500 font-medium">Requirement & Candidate Processing Pipeline</p>
                 </div>
             </div>
             
             <div className="flex items-center gap-6">
                <button
                     onClick={handleSync}
                     disabled={isSyncing}
                     className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? 'Syncing...' : 'Sync Gmail'}
                </button>

                <div className="flex gap-4 items-center mr-4">
                  <div className="text-center">
                    <span className="block text-xl font-black text-slate-800">{metrics.source_gmail || 0}</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Emails</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="text-center">
                    <span className="block text-xl font-black text-emerald-600">{metrics.type_requirement || 0}</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Reqs</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xl font-black text-blue-600">{metrics.type_candidate || 0}</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Cands</span>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="text-center">
                    <span className="block text-xl font-black text-orange-500">{metrics.status_manual_review || 0}</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Review</span>
                  </div>
                </div>
             </div>
         </div>
      </header>

      {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 p-3 flex items-center gap-3 shrink-0">
              <AlertCircle size={18} />
              <span className="font-semibold text-sm">{error}</span>
          </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* INBOX LIST */}
        <div className="w-1/3 border-r border-slate-200 bg-white flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-100 shrink-0">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                         type="text" 
                         placeholder="Search messages..." 
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('inbox')}
                        className={cn(
                            "flex-1 text-xs px-3 py-1.5 rounded-md font-bold transition-colors",
                            activeTab === 'inbox' ? "bg-indigo-100 text-indigo-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        Inbox
                    </button>
                    <button 
                        onClick={() => setActiveTab('sent')}
                        className={cn(
                            "flex-1 text-xs px-3 py-1.5 rounded-md font-bold transition-colors",
                            activeTab === 'sent' ? "bg-indigo-100 text-indigo-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        Sent
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {emails.length === 0 && !isLoading ? (
                    <div className="p-8 text-center flex flex-col items-center">
                       <Mail className="w-12 h-12 text-slate-200 mb-3" />
                       <h3 className="font-bold text-slate-800">Inbox Zero</h3>
                       <p className="text-sm text-slate-500 mt-1">No messages to process.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {emails.filter(msg => 
                             activeTab === 'inbox'
                                 ? !msg.rawPayload?.labels?.includes('SENT')
                                 : msg.rawPayload?.labels?.includes('SENT')
                        ).map((msg) => (
                            <div 
                                 key={msg.id} 
                                 onClick={() => setSelectedMessage(msg)}
                                className={cn(
                                    "p-4 cursor-pointer hover:bg-slate-50 transition-colors group",
                                    selectedMessage?.id === msg.id ? "bg-indigo-50/50 border-l-4 border-l-indigo-500" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={cn("font-bold text-sm truncate pr-2 flex items-center gap-2", selectedMessage?.id === msg.id ? "text-indigo-900" : "text-slate-800")}>
                                        {msg.rawPayload?.labels?.includes('SENT') ? (
                                            <>
                                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                                To: {msg.rawPayload?.to?.split('<')[0].trim() || 'Unknown'}
                                            </>
                                        ) : (
                                            msg.from?.split('<')[0].trim() || 'Unknown'
                                        )}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                        {msg.receivedAt ? new Date(msg.receivedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 font-medium truncate mb-2">{msg.subject}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <Paperclip size={12} className="text-slate-400" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] uppercase font-bold rounded px-1.5 py-0.5",
                                        msg.classification?.type === 'Requirement' ? "bg-emerald-100 text-emerald-700" :
                                        msg.classification?.type === 'Vendor Submission' ? "bg-blue-100 text-blue-700" :
                                        "bg-slate-100 text-slate-700"
                                    )}>
                                        {msg.classification?.type || 'Processing'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* THREAD VIEW */}
        <div className="w-2/3 bg-[#F8FAFC] flex flex-col min-h-0">
            {selectedMessage ? (
                <>
                    <div className="p-6 bg-white border-b border-slate-200 shrink-0">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 mb-2">{selectedMessage.subject}</h2>
                                <div className="flex flex-col gap-1 text-sm text-slate-600 font-medium mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 w-10">From:</span> 
                                        <span className="font-bold text-slate-800">{selectedMessage.from}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400 w-10">To:</span> 
                                        <span className="font-bold text-slate-800">{selectedMessage.rawPayload?.to || 'Unknown'}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 mt-2">
                                    {selectedMessage.receivedAt ? new Date(selectedMessage.receivedAt).toLocaleString() : ''}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={runIntelligence}
                                    disabled={isAnalyzing}
                                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {isAnalyzing ? (
                                       <RefreshCw size={14} className="mr-2 animate-spin" />
                                    ) : (
                                       <Play size={14} className="mr-2" />
                                    )}
                                    Re-Process
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex gap-6 min-h-0">
                        {/* EMAIL BODY & ATTACHMENTS */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Original Message</h3>
                                <div 
                                    className="text-sm text-slate-700 whitespace-pre-wrap font-medium font-sans leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMessage.body || selectedMessage.snippet || "No body content available.") }}
                                />
                            </div>

                            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Attachments ({selectedMessage.attachments.length})</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedMessage.attachments.map((att: any, idx: number) => (
                                            <div key={idx} className="flex items-center p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 cursor-pointer group">
                                                <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-700">{att.filename || 'Document'}</p>
                                                    <p className="text-xs text-slate-500 truncate">{att.mimeType}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI CLASSIFICATION & TIMELINE PANEL */}
                        <div className="w-80 space-y-6 shrink-0">
                            {/* Classification Panel */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                                        <Database size={14} /> AI Classification
                                    </h3>
                                    <span className="px-2 py-1 bg-indigo-200 text-indigo-800 text-[10px] rounded uppercase font-bold">
                                        {selectedMessage.classification?.confidence || 0}% Conf
                                    </span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold mb-1">Intent</p>
                                        <p className="text-sm font-black text-slate-800">{selectedMessage.classification?.type || 'Unknown'}</p>
                                    </div>
                                    
                                    {selectedMessage.classification?.summary && (
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold mb-1">AI Summary</p>
                                            <p className="text-sm text-slate-700 font-medium leading-snug">{selectedMessage.classification?.summary}</p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-800 mb-2">Suggested Actions</h4>
                                        <div className="space-y-2">
                                            {selectedMessage.classification?.type === 'Requirement' ? (
                                                <button className="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center">
                                                    <Plus size={14} className="mr-2 text-emerald-600" /> Create Requirement
                                                </button>
                                            ) : selectedMessage.classification?.type === 'Vendor Submission' ? (
                                                <button className="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center">
                                                    <Plus size={14} className="mr-2 text-blue-600" /> Create Candidate
                                                </button>
                                            ) : (
                                                <button className="w-full text-left px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center">
                                                    <MessageSquare size={14} className="mr-2 text-indigo-600" /> Generate Reply
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Timeline */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock size={14} /> Business Flow
                                </h3>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-indigo-600 text-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            <CheckCircle2 size={12} />
                                        </div>
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-100 bg-slate-50 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="font-bold text-slate-800 text-xs">AI Parsed</div>
                                                <time className="font-medium text-[10px] text-slate-400">{selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</time>
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-500">{selectedMessage.classification?.type || 'Ingested'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className={cn("relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group", selectedMessage.classification?.type === 'Requirement' ? "is-active" : "")}>
                                        <div className={cn("flex items-center justify-center w-5 h-5 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2", selectedMessage.classification?.type === 'Requirement' ? "bg-emerald-500 text-white" : "bg-slate-300 text-white")}>
                                            {selectedMessage.classification?.type === 'Requirement' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        </div>
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-100 bg-slate-50 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="font-bold text-slate-800 text-xs">Candidates Found</div>
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-500">{selectedMessage.classification?.type === 'Requirement' ? 'Matched with Global Pool' : 'Waiting for Req'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className={cn("relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group", selectedMessage.classification?.type === 'Requirement' ? "is-active" : "")}>
                                        <div className={cn("flex items-center justify-center w-5 h-5 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2", selectedMessage.classification?.type === 'Requirement' ? "bg-blue-500 text-white" : "bg-slate-300 text-white")}>
                                            {selectedMessage.classification?.type === 'Requirement' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        </div>
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-lg border border-slate-100 bg-slate-50 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="font-bold text-slate-800 text-xs">Vendor Broadcast</div>
                                            </div>
                                            <div className="text-[10px] font-medium text-slate-500">{selectedMessage.classification?.type === 'Requirement' ? 'Published to Vendor Hub' : 'Pending'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Mail className="w-16 h-16 text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Select a Message</h3>
                    <p className="text-sm text-slate-500 mt-2">Choose a message from the list to view details and process it.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
