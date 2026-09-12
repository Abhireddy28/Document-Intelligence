import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bot,
  Sparkles,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { documentService } from '../services/documentService';
import { DocumentItem } from '../types';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { StatusBadge } from '../components/StatusBadge';

export const Processing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const fetchDocumentStatus = async () => {
    if (!id) return;
    try {
      const data = await documentService.getDocument(id);
      setDoc(data);
    } catch (e) {
      console.error('Error fetching document status:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!id || retrying) return;
    setRetrying(true);
    try {
      await documentService.retryDocument(id);
      await fetchDocumentStatus();
    } catch (e) {
      console.error('Error retrying processing:', e);
    } finally {
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchDocumentStatus();
    const interval = setInterval(fetchDocumentStatus, 2000);
    return () => clearInterval(interval);
  }, [id]);

  const defaultPipelineSteps = [
    { name: 'Document Ingestion', desc: 'Securely saved and preliminary metadata extracted' },
    { name: 'Document Classification', desc: '4-stage classification (Marks Card / Attendance / Certificate / Circular)' },
    { name: 'Extraction Method Selection', desc: 'Direct Text / PaddleOCR / pdfplumber Tables / Spreadsheet Engine' },
    { name: 'Field-Specific Extraction', desc: 'Student info, subject marks, attendance records & arithmetic validation' },
    { name: 'Multi-Signal Confidence Scoring', desc: 'OCR weight (60%) + Format (20%) + Student Registry (20%)' },
    { name: 'Guardrail & Canonical Model', desc: 'Enforcing 0.90 threshold -> Auto-Approve or Verification Queue' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-navy">{doc?.file_name || 'Processing Document...'}</h2>
                {doc?.status && <StatusBadge status={doc.status} size="sm" />}
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Document ID: <span className="font-semibold text-navy">{id}</span> • Type:{' '}
                <span className="font-semibold text-navy">{doc?.document_type || 'Detecting...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {doc?.overall_confidence !== undefined && doc.overall_confidence > 0 && (
              <ConfidenceBar confidence={doc.overall_confidence} />
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Steps Tracker */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-soft">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-purple" />
          Autonomous Processing Timeline
        </h3>

        <div className="space-y-6">
          {(doc?.processing_timeline && doc.processing_timeline.length > 0
            ? doc.processing_timeline
            : defaultPipelineSteps.map((s) => ({
                step: s.name,
                status: 'COMPLETED',
                timestamp: 'Just now',
                details: s.desc,
              }))
          ).map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                      : step.status === 'IN_PROGRESS'
                      ? 'bg-primary text-white animate-pulse'
                      : 'bg-slate-100 text-secondary border border-border'
                  }`}
                >
                  {step.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                {idx < (doc?.processing_timeline?.length || 6) - 1 && (
                  <div className="w-0.5 h-8 bg-border mt-1"></div>
                )}
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-navy">{step.step}</h4>
                  <span className="text-[10px] text-secondary font-medium">{step.timestamp}</span>
                </div>
                {step.details && <p className="text-xs text-secondary mt-0.5">{step.details}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Routing Action */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-navy">
              {doc?.status === 'FAILED' ? 'Processing Interrupted' : 'Pipeline Completed'}
            </p>
            <p className="text-[11px] text-secondary">
              {doc?.status === 'VERIFICATION_REQUIRED'
                ? 'Confidence below 0.90 threshold or validation warning. Routed to Verification Queue.'
                : doc?.status === 'FAILED'
                ? 'File was uploaded before path resolution update. Click Retry to re-run pipeline.'
                : 'All criteria passed. Canonical data model generated for institutional agents.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {doc?.status === 'FAILED' ? (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Retrying...' : 'Retry Processing'}</span>
              </button>
            ) : doc?.status === 'VERIFICATION_REQUIRED' ? (
              <Link
                to={`/verification`}
                className="bg-status-warning hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
              >
                Go to Verification Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to={`/documents/${id}`}
                className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
              >
                View Document Details <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
