import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, FileText, ExternalLink, Maximize2 } from 'lucide-react';

interface DocumentViewerProps {
  previewUrl?: string;
  fileName?: string;
  fileType?: string;
  highlightBbox?: [number, number, number, number];
  pageNumber?: number;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  previewUrl,
  fileName = 'document.pdf',
  fileType = 'PDF',
  highlightBbox,
  pageNumber = 1,
}) => {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));

  const isPdf = fileType?.toUpperCase() === 'PDF' || fileName?.endsWith('.pdf');
  const isImage = ['PNG', 'JPG', 'JPEG'].includes(fileType?.toUpperCase() || '') || /\.(png|jpg|jpeg)$/i.test(fileName);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden flex flex-col h-full shadow-card">
      {/* Viewer Header */}
      <div className="bg-slate-50 border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-navy truncate max-w-[200px]">{fileName}</span>
          <span className="text-[10px] font-semibold bg-white border border-border px-1.5 py-0.5 rounded text-secondary">
            Page {pageNumber}
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-200 rounded text-secondary hover:text-navy transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-secondary w-10 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-200 rounded text-secondary hover:text-navy transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:bg-slate-200 rounded text-secondary hover:text-navy transition-colors ml-1"
              title="Open Original in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Viewer Body / Content */}
      <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center min-h-[420px] relative">
        {previewUrl ? (
          <div
            className="relative transition-transform duration-200 origin-top shadow-md rounded bg-white"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {isImage ? (
              <img
                src={previewUrl}
                alt={fileName}
                className="max-w-full max-h-[600px] object-contain rounded"
              />
            ) : isPdf ? (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                title={fileName}
                className="w-[600px] h-[650px] border-0 rounded"
              />
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-border w-[400px] shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-xs font-bold text-navy">{fileName}</h4>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">Spreadsheet Data Extracted &amp; Validated</p>
                <p className="text-[10px] text-secondary mt-0.5">Normalized tabular records synced to MongoDB Atlas</p>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    download={fileName}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-light hover:bg-primary-light/80 px-3.5 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Download Original Source File
                  </a>
                )}
              </div>
            )}

            {/* Bounding Box Highlight Overlay */}
            {highlightBbox && (
              <div
                className="absolute border-2 border-accent-purple bg-accent-purple/20 rounded pointer-events-none transition-all duration-300 animate-pulse"
                style={{
                  left: `${(highlightBbox[0] / 600) * 100}%`,
                  top: `${(highlightBbox[1] / 800) * 100}%`,
                  width: `${((highlightBbox[2] - highlightBbox[0]) / 600) * 100}%`,
                  height: `${((highlightBbox[3] - highlightBbox[1]) / 800) * 100}%`,
                }}
              >
                <span className="absolute -top-5 left-0 bg-accent-purple text-white text-[9px] font-bold px-1 py-0.5 rounded shadow">
                  Source Region
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-secondary">Document preview unavailable</p>
          </div>
        )}
      </div>
    </div>
  );
};
