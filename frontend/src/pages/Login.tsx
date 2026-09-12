import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ShieldCheck, ArrowRight, Sparkles, Building2, Lock, Mail, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.user?.role === 'verifier' || email.includes('verifier')) {
        navigate('/verification');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Use demo accounts below.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Institution header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-light border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold text-primary mb-3">
          <Building2 className="w-3.5 h-3.5" />
          <span>Vignan's University • Agentic AI Day 2026</span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center text-white shadow-card">
            <Bot className="w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-extrabold text-navy tracking-tight">VFSTR</h1>
            <p className="text-xs text-secondary font-medium">Document Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white border border-border rounded-2xl shadow-modal p-8">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-navy">Sign In to Dashboard</h2>
          <p className="text-xs text-secondary mt-1">
            Access trusted institutional document processing and human-in-the-loop verification
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-navy focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-navy focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 text-center">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@example.com', 'admin123')}
              className="bg-primary-light/60 hover:bg-primary-light border border-primary/20 text-navy p-2.5 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-primary">Admin Role</span>
                <ShieldCheck className="w-3 h-3 text-primary" />
              </div>
              <p className="text-[10px] text-secondary">admin@example.com</p>
              <p className="text-[9px] text-slate-400">Pass: admin123</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('verifier@example.com', 'verifier123')}
              className="bg-slate-50 hover:bg-slate-100 border border-border text-navy p-2.5 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-bold text-navy">Verifier Role</span>
                <ShieldCheck className="w-3 h-3 text-secondary" />
              </div>
              <p className="text-[10px] text-secondary">verifier@example.com</p>
              <p className="text-[9px] text-slate-400">Pass: verifier123</p>
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-secondary">
        VFSTR — Institutional Document Intelligence Platform
      </p>
    </div>
  );
};
