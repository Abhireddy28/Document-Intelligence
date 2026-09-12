import { api } from './api';
import { VerificationItem } from '../types';

export const verificationService = {
  async getQueue(status: string = 'PENDING'): Promise<VerificationItem[]> {
    const res = await api.get('/verification', { params: { status } });
    return res.data;
  },

  async getItem(verificationId: string): Promise<VerificationItem> {
    const res = await api.get(`/verification/${verificationId}`);
    return res.data;
  },

  async approveItem(verificationId: string): Promise<any> {
    const res = await api.post(`/verification/${verificationId}/approve`);
    return res.data;
  },

  async rejectItem(verificationId: string, reason?: string): Promise<any> {
    const res = await api.post(`/verification/${verificationId}/reject`, { action: 'REJECT', reason });
    return res.data;
  },

  async correctItem(verificationId: string, correctedValue: any, reason?: string): Promise<any> {
    const res = await api.post(`/verification/${verificationId}/correct`, {
      action: 'CORRECT',
      corrected_value: correctedValue,
      reason,
    });
    return res.data;
  },

  async approveAll(): Promise<any> {
    const res = await api.post('/verification/approve-all');
    return res.data;
  },

  async approveDocumentAll(documentId: string): Promise<any> {
    const res = await api.post(`/verification/document/${documentId}/approve-all`);
    return res.data;
  },
};
