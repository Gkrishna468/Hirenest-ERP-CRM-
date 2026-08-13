import { apiFetch } from '@/lib/api';
import type { Deal } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString } from '@/utils/safe';

export const PricingRepository = {
  async getDealById(id: string): Promise<Deal | null> {
    try {
      const res = await apiFetch(`/api/deals/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data || data.error) return null;
      return {
        id: id,
        jobId: data.jobId || data.job_id || '',
        candidateId: data.candidateId || data.candidate_id || '',
        vendorId: data.vendorId || data.vendor_id || '',
        clientId: data.clientId || data.client_id || '',
        clientName: data.clientName || data.client_name || '',
        jobTitle: data.jobTitle || data.job_title || '',
        candidateName: data.candidateName || data.candidate_name || '',
        status: data.status || 'prospect',
        offeredCtc: data.offeredCtc || data.offered_ctc || 0,
        finalCtc: data.finalCtc || data.final_ctc || 0,
        commissionPercent: data.commissionPercent || data.commission_percent || 0,
        revenueAmount: data.revenueAmount || data.revenue_amount || 0,
        vendorShare: data.vendorShare || data.vendor_share || 0,
        payoutAmount: data.payoutAmount || data.payout_amount || 0,
        profitAmount: data.profitAmount || data.profit_amount || 0,
        paymentReceived: data.paymentReceived || data.payment_received || false,
        joinedDate: data.joinedDate || data.joined_date || '',
        userId: data.userId || data.user_id || '',
        createdAt: safeISOString(data.createdAt || data.created_at),
        revenue_amount: data.revenueAmount || data.revenue_amount || 0,
      };
    } catch (error) {
      console.warn(`[PricingRepository.getDealById] Could not fetch deal ${id}:`, error);
      return null;
    }
  },
  async listDeals(): Promise<Deal[]> {
    try {
      const res = await apiFetch('/api/deals');
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      return docs.map((data: any) => {
        return {
          id: data.id,
          jobId: data.jobId || data.job_id || '',
          candidateId: data.candidateId || data.candidate_id || '',
          vendorId: data.vendorId || data.vendor_id || '',
          clientId: data.clientId || data.client_id || '',
          clientName: data.clientName || data.client_name || '',
          jobTitle: data.jobTitle || data.job_title || '',
          candidateName: data.candidateName || data.candidate_name || '',
          status: data.status || 'prospect',
          offeredCtc: data.offeredCtc || data.offered_ctc || 0,
          finalCtc: data.finalCtc || data.final_ctc || 0,
          commissionPercent: data.commissionPercent || data.commission_percent || 0,
          revenueAmount: data.revenueAmount || data.revenue_amount || 0,
          vendorShare: data.vendorShare || data.vendor_share || 0,
          payoutAmount: data.payoutAmount || data.payout_amount || 0,
          profitAmount: data.profitAmount || data.profit_amount || 0,
          paymentReceived: data.paymentReceived || data.payment_received || false,
          joinedDate: data.joinedDate || data.joined_date || '',
          userId: data.userId || data.user_id || '',
          createdAt: safeISOString(data.createdAt || data.created_at),
          revenue_amount: data.revenueAmount || data.revenue_amount || 0,
        };
      }).sort((a: Deal, b: Deal) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.warn("[PricingRepository.listDeals] Unable to list deals:", error);
      return [];
    }
  },
  async createDeal(data: Partial<Deal>): Promise<Deal> {
    const id = data.id || crypto.randomUUID();
    const deal: Deal = {
      id,
      jobId: data.jobId || '',
      candidateId: data.candidateId || '',
      vendorId: data.vendorId || '',
      clientId: data.clientId || '',
      clientName: data.clientName || '',
      jobTitle: data.jobTitle || '',
      candidateName: data.candidateName || '',
      status: data.status || 'prospect',
      offeredCtc: data.offeredCtc || 0,
      finalCtc: data.finalCtc || 0,
      commissionPercent: data.commissionPercent || 0,
      revenueAmount: data.revenueAmount || data.revenue_amount || 0,
      vendorShare: data.vendorShare || 0,
      payoutAmount: data.payoutAmount || 0,
      profitAmount: data.profitAmount || 0,
      paymentReceived: data.paymentReceived || false,
      joinedDate: data.joinedDate || '',
      userId: data.userId || '',
      createdAt: new Date().toISOString(),
      revenue_amount: data.revenueAmount || data.revenue_amount || 0,
    };
    try {
      await apiFetch('/api/deals', {
        method: 'POST',
        body: JSON.stringify({ payload: deal })
      });
      return deal;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `deals/${id}`);
      throw error;
    }
  },
  async updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
    try {
      await apiFetch(`/api/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload: updates })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `deals/${id}`);
    }
  },
  async deleteDeal(id: string): Promise<void> {
    try {
      await apiFetch(`/api/deals/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `deals/${id}`);
    }
  }
};
