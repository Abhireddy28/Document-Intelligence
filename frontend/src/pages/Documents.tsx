import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { authService } from '../services/authService';
import { DocumentItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';

export const Documents: React.FC = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await documentService.getDocuments({
        type: selectedType,
        status: selectedStatus,
        search: search || undefined,
        page,
        page_size: 15,
      });
      setDocuments(data.documents);
      setTotal(data.total);
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedType, selectedStatus, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleDelete = async (docId: string) => {
    if (confirm(`Are you sure you want to delete document ${docId}?`)) {
      try {
        await documentService.deleteDocument(docId);
        fetchDocuments();
      } catch (e) {
        alert('Failed to delete document');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Card */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name, doc ID..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2 text-xs text-navy focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </form>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-navy font-semibold focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Types</option>
            <option value="MARKS_CARD">Marks Card</option>
            <option value="ATTENDANCE_SHEET">Attendance Sheet</option>
            <option value="CERTIFICATE">Certificate</option>
            <option value="CIRCULAR">Circular</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-navy font-semibold focus:outline-none focus:border-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Auto Approved</option>
            <option value="VERIFIED">Human Verified</option>
            <option value="VERIFICATION_REQUIRED">Verification Required</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={fetchDocuments}
            title="Refresh"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-border rounded-xl text-secondary hover:text-navy transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <Link
              to="/upload"
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Upload
            </Link>
          )}
        </div>
      </div>

      {/* Documents Table Card */}
      <div className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-[11px] font-bold text-secondary uppercase">
                <th className="py-3.5 px-4">Document Details</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Uploaded</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading institutional documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-secondary">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">No documents found matching filters</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy max-w-xs truncate">{doc.file_name}</div>
                      <div className="text-[10px] text-secondary font-mono">{doc.document_id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-navy bg-slate-100 px-2.5 py-1 rounded text-[11px]">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-secondary font-medium text-[11px]">
                      {doc.processing_method || 'DIRECT_TEXT'}
                    </td>
                    <td className="py-3.5 px-4 text-secondary text-[11px]">
                      {doc.upload_date ? doc.upload_date.replace('T', ' ').substring(0, 16) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <ConfidenceBar confidence={doc.overall_confidence} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isAdmin && doc.status === 'VERIFICATION_REQUIRED' && (
                          <Link
                            to="/verification"
                            title="Verify in Queue"
                            className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Verify
                          </Link>
                        )}
                        <Link
                          to={`/documents/${doc.document_id}`}
                          title="View Details"
                          className="p-1.5 hover:bg-primary-light text-primary rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(doc.document_id)}
                            title="Delete Document"
                            className="p-1.5 hover:bg-rose-50 text-secondary hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-border flex items-center justify-between text-xs text-secondary">
          <span>
            Showing <strong className="text-navy">{documents.length}</strong> of <strong className="text-navy">{total}</strong> records
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-border rounded font-semibold text-navy hover:bg-slate-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-navy">Page {page}</span>
            <button
              disabled={documents.length < 15}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-white border border-border rounded font-semibold text-navy hover:bg-slate-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
