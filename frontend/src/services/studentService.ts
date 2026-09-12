import { api } from './api';
import { Student } from '../types';

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
