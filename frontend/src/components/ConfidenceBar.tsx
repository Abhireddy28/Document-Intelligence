import React from 'react';
import { Check, AlertTriangle, X } from 'lucide-react';

interface ConfidenceBarProps {
  confidence: number; // 0 to 1 or 0 to 100
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
  confidence,
  showBar = true,
  size = 'md',
}) => {
  // Normalize to 0-100 percentage
  const pct = confidence <= 1.0 ? Math.round(confidence * 100) : Math.round(confidence);

  let colorClass = 'text-emerald-600 bg-emerald-500';
  let badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let icon = <Check className="w-3 h-3 text-emerald-600" />;

  if (pct < 70) {
    colorClass = 'text-rose-600 bg-rose-500';
    badgeClass = 'text-rose-700 bg-rose-50 border-rose-200';
    icon = <X className="w-3 h-3 text-rose-600" />;
  } else if (pct < 90) {
    colorClass = 'text-amber-600 bg-amber-500';
    badgeClass = 'text-amber-700 bg-amber-50 border-amber-200';
    icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 font-semibold border rounded px-1.5 py-0.5 text-xs ${badgeClass}`}>
        {pct}% {icon}
      </span>
      {showBar && (
        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass.split(' ')[1]}`}
            style={{ width: `${Math.max(5, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
};
