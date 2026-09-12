import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  RotateCcw,
  CheckSquare,
  Download,
  ExternalLink,
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Code,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { authService } from '../services/authService';
import { DocumentItem, ExtractionData } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { DocumentViewer } from '../components/DocumentViewer';

export const DocumentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'canonical' | 'timeline'>('fields');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [docData, extData] = await Promise.all([
        documentService.getDocument(id),
        documentService.getExtraction(id).catch(() => null),
      ]);
      setDoc(docData);
      setExtraction(extData);
    } catch (e) {
      console.error('Error fetching document details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRetry = async () => {
    if (!id) return;
    setRetrying(true);
    try {
      await documentService.retryDocument(id);
      await fetchDetails();
    } catch (e) {
      alert('Failed to re-run extraction');
    } finally {
      setRetrying(false);
    }
  };

  const handleDownloadCanonical = () => {
    if (!extraction?.canonical_data) return;
    const blob = new Blob([JSON.stringify(extraction.canonical_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canonical_${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-xs">Loading document intelligence profile...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="bg-white border border-border rounded-2xl p-12 text-center">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-navy">Document Not Found</h3>
        <Link to="/documents" className="text-xs font-bold text-primary mt-2 inline-block">
          Return to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white border border-border rounded-xl text-secondary hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy truncate max-w-md">{doc.file_name}</h2>
              <StatusBadge status={doc.status} size="sm" />
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Doc ID: <span className="font-mono text-navy font-semibold">{doc.document_id}</span> • Type:{' '}
              <span className="font-semibold text-navy">{doc.document_type}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isAdmin && doc.status === 'VERIFICATION_REQUIRED' && (
            <Link
              to="/verification"
              className="bg-status-warning hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Verify in Queue
            </Link>
          )}

          {isAdmin && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="bg-white border border-border hover:bg-slate-50 text-navy text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-soft transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-primary ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Processing...' : 'Retry Extraction'}
            </button>
          )}

          {extraction?.canonical_data && (
            <button
              onClick={handleDownloadCanonical}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Canonical JSON
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Side (Data Tabs) & Right Side (Document Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Extracted Data / Canonical JSON / Timeline */}
        <div className="lg:col-span-7 space-y-4">
          {/* Metadata Card */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-soft">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary">Document Type</span>
                <p className="font-bold text-navy mt-0.5">{doc.document_type}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary">Extraction Method</span>
                <p className="font-bold text-navy mt-0.5">{doc.processing_method || 'DIRECT_TEXT'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary">Overall Confidence</span>
                <div className="mt-1">
                  <ConfidenceBar confidence={doc.overall_confidence} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-secondary">Status</span>
                <div className="mt-1">
                  <StatusBadge status={doc.status} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Container */}
          <div className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-border bg-slate-50/50 p-2 gap-1.5 text-xs font-bold">
              <button
                onClick={() => setActiveTab('fields')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'fields' ? 'bg-white text-primary shadow-2xs border border-border' : 'text-secondary hover:text-navy'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Extracted Fields
              </button>
              <button
                onClick={() => setActiveTab('canonical')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'canonical' ? 'bg-white text-primary shadow-2xs border border-border' : 'text-secondary hover:text-navy'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Canonical Agent Model
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeTab === 'timeline' ? 'bg-white text-primary shadow-2xs border border-border' : 'text-secondary hover:text-navy'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Processing Timeline
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-5">
              {activeTab === 'fields' && (
                <div className="space-y-4">
                  {extraction?.extracted_fields ? (
                    <div className="space-y-3">
                      {/* Critical Student Info */}
                      <div className="bg-slate-50 border border-border rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs border-b border-border pb-2">
                          <span className="font-bold text-navy">Student Information</span>
                          <span className="text-[10px] text-secondary font-semibold">Master Registry Validated</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-secondary text-[11px]">Student Name:</span>
                            <p className="font-bold text-navy">{extraction.extracted_fields.student_name?.value || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-secondary text-[11px]">Roll Number:</span>
                            <div className="flex items-center gap-2">
                              <p className="font-bold font-mono text-navy">{extraction.extracted_fields.roll_number?.value || 'N/A'}</p>
                              {extraction.extracted_fields.roll_number?.validation_status === 'FAILED' && (
                                <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">
                                  Registry Mismatch
                                </span>
                              )}
                            </div>
                            {extraction.extracted_fields.roll_number?.suggested_value && (
                              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                Suggested Match: {extraction.extracted_fields.roll_number.suggested_value}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subjects & Marks Table if Marks Card */}
                      {extraction.extracted_fields.subjects && (
                        <div className="border border-border rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-3.5 py-2 border-b border-border text-xs font-bold text-navy">
                            Subject Marks Breakdown
                          </div>
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100/60 border-b border-border text-[10px] font-bold text-secondary uppercase">
                                <th className="p-2.5">Code</th>
                                <th className="p-2.5">Subject</th>
                                <th className="p-2.5">Internal</th>
                                <th className="p-2.5">External</th>
                                <th className="p-2.5">Total</th>
                                <th className="p-2.5">Grade</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {extraction.extracted_fields.subjects.map((sub: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2.5 font-mono text-secondary">{sub.subject_code}</td>
                                  <td className="p-2.5 font-bold text-navy">{sub.subject_name}</td>
                                  <td className="p-2.5 text-navy font-semibold">{sub.internal_marks}</td>
                                  <td className="p-2.5 text-navy font-semibold">{sub.external_marks}</td>
                                  <td className="p-2.5 text-navy font-bold">{sub.total_marks}</td>
                                  <td className="p-2.5 font-bold text-emerald-700">{sub.grade}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Batch Attendance Records Table if Attendance Sheet */}
                      {extraction.extracted_fields.records && extraction.extracted_fields.records.length > 0 && (
                        <div className="border border-border rounded-xl overflow-hidden mt-3">
                          <div className="bg-slate-50 px-3.5 py-2.5 border-b border-border flex items-center justify-between">
                            <span className="text-xs font-bold text-navy">
                              Batch Student Attendance Registry ({extraction.extracted_fields.records.length} Students)
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Master Registry Verified
                            </span>
                          </div>
                          <div className="overflow-x-auto max-h-72">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs">
                                <tr className="border-b border-border text-[10px] font-bold text-secondary uppercase">
                                  <th className="p-2.5">Roll No</th>
                                  <th className="p-2.5">Student Name</th>
                                  <th className="p-2.5">Present</th>
                                  <th className="p-2.5">Absent</th>
                                  <th className="p-2.5">Attendance %</th>
                                  <th className="p-2.5 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {extraction.extracted_fields.records.map((rec: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-2.5 font-mono font-bold text-primary">{rec.roll_number}</td>
                                    <td className="p-2.5 font-bold text-navy">{rec.student_name}</td>
                                    <td className="p-2.5 text-navy font-semibold">{rec.present} / {rec.total_classes}</td>
                                    <td className="p-2.5 text-secondary font-medium">{rec.absent}</td>
                                    <td className="p-2.5 font-bold">
                                      <span className={rec.attendance_percentage >= 75 ? 'text-emerald-700' : 'text-amber-700'}>
                                        {rec.attendance_percentage}%
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-right">
                                      {rec.validation_status === 'PASSED' ? (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                          PASSED
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                          FLAGGED
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Certificate Details View */}
                      {extraction.extracted_fields.certificate_number && (
                        <div className="bg-slate-50 border border-border rounded-xl p-4 space-y-2 mt-3">
                          <span className="text-[10px] font-bold text-secondary uppercase">Certificate Information</span>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-secondary text-[11px]">Certificate Type:</span>
                              <p className="font-bold text-navy">{extraction.extracted_fields.certificate_type?.value}</p>
                            </div>
                            <div>
                              <span className="text-secondary text-[11px]">Certificate Number:</span>
                              <p className="font-mono font-bold text-primary">{extraction.extracted_fields.certificate_number?.value}</p>
                            </div>
                            <div>
                              <span className="text-secondary text-[11px]">Issuer:</span>
                              <p className="font-bold text-navy">{extraction.extracted_fields.issuer?.value}</p>
                            </div>
                            <div>
                              <span className="text-secondary text-[11px]">Issue Date:</span>
                              <p className="font-bold text-navy">{extraction.extracted_fields.issue_date?.value}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary Key Values */}
                      <div className="grid grid-cols-3 gap-2.5 pt-1">
                        {extraction.extracted_fields.total_marks && (
                          <div className="bg-primary-light/40 border border-primary/20 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-secondary">Total Marks</span>
                            <p className="text-base font-extrabold text-navy mt-0.5">
                              {extraction.extracted_fields.total_marks.value}
                            </p>
                          </div>
                        )}
                        {extraction.extracted_fields.percentage && (
                          <div className="bg-primary-light/40 border border-primary/20 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-secondary">Percentage</span>
                            <p className="text-base font-extrabold text-navy mt-0.5">
                              {extraction.extracted_fields.percentage.value}%
                            </p>
                          </div>
                        )}
                        {extraction.extracted_fields.result && (
                          <div className="bg-primary-light/40 border border-primary/20 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-secondary">Result</span>
                            <p className="text-sm font-extrabold text-emerald-700 mt-1">
                              {extraction.extracted_fields.result.value}
                            </p>
                          </div>
                        )}
                        {extraction.extracted_fields.total_students && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-emerald-800">Total Students</span>
                            <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                              {extraction.extracted_fields.total_students} Rows
                            </p>
                          </div>
                        )}
                        {extraction.extracted_fields.attendance_percentage && !extraction.extracted_fields.total_marks && (
                          <div className="bg-primary-light/40 border border-primary/20 rounded-xl p-3 text-center">
                            <span className="text-[10px] font-bold text-secondary">Average Attendance</span>
                            <p className="text-base font-extrabold text-primary mt-0.5">
                              {extraction.extracted_fields.attendance_percentage.value}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-secondary">No structured fields extracted yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'canonical' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy">Canonical Data Model (Ready for AI Agents)</span>
                    <span className="text-[10px] font-mono text-secondary">Schema: v1.0.0</span>
                  </div>
                  <pre className="bg-navy text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-96 shadow-inner">
                    {JSON.stringify(extraction?.canonical_data || {}, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {doc.processing_timeline?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-navy">{step.step}</p>
                        {step.details && <p className="text-secondary text-[11px] mt-0.5">{step.details}</p>}
                        <span className="text-[10px] text-slate-400">{step.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Original Document Preview */}
        <div className="lg:col-span-5 h-full">
          <DocumentViewer
            previewUrl={doc.preview_url}
            fileName={doc.file_name}
            fileType={doc.file_type}
            highlightBbox={
              extraction?.extracted_fields?.roll_number?.source?.bbox || [190, 220, 320, 240]
            }
          />
        </div>
      </div>
    </div>
  );
};
