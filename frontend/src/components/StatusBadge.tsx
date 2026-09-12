import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { DocumentStatus } from '../types';

interface StatusBadgeProps {
  status: DocumentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Auto Approved',
        };
      case 'VERIFIED':
        return {
          bg: 'bg-blue-50 text-primary border-blue-200',
          icon: <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Verified',
        };
      case 'VERIFICATION_REQUIRED':
      case 'PENDING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Verification Required',
        };
      case 'PROCESSING':
      case 'EXTRACTING':
      case 'CLASSIFYING':
      case 'VALIDATING':
        return {
          bg: 'bg-purple-50 text-accent-purple border-purple-200 animate-pulse',
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Processing',
        };
      case 'FAILED':
      case 'ERROR':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Processing Error',
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Rejected',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: normalized,
        };
    }
  };

  const config = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${config.bg}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};
