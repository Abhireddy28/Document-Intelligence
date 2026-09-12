import React from 'react';
import { Search, Bell, Sparkles, Building2 } from 'lucide-react';
import { authService } from '../services/authService';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Document Intelligence',
  subtitle = 'Institutional autonomous document processing & validation',
}) => {
  const user = authService.getCurrentUser();

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-soft">
      {/* Title info */}
      <div>
        <h1 className="text-base font-bold text-navy tracking-tight">{title}</h1>
        <p className="text-[11px] text-secondary font-normal hidden sm:block">{subtitle}</p>
      </div>

      {/* Center Hackathon Badge */}
      <div className="hidden lg:flex items-center gap-2 bg-primary-light border border-border px-3.5 py-1 rounded-full text-xs font-semibold text-primary">
        <Building2 className="w-3.5 h-3.5 text-primary" />
        <span className="tracking-tight">Vignan's University • Agentic AI Day 2026</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block w-60">
          <Search className="w-3.5 h-3.5 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, roll no..."
            className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-navy placeholder:text-secondary/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Notifications */}
        <button
          title="Notifications"
          className="relative p-2 rounded-xl text-secondary hover:text-navy hover:bg-slate-50 border border-transparent hover:border-border transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-warning rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {user?.name ? user.name[0] : 'A'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-navy leading-tight">{user?.name || 'Administrator'}</p>
            <p className="text-[10px] text-secondary font-medium capitalize">{user?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
