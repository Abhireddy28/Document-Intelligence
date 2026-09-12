import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIChatbot } from './AIChatbot';

export const Layout: React.FC = () => {
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/') return { title: 'Document Intelligence', subtitle: 'Trusted institutional document processing dashboard' };
    if (path.startsWith('/documents/')) return { title: 'Document Details', subtitle: 'Extraction audit trail & canonical verification' };
    if (path === '/documents') return { title: 'Institutional Documents', subtitle: 'Multi-format ingested academic and administrative records' };
    if (path === '/upload') return { title: 'Upload & Process Document', subtitle: 'Ingest PDF, Images, DOCX, XLSX and CSV documents' };
    if (path.startsWith('/processing')) return { title: 'Agent Processing Pipeline', subtitle: 'Real-time multi-stage AI extraction & verification' };
    if (path.startsWith('/verification/')) return { title: 'Human Verification Split-View', subtitle: 'Side-by-side original source inspect & correction' };
    if (path === '/verification') return { title: 'Human Verification Queue', subtitle: 'Confidence guardrail alerts requiring human sign-off' };
    if (path === '/students') return { title: 'Student Master Registry', subtitle: 'Authoritative student database for cross-referencing' };
    if (path === '/reports/quality') return { title: 'Extraction Quality Reports', subtitle: 'Accuracy metrics, confidence distribution & OCR learning' };
    if (path === '/audit-logs') return { title: 'Compliance Audit Trail', subtitle: 'Immutable chronological institutional activity history' };
    if (path === '/settings') return { title: 'Agent Configuration & Settings', subtitle: 'Confidence thresholds, LLM routing & API access keys' };
    return { title: 'Document Intelligence', subtitle: 'Trusted institutional processing' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex min-h-screen bg-background text-navy">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      {/* Global Role-Aware AI Copilot */}
      <AIChatbot />
    </div>
  );
};
