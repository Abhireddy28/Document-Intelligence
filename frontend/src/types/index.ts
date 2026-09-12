export type DocumentType = 'MARKS_CARD' | 'ATTENDANCE_SHEET' | 'CERTIFICATE' | 'CIRCULAR' | 'UNKNOWN';

export type DocumentStatus = 
  | 'UPLOADED'
  | 'CLASSIFYING'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'VALIDATING'
  | 'VERIFICATION_REQUIRED'
  | 'APPROVED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'FAILED';

export type ExtractionMethod = 'DIRECT_TEXT' | 'OCR' | 'TABLE_EXTRACTION' | 'SPREADSHEET' | 'DOCX_TEXT' | 'HYBRID';

export interface TimelineStep {
  step: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'FAILED' | 'PENDING';
  timestamp: string;
  details?: string;
}

export interface DocumentItem {
  document_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  source_path: string;
  document_type: DocumentType;
  status: DocumentStatus;
  processing_method?: ExtractionMethod;
  overall_confidence: number;
  upload_date: string;
  processed_date?: string;
  processing_timeline: TimelineStep[];
  error_message?: string;
  preview_url?: string;
}

export interface SourceReference {
  document_id: string;
  file_name: string;
  page: number;
  bbox?: [number, number, number, number];
  extraction_method?: string;
  ocr_confidence?: number;
  raw_snippet?: string;
}

export interface FieldConfidence {
  value: any;
  confidence: number;
  validation_status: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';
  validation_message?: string;
  source?: SourceReference;
  suggested_value?: any;
  is_critical?: boolean;
  is_verified?: boolean;
  corrected_value?: any;
}

export interface SubjectMarks {
  subject_code: string;
  subject_name: string;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  grade: string;
  confidence?: number;
  validation_status?: string;
}

export interface CanonicalDocument {
  document_id: string;
  document_type: string;
  student?: {
    student_id?: string;
    name: string;
    roll_number: string;
    department?: string;
  };
  academic?: {
    semester?: string | number;
    academic_year?: string;
    subjects?: SubjectMarks[];
    attendance?: any;
    total_marks?: number;
    percentage?: number;
    result?: string;
  };
  certificate?: any;
  circular?: any;
  metadata: {
    confidence: number;
    verified: boolean;
    verified_by?: string;
    verified_at?: string;
    source_document: string;
    source_page: number;
    document_type: string;
    extracted_at: string;
  };
}

export interface ExtractionData {
  document_id: string;
  document_type: string;
  overall_confidence: number;
  validation_passed: boolean;
  requires_human_verification: boolean;
  extracted_fields: Record<string, any>;
  canonical_data?: CanonicalDocument;
  raw_text?: string;
  tables?: any[];
  ocr_details?: any[];
}

export interface VerificationItem {
  verification_id: string;
  document_id: string;
  file_name: string;
  document_type: string;
  field_name: string;
  field_label: string;
  extracted_value: any;
  confidence: number;
  validation_status: string;
  validation_message?: string;
  suggested_value?: any;
  source_page: number;
  bbox?: [number, number, number, number];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTED';
  corrected_value?: any;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
}

export interface Student {
  id?: string;
  student_id: string;
  roll_number: string;
  name: string;
  department: string;
  semester: number;
  email?: string;
  batch?: string;
  status?: string;
  document_count?: number;
}

export interface DashboardStats {
  total_documents: number;
  processed: number;
  auto_approved: number;
  human_verified: number;
  pending_verification: number;
  average_confidence: number;
}

export interface DashboardCharts {
  processed_by_day: Array<{ date: string; documents: number; approved: number }>;
  type_distribution: Array<{ name: string; value: number; color: string }>;
  confidence_distribution: Array<{ range: string; count: number }>;
  status_breakdown: Array<{ name: string; count: number; color: string }>;
}

export interface ExtractionQualityReport {
  total_processed: number;
  average_confidence: number;
  high_confidence_pct: number;
  low_confidence_pct: number;
  human_verification_pct: number;
  validation_failures: number;
  auto_approval_rate: number;
  learning_insights: {
    total_corrections: number;
    top_corrected_fields: Record<string, number>;
    common_ocr_corrections: Record<string, number>;
    learning_status: string;
  };
}

export interface AuditLog {
  action: string;
  document_id?: string;
  user: string;
  timestamp: string;
  previous_value?: string;
  new_value?: string;
  details: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'verifier' | 'viewer';
}
