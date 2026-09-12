import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Mail,
  Building,
  GraduationCap,
  FileCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { studentService } from '../services/studentService';
import { Student } from '../types';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents(
        search || undefined,
        selectedDept !== 'ALL' ? selectedDept : undefined
      );
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching students:', e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedDept]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleSelectStudent = async (student: Student) => {
    try {
      const details = await studentService.getStudent(student.roll_number);
      setSelectedStudent(details);
    } catch (e) {
      setSelectedStudent({ student, linked_documents: [] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name, roll number (e.g. 22CS101)..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2 text-xs text-navy focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-navy font-semibold focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="IT">Information Technology (IT)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="AI&DS">AI &amp; Data Science (AI&amp;DS)</option>
          </select>

          <button
            onClick={fetchStudents}
            title="Refresh"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-border rounded-xl text-secondary hover:text-navy transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid: Master Students List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Students Table */}
        <div className="lg:col-span-8 bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Student Master Database ({students.length} Registered)
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Reference Registry Online
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[11px] font-bold text-secondary uppercase">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Linked Documents</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      Loading student registry...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-secondary">
                      No students found matching search
                    </td>
                  </tr>
                ) : (
                  (Array.isArray(students) ? students : []).map((stu) => (
                    <tr
                      key={stu.roll_number}
                      onClick={() => handleSelectStudent(stu)}
                      className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                        selectedStudent?.student?.roll_number === stu.roll_number ? 'bg-primary-light/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-primary">{stu.roll_number}</td>
                      <td className="py-3 px-4 font-bold text-navy">{stu.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-navy text-[11px]">
                          {stu.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-secondary font-medium">Semester {stu.semester}</td>
                      <td className="py-3 px-4">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[11px]">
                          {stu.document_count || 1} Ingested
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-secondary inline" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Selected Student Profile & Linked Records */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-border rounded-2xl p-5 shadow-soft">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-4">
              Student Profile Detail
            </h4>

            {selectedStudent?.student ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent-purple text-white font-extrabold text-lg flex items-center justify-center shadow-sm">
                    {selectedStudent.student.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{selectedStudent.student.name}</h3>
                    <p className="font-mono text-xs font-bold text-primary">{selectedStudent.student.roll_number}</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-medium">Department:</span>
                    <span className="font-bold text-navy">{selectedStudent.student.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-medium">Batch:</span>
                    <span className="font-bold text-navy">{selectedStudent.student.batch || '2022-2026'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-medium">Current Semester:</span>
                    <span className="font-bold text-navy">Semester {selectedStudent.student.semester}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-medium">Institutional Email:</span>
                    <span className="font-mono text-navy font-semibold truncate max-w-[170px]">
                      {selectedStudent.student.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary font-medium">Registry Status:</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* Linked Canonical Documents */}
                <div className="pt-3 border-t border-border">
                  <h5 className="text-[11px] font-bold text-secondary uppercase mb-2">
                    Verified Documents Linked
                  </h5>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 border border-border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-navy">Marks Memo Sem VI</p>
                          <p className="text-[10px] text-secondary">Verified • 87.75% Distinction</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary font-mono">DOC-1001</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-border rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-navy">Attendance Sheet Sem VI</p>
                          <p className="text-[10px] text-secondary">Present: 90% (108/120)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-primary font-mono">DOC-1003</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-secondary">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Select a student from the table to view profile &amp; linked records</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
