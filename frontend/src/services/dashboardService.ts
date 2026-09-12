import { api } from './api';
import { Student, DashboardStats, DashboardCharts, ExtractionQualityReport, AuditLog } from '../types';

export const studentService = {
  async getStudents(search?: string, department?: string): Promise<Student[]> {
    try {
      const res = await api.get('/students', { params: { search, department } });
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn('Error fetching students:', e);
      return [];
    }
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
    try {
      const res = await api.get('/dashboard/recent');
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn('Error fetching recent docs:', e);
      return [];
    }
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
    try {
      const res = await api.get('/audit-logs', { params: { document_id: documentId, action } });
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.warn('Error fetching audit logs:', e);
      return [];
    }
  },
};
