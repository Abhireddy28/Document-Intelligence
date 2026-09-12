import { api } from './api';
import { Student, DashboardStats, DashboardCharts, ExtractionQualityReport, AuditLog } from '../types';

export const studentService = {
  async getStudents(search?: string, department?: string): Promise<Student[]> {
    const res = await api.get('/students', { params: { search, department } });
    return res.data;
  },

  async getStudent(rollNumber: string): Promise<{ student: Student; linked_documents: any[] }> {
    const res = await api.get(`/students/${rollNumber}`);
    return res.data;
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  async getRecent(): Promise<any[]> {
    const res = await api.get('/dashboard/recent');
    return res.data;
  },

  async getCharts(): Promise<DashboardCharts> {
    const res = await api.get('/dashboard/charts');
    return res.data;
  },

  async getQualityReport(): Promise<ExtractionQualityReport> {
    const res = await api.get('/reports/extraction-quality');
    return res.data;
  },

  async getAuditLogs(documentId?: string, action?: string): Promise<AuditLog[]> {
    const res = await api.get('/audit-logs', { params: { document_id: documentId, action } });
    return res.data;
  },
};
