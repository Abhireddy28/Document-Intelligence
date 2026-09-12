import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { DocumentDetails } from './pages/DocumentDetails';
import { Upload } from './pages/Upload';
import { Processing } from './pages/Processing';
import { VerificationQueue } from './pages/VerificationQueue';
import { VerificationDetail } from './pages/VerificationDetail';
import { Students } from './pages/Students';
import { ExtractionQuality } from './pages/ExtractionQuality';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

import { authService } from './services/authService';

// Admin-only route guard
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
  return isAdmin ? children : <Navigate to="/verification" replace />;
};

// Verifier-only route guard
const VerifierRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
  return !isAdmin ? children : <Navigate to="/documents" replace />;
};

// Role-aware root router
const RootIndex: React.FC = () => {
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin');
  return isAdmin ? <Dashboard /> : <Navigate to="/verification" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Main Application with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<RootIndex />} />
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id" element={<DocumentDetails />} />
          <Route path="students" element={<Students />} />

          {/* Admin Dedicated Governance Features */}
          <Route path="upload" element={<AdminRoute><Upload /></AdminRoute>} />
          <Route path="processing/:id" element={<AdminRoute><Processing /></AdminRoute>} />
          <Route path="reports/quality" element={<AdminRoute><ExtractionQuality /></AdminRoute>} />
          <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />

          {/* Verifier Dedicated Human Verification Features */}
          <Route path="verification" element={<VerifierRoute><VerificationQueue /></VerifierRoute>} />
          <Route path="verification/:id" element={<VerifierRoute><VerificationDetail /></VerifierRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
