import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Edit3,
  AlertTriangle,
  RefreshCw,
  Eye,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react';
import { verificationService } from '../services/verificationService';
import { VerificationItem } from '../types';
import { ConfidenceBar } from '../components/ConfidenceBar';

export const VerificationQueue: React.FC = () => {
  const [queue, setQueue] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [editingItem, setEditingItem] = useState<VerificationItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await verificationService.getQueue(statusFilter);
      setQueue(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching verification queue:', e);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleAcceptSuggested = async (item: VerificationItem) => {
    const valToAccept = String(item.suggested_value ?? item.extracted_value ?? '');
    setActionLoading(item.verification_id);
    try {
      await verificationService.correctItem(item.verification_id, valToAccept, 'Accepted suggested OCR match');
      await fetchQueue();
    } catch (e) {
      alert('Failed to accept suggestion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveOriginal = async (item: VerificationItem) => {
    setActionLoading(item.verification_id);
    try {
      await verificationService.approveItem(item.verification_id);
      await fetchQueue();
    } catch (e) {
      alert('Failed to approve item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (item: VerificationItem) => {
    if (confirm(`Reject field extraction for document ${item.file_name}?`)) {
      setActionLoading(item.verification_id);
      try {
        await verificationService.rejectItem(item.verification_id, 'Rejected by human verifier');
        await fetchQueue();
      } catch (e) {
        alert('Failed to reject item');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !String(editValue).trim()) return;
    setActionLoading(editingItem.verification_id);
    try {
      await verificationService.correctItem(editingItem.verification_id, String(editValue).trim(), 'Manual human correction');
      setEditingItem(null);
      await fetchQueue();
    } catch (e) {
      alert('Failed to save correction');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm('Approve all pending verification items and mark their documents as verified?')) return;
    setActionLoading('ALL');
    try {
      await verificationService.approveAll();
      await fetchQueue();
    } catch (e) {
      alert('Failed to approve all items');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-status-warning text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-900">Institutional Confidence Guardrail Active (0.90 Threshold)</h2>
            <p className="text-xs text-amber-800 mt-0.5">
              Documents are routed here when any field falls below 90% confidence or fails validation checks. Each row represents a single failing field or student record.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {queue.filter((i) => i.status === 'PENDING').length > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={actionLoading === 'ALL'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              Approve All Pending ({queue.filter((i) => i.status === 'PENDING').length})
            </button>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-navy font-semibold focus:outline-none"
          >
            <option value="PENDING">Pending Review</option>
            <option value="CORRECTED">Corrected</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Items</option>
          </select>
          <button
            onClick={fetchQueue}
            title="Refresh"
            className="p-2 bg-white border border-amber-300 rounded-xl text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-[11px] font-bold text-secondary uppercase">
                <th className="py-3.5 px-4">Document / Target Field</th>
                <th className="py-3.5 px-4">Extracted Value</th>
                <th className="py-3.5 px-4" title="Individual confidence score for this specific extracted field/row">
                  Field Confidence
                </th>
                <th className="py-3.5 px-4">Validation Issue & Reason</th>
                <th className="py-3.5 px-4">Suggested Match</th>
                <th className="py-3.5 px-4 text-right">Verification Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading verification queue...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-bold text-navy">Verification Queue Empty</p>
                    <p className="text-xs text-secondary mt-0.5">All ingested records satisfy the confidence threshold</p>
                  </td>
                </tr>
              ) : (
                (Array.isArray(queue) ? queue : []).map((item) => (
                  <tr key={item.verification_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy truncate max-w-xs">{item.file_name}</div>
                      <div className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-0.5">
                        <span>{item.field_label}</span>
                        <span className="text-secondary font-normal font-mono">({item.field_name})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                        {item.extracted_value}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ConfidenceBar confidence={item.confidence} />
                    </td>
                    <td className="py-3.5 px-4 text-secondary max-w-xs">
                      <p className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        {item.validation_message || 'Confidence below threshold'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.suggested_value ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex items-center gap-1 w-fit">
                          <Check className="w-3 h-3" /> {item.suggested_value}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {item.suggested_value ? (
                            <button
                              onClick={() => handleAcceptSuggested(item)}
                              disabled={actionLoading === item.verification_id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept Suggested
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveOriginal(item)}
                              disabled={actionLoading === item.verification_id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setEditValue(String(item.suggested_value ?? item.extracted_value ?? ''));
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-navy font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-primary" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            disabled={actionLoading === item.verification_id}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                          <Link
                            to={`/verification/${item.verification_id}`}
                            title="Split-Screen Inspect"
                            className="p-1.5 hover:bg-primary-light text-primary rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-secondary">
                          {item.status}: {item.corrected_value || item.extracted_value}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-border rounded-2xl p-6 max-w-md w-full shadow-modal">
            <h3 className="text-sm font-bold text-navy mb-1">Manual Field Correction</h3>
            <p className="text-xs text-secondary mb-4">
              Correcting <strong className="text-navy">{editingItem.field_label}</strong> for{' '}
              <span className="font-mono">{editingItem.file_name}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Original Extracted</label>
                <input
                  type="text"
                  disabled
                  value={editingItem.extracted_value}
                  className="w-full bg-slate-100 border border-border rounded-xl px-3 py-2 text-xs font-mono text-secondary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-navy mb-1">Corrected Value</label>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-xs font-mono font-bold text-navy focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-secondary text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading === editingItem.verification_id}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
              >
                Save &amp; Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
