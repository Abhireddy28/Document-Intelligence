import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  CheckSquare,
  Users,
  BarChart3,
  History,
  Settings,
  Bot,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authService } from '../services/authService';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');

  // Strict Separation of Roles
  const adminNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Documents', path: '/documents', icon: Files },
    { name: 'Upload Document', path: '/upload', icon: UploadCloud },
    { name: 'Students Master Registry', path: '/students', icon: Users },
    { name: 'Extraction Quality Reports', path: '/reports/quality', icon: BarChart3 },
    { name: 'System Audit Logs', path: '/audit-logs', icon: History },
    { name: 'Engine & Guardrail Settings', path: '/settings', icon: Settings },
  ];

  const verifierNavItems = [
    { name: 'Human Verification Queue', path: '/verification', icon: CheckSquare, badge: 'Active HITL' },
    { name: 'Institutional Documents', path: '/documents', icon: Files },
    { name: 'Student Master Registry', path: '/students', icon: Users },
  ];

  const navItems = isAdmin ? adminNavItems : verifierNavItems;

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col justify-between h-screen sticky top-0 select-none shadow-soft">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-border bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-primary-light" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-navy tracking-tight text-base">VFSTR</span>
                <span className="bg-primary-light text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-secondary font-medium">Document Intelligence</p>
            </div>
          </div>
        </div>

        {/* Role Badge Bar */}
        <div className="px-3 pt-3">
          <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${isAdmin ? 'bg-navy text-white border-navy-light' : 'bg-primary-light/60 text-primary border-primary/20'
            }`}>
            <ShieldCheck className={`w-4 h-4 ${isAdmin ? 'text-amber-400' : 'text-primary'}`} />
            <div>
              <p className="font-extrabold text-[11px] leading-tight">
                {isAdmin ? 'SYSTEM ADMINISTRATOR' : 'VERIFIER WORKSPACE'}
              </p>
              <p className={`text-[10px] ${isAdmin ? 'text-slate-300' : 'text-secondary'}`}>
                {isAdmin ? 'Full Governance & Settings' : 'Human-in-the-Loop Review'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item: any) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${isActive
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-navy/90 hover:bg-primary-light/70 hover:text-primary'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Status & Profile */}
      <div className="p-3 border-t border-border space-y-2.5 bg-slate-50/30">
        {/* Agent Status Banner */}
        <div className="bg-primary-light/70 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
            </span>
            <span className="text-[11px] font-bold text-navy">Agent Status:</span>
          </div>
          <span className="text-[11px] font-bold text-status-success bg-white px-2 py-0.5 rounded-lg border border-border">
            Online
          </span>
        </div>

        {/* User Card */}
        <div className="bg-white border border-border rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin ? 'bg-navy' : 'bg-primary'
              }`}>
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-navy truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1 text-[10px] text-secondary capitalize">
                <ShieldCheck className={`w-3 h-3 ${isAdmin ? 'text-amber-500' : 'text-primary'}`} />
                <span>{isAdmin ? 'System Admin' : 'Review Verifier'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 hover:bg-slate-100 rounded-lg text-secondary hover:text-status-error transition-colors shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
