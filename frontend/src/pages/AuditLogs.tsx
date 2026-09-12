import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  RefreshCw,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { AuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDocId, setSearchDocId] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getAuditLogs(
        searchDocId || undefined,
        actionFilter || undefined
      );
      setLogs(data);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">APPROVED</span>;
    }
    if (action.includes('CORRECTED')) {
      return <span className="text-[10px] font-bold text-primary bg-primary-light border border-primary/30 px-2 py-0.5 rounded">HUMAN CORRECTION</span>;
    }
    if (action.includes('VERIFICATION_REQUIRED')) {
      return <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">GUARDRAIL FLAGGED</span>;
    }
    if (action.includes('REJECTED') || action.includes('DELETED')) {
      return <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">REJECTED</span>;
    }
    return <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{action}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchDocId}
            onChange={(e) => setSearchDocId(e.target.value)}
            placeholder="Filter by Document ID (e.g. DOC-1001)..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2 text-xs text-navy focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </form>

        <div className="flex items-center gap-2.5">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-navy font-semibold focus:outline-none focus:border-primary"
          >
            <option value="">All Action Types</option>
            <option value="APPROVED">Approvals</option>
            <option value="CORRECTED">Human Corrections</option>
            <option value="VERIFICATION">Verification Events</option>
            <option value="DELETED">Deletions</option>
          </select>

          <button
            onClick={fetchLogs}
            title="Refresh"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-border rounded-xl text-secondary hover:text-navy transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Logs Stream */}
      <div className="bg-white border border-border rounded-2xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
              Immutable Institutional Audit Trail
            </h3>
            <p className="text-xs text-secondary">
              Chronological log of AI inferences, human corrections, and approval transitions
            </p>
          </div>
          <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Compliance Verified
          </span>
        </div>

        <div className="divide-y divide-border">
          {loading ? (
            <div className="py-12 text-center text-secondary">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading audit records...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-secondary">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-xs">No audit events found</p>
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    {log.document_id && (
                      <span className="font-mono font-bold text-navy bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {log.document_id}
                      </span>
                    )}
                    <span className="text-secondary text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : 'Just now'}
                    </span>
                  </div>

                  <p className="text-navy font-semibold text-xs mt-1">{log.details}</p>

                  {/* Previous vs New Value Diff if available */}
                  {log.previous_value && log.new_value && (
                    <div className="flex items-center gap-2 text-xs font-mono pt-1">
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 line-through">
                        {log.previous_value}
                      </span>
                      <ArrowRight className="w-3 h-3 text-secondary" />
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        {log.new_value}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-secondary text-[11px] bg-slate-100 px-2.5 py-1 rounded-lg">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-navy">{log.user}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
