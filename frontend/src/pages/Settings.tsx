import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Database,
  Key,
  Save,
  CheckCircle2,
  Sparkles,
  Bot,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { authService } from '../services/authService';

export const Settings: React.FC = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  const [threshold, setThreshold] = useState(90);
  const [llmProvider, setLlmProvider] = useState('gemini-1.5-flash');
  const [ocrEngine, setOcrEngine] = useState('paddleocr');
  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only Administrators can modify institutional engine settings.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('agent64_live_inst_token_vignan_2026_9x8f7a6b5c');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center shadow-sm">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">VFSTR Engine Configuration</h2>
            <p className="text-xs text-secondary mt-0.5">
              Control extraction confidence thresholds, autonomous guardrail safety, and external agent API integrations
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-status-warning" />
            <span>Read-Only Mode (Verifier)</span>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-primary-light/60 border border-primary/20 rounded-xl p-4 flex items-center gap-3 text-xs text-navy">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <strong className="font-bold">Institutional Security Policy:</strong> As a <strong>Verifier</strong>, you have full access to inspect, correct, and sign off in the <strong>Verification Queue</strong>. Global safety thresholds &amp; API keys can only be altered by the Administrator.
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Critical Confidence Guardrail */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-status-warning" />
              <h3 className="text-sm font-bold text-navy">Auto-Approval Guardrail Threshold</h3>
            </div>
            <span className="font-mono font-black text-sm bg-primary-light text-primary px-3 py-1 rounded-full">
              {threshold}%
            </span>
          </div>

          <p className="text-xs text-secondary">
            Any extracted document whose overall score or critical academic field (Roll number, Marks, Attendance) is below this threshold is immediately diverted to the Human Verification Queue.
          </p>

          <div className="pt-2">
            <input
              type="range"
              min="50"
              max="99"
              disabled={!isAdmin}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className={`w-full h-2 bg-slate-200 rounded-lg appearance-none accent-primary ${
                !isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <div className="flex justify-between text-[11px] font-semibold text-secondary mt-2">
              <span>50% (Permissive)</span>
              <span className="font-bold text-primary">90% (Recommended Institutional Standard)</span>
              <span>99% (Strict)</span>
            </div>
          </div>
        </div>

        {/* 2. AI & OCR Engine Settings */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Cpu className="w-5 h-5 text-accent-purple" />
            <h3 className="text-sm font-bold text-navy">AI Intelligence &amp; Extraction Routing</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">LLM Provider</label>
              <select
                value={llmProvider}
                disabled={!isAdmin}
                onChange={(e) => setLlmProvider(e.target.value)}
                className={`w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-navy focus:outline-none focus:border-primary ${
                  !isAdmin ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Recommended)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                <option value="rule-based-fallback">Offline Rule-Based Heuristic Engine (Active)</option>
              </select>
              <p className="text-[10px] text-secondary mt-1">Configured via GEMINI_API_KEY environment variable</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy mb-1.5">OCR Recognition Engine</label>
              <select
                value={ocrEngine}
                disabled={!isAdmin}
                onChange={(e) => setOcrEngine(e.target.value)}
                className={`w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-navy focus:outline-none focus:border-primary ${
                  !isAdmin ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <option value="paddleocr">PaddleOCR + OpenCV Preprocessing (Standard)</option>
                <option value="easyocr">EasyOCR Deep Neural Engine</option>
                <option value="pymupdf">PyMuPDF Vectorized Text Extraction</option>
              </select>
              <p className="text-[10px] text-secondary mt-1">High-performance optical character engine</p>
            </div>
          </div>
        </div>

        {/* 3. External Institutional Agent API Integration */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-navy">External Institutional AI Agents Access Token</h3>
          </div>

          <p className="text-xs text-secondary">
            Other institutional agents (e.g. Student Advising Agent, Examination Auditor Agent) consume trusted canonical data via REST API:
          </p>

          <div className="bg-slate-50 border border-border rounded-xl p-3 flex items-center justify-between">
            <span className="font-mono text-xs text-navy font-bold truncate max-w-md">
              agent64_live_inst_token_vignan_2026_9x8f7a6b5c
            </span>
            <button
              type="button"
              onClick={handleCopyApiKey}
              className="bg-white hover:bg-slate-100 border border-border text-navy text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copied' : 'Copy Key'}
            </button>
          </div>

          <div className="bg-primary-light/40 border border-primary/20 rounded-xl p-3 text-xs text-navy space-y-1">
            <p className="font-bold">Agent Endpoint:</p>
            <code className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-border inline-block">
              GET /api/documents/{'{document_id}'}/canonical
            </code>
          </div>
        </div>

        {/* Save Bar */}
        {isAdmin && (
          <div className="flex items-center justify-between pt-2">
            {saved && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" /> Settings updated successfully
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
