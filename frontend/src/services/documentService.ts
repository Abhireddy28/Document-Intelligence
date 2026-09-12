import { api } from './api';
import { DocumentItem, ExtractionData, CanonicalDocument } from '../types';

export const documentService = {
  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getDocuments(params?: {
    type?: string;
    status?: string;
    min_confidence?: number;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ total: number; page: number; page_size: number; documents: DocumentItem[] }> {
    try {
      const res = await api.get('/documents', { params });
      return {
        total: res.data?.total || 0,
        page: res.data?.page || 1,
        page_size: res.data?.page_size || 20,
        documents: Array.isArray(res.data?.documents) ? res.data.documents : []
      };
    } catch (e) {
      console.warn('Error fetching documents:', e);
      return { total: 0, page: 1, page_size: 20, documents: [] };
    }
  },

  async getDocument(documentId: string): Promise<DocumentItem> {
    const res = await api.get(`/documents/${documentId}`);
    return res.data;
  },

  async getExtraction(documentId: string): Promise<ExtractionData> {
    const res = await api.get(`/documents/${documentId}/extraction`);
    return res.data;
  },

  async getCanonicalData(documentId: string): Promise<CanonicalDocument> {
    const res = await api.get(`/documents/${documentId}/canonical`);
    return res.data;
  },

  async processDocument(documentId: string): Promise<{ message: string; document: DocumentItem }> {
    const res = await api.post(`/documents/${documentId}/process`);
    return res.data;
  },

  async retryDocument(documentId: string): Promise<{ message: string; document: DocumentItem }> {
    const res = await api.post(`/documents/${documentId}/retry`);
    return res.data;
  },

  async deleteDocument(documentId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/documents/${documentId}`);
    return res.data;
  },
};
