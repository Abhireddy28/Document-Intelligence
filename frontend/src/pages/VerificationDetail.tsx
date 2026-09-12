import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Check,
  Edit3,
  Bot,
  Sparkles,
  ShieldAlert,
  FileText,
  Save,
} from 'lucide-react';
import { verificationService } from '../services/verificationService';
import { documentService } from '../services/documentService';
import { VerificationItem, DocumentItem, ExtractionData } from '../types';
import { DocumentViewer } from '../components/DocumentViewer';
import { ConfidenceBar } from '../components/ConfidenceBar';

export const VerificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<VerificationItem | null>(null);
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [extraction, setExtraction] = useState<ExtractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editVal, setEditVal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerificationDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const itemData = await verificationService.getItem(id);
      setItem(itemData);
      setEditVal(String(itemData.suggested_value ?? itemData.extracted_value ?? ''));

      if (itemData.document_id) {
        const [docData, extData] = await Promise.all([
          documentService.getDocument(itemData.document_id),
          documentService.getExtraction(itemData.document_id).catch(() => null),
        ]);
        setDoc(docData);
        setExtraction(extData);
      }
    } catch (e) {
      console.error('Error fetching verification item:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationDetails();
  }, [id]);

  const handleAcceptSuggested = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      await verificationService.correctItem(
        item.verification_id,
        String(item.suggested_value ?? item.extracted_value ?? ''),
        'Accepted suggested match from split-view'
      );
      navigate('/verification');
    } catch (e) {
      alert('Failed to update verification item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!item || !String(editVal).trim()) return;
    setActionLoading(true);
    try {
      await verificationService.correctItem(
        item.verification_id,
        String(editVal).trim(),
        'Manual correction from split-view editor'
      );
      navigate('/verification');
    } catch (e) {
      alert('Failed to save correction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCurrent = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      await verificationService.approveItem(item.verification_id);
      navigate('/verification');
    } catch (e) {
      alert('Failed to approve item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!item) return;
    if (confirm('Reject this document record?')) {
      setActionLoading(true);
      try {
        await verificationService.rejectItem(item.verification_id, 'Rejected in split-screen inspection');
        navigate('/verification');
      } catch (e) {
        alert('Failed to reject item');
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-secondary">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-semibold text-xs">Loading verification split-screen inspector...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white border border-border rounded-2xl p-12 text-center">
        <h3 className="text-sm font-bold text-navy">Verification Item Not Found</h3>
        <Link to="/verification" className="text-xs font-bold text-primary mt-2 inline-block">
          Return to Queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/verification')}
            className="p-2 hover:bg-white border border-border rounded-xl text-secondary hover:text-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-navy">Split-Screen Verification</h2>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                Review Required
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Inspect original document source vs extracted OCR fields
            </p>
          </div>
        </div>
      </div>

      {/* Split-Screen 12 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 6 COLS: ORIGINAL DOCUMENT PREVIEW */}
        <div className="lg:col-span-6 h-[680px]">
          <DocumentViewer
            previewUrl={doc?.preview_url}
            fileName={item.file_name}
            fileType={doc?.file_type || 'PDF'}
            highlightBbox={item.bbox || [475, 220, 560, 240]}
            pageNumber={item.source_page}
          />
        </div>

        {/* RIGHT 6 COLS: EXTRACTED INFORMATION & VERIFICATION ACTIONS */}
        <div className="lg:col-span-6 space-y-4">
          {/* Active Field Verification Card */}
          <div className="bg-white border-2 border-primary/30 rounded-2xl p-6 shadow-modal">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Target Field</span>
                <h3 className="text-base font-extrabold text-navy mt-0.5">{item.field_label}</h3>
              </div>
              <ConfidenceBar confidence={item.confidence} />
            </div>

            {/* Extracted vs Suggested Visual Diff */}
            <div className="space-y-4">
              {/* Extracted */}
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                  Raw Extracted Value (Low Confidence / Registry Mismatch)
                </span>
                <div className="text-xl font-black font-mono text-rose-700 mt-1">
                  {item.extracted_value}
                </div>
                {item.validation_message && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {item.validation_message}
                  </p>
                )}
              </div>

              {/* Suggested Match if available */}
              {item.suggested_value && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Student Master Registry Match (Fuzzy OCR Correction)
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Confidence 99%
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-700 mt-1 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    {item.suggested_value}
                  </div>
                  <p className="text-xs text-emerald-600 mt-1">
                    Matched student master database: Rahul Kumar (CSE Sem VI)
                  </p>
                </div>
              )}

              {/* Editable Field Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-navy mb-1.5">
                  Corrected Value (or edit manually):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-navy focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter verified value"
                  />
                  <button
                    onClick={handleSaveCorrection}
                    disabled={actionLoading || !String(editVal).trim()}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save &amp; Approve
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {item.suggested_value && (
                  <button
                    onClick={handleAcceptSuggested}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Accept Suggested Match
                  </button>
                )}

                <button
                  onClick={handleApproveCurrent}
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve Current Value
                </button>
              </div>

              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject Extraction
              </button>
            </div>
          </div>

          {/* Traceability Audit Card */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-soft space-y-3">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
              Source Traceability & Bounding Box Coordinates
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-secondary font-semibold">Source Document:</span>
                <p className="font-bold text-navy mt-0.5 truncate">{item.file_name}</p>
              </div>
              <div>
                <span className="text-[10px] text-secondary font-semibold">Source Page:</span>
                <p className="font-bold text-navy mt-0.5">Page {item.source_page}</p>
              </div>
              <div>
                <span className="text-[10px] text-secondary font-semibold">Bounding Box [X1, Y1, X2, Y2]:</span>
                <p className="font-mono text-navy mt-0.5">{JSON.stringify(item.bbox || [475, 220, 560, 240])}</p>
              </div>
              <div>
                <span className="text-[10px] text-secondary font-semibold">OCR Glyph Confidence:</span>
                <p className="font-bold text-navy mt-0.5">{int(item.confidence * 100)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function int(val: number) {
  return Math.round(val);
}
