import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { documentService } from '../services/documentService';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExts = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Unsupported file format '${ext}'. Please upload PDF, PNG, JPG, DOCX, XLSX, or CSV.`);
      return;
    }
    setSelectedFile(file);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const doc = await documentService.uploadDocument(selectedFile);
      // Navigate to processing pipeline tracker
      navigate(`/processing/${doc.document_id}`);
    } catch (err: any) {
      console.error("Upload error:", err);
      const detailMsg = err.response?.data?.detail;
      const errorMsg = typeof detailMsg === 'string' ? detailMsg : (err.message || 'Failed to process document. Please try again.');
      setError(errorMsg);
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-8 h-8 text-emerald-600" />;
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return <ImageIcon className="w-8 h-8 text-purple-600" />;
    return <FileText className="w-8 h-8 text-primary" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-border rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Ingest Institutional Document</h2>
            <p className="text-xs text-secondary mt-0.5">
              Upload Marks Cards, Attendance Spreadsheets, Certificates, or Circulars for trusted extraction
            </p>
          </div>
          <span className="bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> High-Accuracy OCR & Validation
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Drag and Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-primary bg-primary-light/50 scale-[1.01]'
              : 'border-border bg-slate-50/60 hover:bg-slate-50 hover:border-primary/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleChange}
            accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv"
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-primary-light text-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-sm font-bold text-navy mb-1">
            Drop your document here, or <span className="text-primary hover:underline">browse files</span>
          </h3>
          <p className="text-xs text-secondary max-w-sm mx-auto mb-4">
            Directly parse digital PDFs, execute PaddleOCR on scanned memos, or ingest batch attendance spreadsheets
          </p>

          {/* Supported Types Tags */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {['PDF', 'Scanned PDF', 'PNG', 'JPG', 'DOCX', 'XLSX', 'CSV'].map((ext) => (
              <span key={ext} className="bg-white border border-border text-secondary text-[11px] font-semibold px-2 py-0.5 rounded shadow-2xs">
                {ext}
              </span>
            ))}
          </div>
        </div>

        {/* Selected File Card */}
        {selectedFile && (
          <div className="mt-5 p-4 bg-primary-light/40 border border-primary/20 rounded-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              {getFileIcon(selectedFile.name)}
              <div>
                <p className="text-xs font-bold text-navy truncate max-w-md">{selectedFile.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-secondary mt-0.5">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="font-semibold uppercase text-primary">
                    {selectedFile.name.split('.').pop()} File
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
              className="p-1.5 hover:bg-white rounded-lg text-secondary hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleProcess}
            disabled={!selectedFile || isUploading}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-3 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading & Triggering Pipeline...</span>
              </>
            ) : (
              <>
                <span>Process Document</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Demo Test Quick Pickers */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-soft">
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
          Hackathon Demo Sample Fixtures
        </h3>
        <p className="text-xs text-secondary mb-4">
          Test files generated in <code className="bg-slate-100 text-navy px-1 py-0.5 rounded">sample_documents/</code> are ready for instant demo testing:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border border-border rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-colors">
            <span className="text-[10px] font-bold bg-emerald-50 text-status-success border border-emerald-200 px-2 py-0.5 rounded-md">
              Scenario 1 • Marks Card
            </span>
            <p className="text-xs font-bold text-navy mt-1.5 truncate">clean_marks_card_22CS101.pdf</p>
            <p className="text-[11px] text-secondary mt-0.5">Digital PDF • Auto-Approved (96%)</p>
          </div>

          <div className="border border-border rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-colors">
            <span className="text-[10px] font-bold bg-amber-50 text-status-warning border border-amber-200 px-2 py-0.5 rounded-md">
              Scenario 2 • Noisy OCR
            </span>
            <p className="text-xs font-bold text-navy mt-1.5 truncate">scanned_marks_card_noisy_22CS10I.pdf</p>
            <p className="text-[11px] text-secondary mt-0.5">OCR Noise • Suggests 22CS101</p>
          </div>

          <div className="border border-border rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-colors">
            <span className="text-[10px] font-bold bg-primary-light text-primary border border-border px-2 py-0.5 rounded-md">
              Scenario 3 • Attendance
            </span>
            <p className="text-xs font-bold text-navy mt-1.5 truncate">attendance_sem6_cse.xlsx</p>
            <p className="text-[11px] text-secondary mt-0.5">Excel Ingestion • 10 Students</p>
          </div>

          <div className="border border-border rounded-xl p-3.5 bg-slate-50/50 hover:bg-white transition-colors">
            <span className="text-[10px] font-bold bg-purple-50 text-accent-purple border border-purple-200 px-2 py-0.5 rounded-md">
              Scenario 4 • Certificate
            </span>
            <p className="text-xs font-bold text-navy mt-1.5 truncate">merit_award_certificate.pdf</p>
            <p className="text-[11px] text-secondary mt-0.5">Academic Award • Student Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
};
