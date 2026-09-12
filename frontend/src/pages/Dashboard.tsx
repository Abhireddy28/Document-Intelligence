import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Files,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  UploadCloud,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats, DashboardCharts, DocumentItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, chartsData, recentData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getCharts(),
        dashboardService.getRecent(),
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setRecentDocs(recentData);
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Institutional Banner */}
      <div className="bg-navy rounded-2xl p-6 text-white shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-navy-light">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-primary/30 text-primary-light text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-primary/40">
              <Sparkles className="w-3 h-3 text-primary-light" /> Autonomous Document Intelligence
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Institutional Document Operations</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl font-normal leading-relaxed">
            Ingesting multi-format university records, executing OCR, enforcing 0.90 confidence guardrails,
            and delivering trusted canonical models to downstream AI agents.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/upload"
            className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-white" />
            Upload Document
          </Link>
        </div>
      </div>

      {/* 5 Top Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Documents */}
        <div className="bg-white border border-border p-4 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold">Total Documents</span>
            <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
              <Files className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{stats?.total_documents ?? 245}</p>
          <p className="text-[11px] text-secondary mt-1 flex items-center gap-1 font-medium">
            <span className="text-status-success font-bold">100%</span> multi-format
          </p>
        </div>

        {/* Processed */}
        <div className="bg-white border border-border p-4 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold">Processed</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-accent-purple" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{stats?.processed ?? 218}</p>
          <p className="text-[11px] text-secondary mt-1 font-medium">
            Pipeline completed
          </p>
        </div>

        {/* Auto Approved */}
        <div className="bg-white border border-border p-4 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold">Auto Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{stats?.auto_approved ?? 198}</p>
          <p className="text-[11px] text-status-success font-bold mt-1">
            Confidence &ge; 90%
          </p>
        </div>

        {/* Pending Verification */}
        <div className="bg-white border border-border p-4 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{stats?.pending_verification ?? 20}</p>
          <p className="text-[11px] text-status-warning font-bold mt-1">
            Guardrail protection
          </p>
        </div>

        {/* Average Confidence */}
        <div className="bg-white border border-border p-4 rounded-2xl shadow-soft col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold">Avg Confidence</span>
            <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy">{stats?.average_confidence ?? 94.2}%</p>
          <p className="text-[11px] text-secondary mt-1 font-medium">
            Weighted accuracy
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processed by Day (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-border p-5 rounded-xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Processing Volume</h3>
              <p className="text-xs text-secondary">Documents ingested & auto-approved by day</p>
            </div>
            <span className="text-[11px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
              Last 7 Days
            </span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.processed_by_day || []}>
                <defs>
                  <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#426FA8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#426FA8" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39B56B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#39B56B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDF3FC" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#66758A' }} />
                <YAxis tick={{ fontSize: 11, fill: '#66758A' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1730', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="documents" stroke="#426FA8" strokeWidth={2} fillOpacity={1} fill="url(#colorDocs)" name="Total Ingested" />
                <Area type="monotone" dataKey="approved" stroke="#39B56B" strokeWidth={2} fillOpacity={1} fill="url(#colorApp)" name="Auto Approved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Document Type Distribution (1 column) */}
        <div className="bg-white border border-border p-5 rounded-xl shadow-soft">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Document Types</h3>
            <p className="text-xs text-secondary">Distribution across institutional schemas</p>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.type_distribution || [
                    { name: 'Marks Card', value: 12, color: '#426FA8' },
                    { name: 'Attendance Sheet', value: 6, color: '#5A3A8B' },
                    { name: 'Certificate', value: 4, color: '#39B56B' },
                    { name: 'Circular', value: 3, color: '#E5A83B' },
                  ]}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.type_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1730', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border">
            {(charts?.type_distribution || [
              { name: 'Marks Card', value: 12, color: '#426FA8' },
              { name: 'Attendance', value: 6, color: '#5A3A8B' },
              { name: 'Certificate', value: 4, color: '#39B56B' },
              { name: 'Circular', value: 3, color: '#E5A83B' },
            ]).map((t) => (
              <div key={t.name} className="flex items-center gap-1.5 text-xs text-navy font-medium">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }}></span>
                <span className="truncate">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="bg-white border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Recent Ingested Documents</h3>
            <p className="text-xs text-secondary">Latest institutional records processed by VFSTR Document Intelligence</p>
          </div>
          <Link
            to="/documents"
            className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
          >
            View All Documents <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-[11px] font-bold text-secondary uppercase">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Extraction Method</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-secondary">
                    No documents uploaded yet. Click "Upload Document" to begin.
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-navy truncate max-w-[220px]">{doc.file_name}</div>
                      <div className="text-[10px] text-secondary">{doc.document_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-navy bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {doc.document_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-secondary font-medium">
                      {doc.processing_method || 'DIRECT_TEXT'}
                    </td>
                    <td className="py-3 px-4">
                      <ConfidenceBar confidence={doc.overall_confidence} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={doc.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/documents/${doc.document_id}`}
                        className="text-xs font-bold text-primary hover:text-primary-hover bg-primary-light px-2.5 py-1 rounded transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
