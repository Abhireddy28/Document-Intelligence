# Agent 64 — Institutional Document Intelligence Agent

[![Vignan's University Agentic AI Day 2026](https://img.shields.io/badge/Hackathon-Agentic_AI_Day_2026-426FA8.svg)](https://vignan.ac.in)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_3.11+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_TypeScript-61DAFB.svg)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Autonomous Institutional Document Ingestion, OCR Extraction, Reference Validation, Confidence Scoring & Human-in-the-Loop Verification Pipeline.**

---

## 🏛️ Executive Summary

**Agent 64** is an institutional Document Intelligence Agent developed for **Agentic AI Day 2026 at Vignan's University**.

Its purpose is to ingest unstructured, multi-format institutional documents (Marks Memos, Attendance Spreadsheets, Merit Certificates, and Examination Circulars), process them through multi-stage OCR and heuristic/LLM extraction, validate fields against authoritative student master registries, enforce a strict **0.90 confidence guardrail**, and convert raw documents into trusted **Canonical Data Models** consumable by other autonomous institutional AI agents.

---

## 📐 End-to-End Pipeline Architecture

```
                                      [ INGESTION ]
                                            │
               ┌──────────────┬─────────────┴────────────┬──────────────┐
             [ PDF ]      [ SCANNED ]                [ XLSX/CSV ]    [ DOCX ]
               │              │                          │              │
               ▼              ▼                          ▼              ▼
           PyMuPDF        OpenCV +                   Pandas +       python-docx
          Direct Text     PaddleOCR                  openpyxl        Headings &
          Extraction      Thresholding               DataFrames       Paragraphs
               │              │                          │              │
               └──────────────┼──────────────────────────┴──────────────┘
                              ▼
               [ 4-STAGE DOCUMENT CLASSIFIER ]
               (Metadata -> Heuristics -> Keywords -> LLM)
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       [ MARKS CARD ]             [ ATTENDANCE / CERT / CIRC ]
               │                             │
               └──────────────┬──────────────┘
                              ▼
              [ FIELD EXTRACTION ENGINE ]
              (Student, Roll No, Subjects, Marks, Att %)
                              │
                              ▼
            [ INSTITUTIONAL VALIDATION ENGINE ]
            - Roll number format & Student Registry lookup
            - Range check (0 <= Marks <= 100, 0 <= Att % <= 100)
            - Arithmetic consistency (Internal + External == Total)
            - OCR fuzzy substitution suggestion (e.g., 22CS10I -> 22CS101)
                              │
                              ▼
           [ MULTI-SIGNAL CONFIDENCE ENGINE ]
           Formula: (OCR * 0.60) + (Format * 0.20) + (Registry * 0.20)
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  Confidence >= 0.90                     Confidence < 0.90
  & Validation PASSED                     or Validation FAILED
          │                                       │
  [ AUTO-APPROVED ]                     [ HUMAN VERIFICATION QUEUE ]
          │                             - Split-screen document viewer
          │                             - Bounding box highlight
          │                             - Accept Suggested / Edit / Reject
          │                             - OCR pattern learning (I->1, O->0)
          │                                       │
          └───────────────────┬───────────────────┘
                              ▼
                   [ CANONICAL DATA MODEL ]
                              │
                   [ MONGODB PERSISTENCE ]
                              │
               [ REST APIs FOR EXTERNAL AGENTS ]
```

---

## 🛡️ Critical Guardrail Rule

> **NEVER allow low-confidence extracted information to automatically enter academic or financial records.**

Centralized guardrail `should_auto_approve()` enforces:
1. If field confidence `< 0.90` **OR** student registry lookup fails $\rightarrow$ Divert directly to **Human Verification Queue**.
2. Critical protected fields: `roll_number`, `student_id`, `marks`, `attendance_percentage`.
3. If OCR misreads `22CS10I` for `22CS101`, the system detects character glyph confusion, suggests `22CS101`, but **mandates human verification** before committing to the canonical database.

---

## 🚀 Key Features

- **Multi-Format Ingestion**: PDF, Scanned PDF, JPG, PNG, DOCX, XLSX, and CSV.
- **4-Stage Classifier**: Metadata, structural patterns, keyword scoring, and Gemini 1.5 Flash fallback.
- **Multi-Engine OCR**: PyMuPDF vectorized layout extraction + OpenCV adaptive thresholding and OCR coordinates.
- **Table Structure Recognition**: `pdfplumber` structured row/column mapping preserving subject-to-mark isolation.
- **Student Master Registry Check**: Cross-referencing 10+ student master records with Levenshtein & OCR glyph matching.
- **Machine Correction Learning**: Tracks and learns recurring OCR confusions (`I -> 1`, `O -> 0`, `S -> 5`) to improve future suggestions.
- **Split-Screen Verification UI**: Side-by-side original source document viewer with bounding box overlay and editable form.
- **Traceability Engine**: Every single field links to its source file, page number, bounding box $[x_1, y_1, x_2, y_2]$, and OCR score.
- **Canonical Model APIs**: Clean JSON structures designed for consumption by downstream autonomous campus agents.
- **Complete Compliance Audit Trail**: Immutable log of AI inferences, human edits, and document transitions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Axios, React Router |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyMongo / Motor |
| **Document Processing** | PyMuPDF (`fitz`), `pdfplumber`, `pandas`, `openpyxl`, `python-docx`, `OpenCV` |
| **AI / LLM** | Google Gemini 1.5 Flash via `google-generativeai` + Rule-Based Fallback Engine |
| **Security** | JWT Authentication, Password Hashing, CORS Protection |
| **Deployment** | Docker, Docker Compose, Nginx, Vercel / Render ready |

---

## 📂 Project Structure

```
agent64-document-intelligence/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI Application & Lifespan
│   │   ├── config.py                # Environment Settings
│   │   ├── database.py              # MongoDB Motor & Resilient In-Memory Fallback
│   │   ├── routers/
│   │   │   ├── auth.py              # JWT Login & Current User
│   │   │   ├── documents.py         # Upload, Pipeline Execution, List, Details
│   │   │   ├── extraction.py        # Field Extraction & Canonical Model APIs
│   │   │   ├── verification.py      # Human Verification Queue & Actions
│   │   │   ├── dashboard.py         # Stats & Recharts Aggregations
│   │   │   ├── students.py          # Master Registry API
│   │   │   ├── reports.py           # Extraction Quality & Learning Analytics
│   │   │   └── audit.py             # Chronological Audit Trail
│   │   ├── services/
│   │   │   ├── document_classifier.py
│   │   │   ├── pdf_extractor.py
│   │   │   ├── ocr_service.py
│   │   │   ├── image_preprocessor.py
│   │   │   ├── table_extractor.py
│   │   │   ├── spreadsheet_extractor.py
│   │   │   ├── word_extractor.py
│   │   │   ├── llm_service.py
│   │   │   ├── field_extractor.py
│   │   │   ├── validator.py
│   │   │   ├── confidence_engine.py
│   │   │   ├── normalization.py
│   │   │   ├── traceability.py
│   │   │   └── correction_learning.py
│   │   ├── schemas/                 # Pydantic Schemas
│   │   └── seed/                    # Seed Database Script
│   ├── uploads/                     # Physical files & previews
│   ├── tests/                       # Pytest Backend Test Suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # Layout, Sidebar, Header, StatusBadge, ConfidenceBar, DocumentViewer
│   │   ├── pages/                   # 12 Complete Pages (Dashboard, Upload, Verification, etc.)
│   │   ├── services/                # Axios API Services
│   │   ├── types/                   # TypeScript Interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── sample_documents/
│   ├── marks_card/                  # clean_marks_card_22CS101.pdf & scanned_marks_card_noisy_22CS10I.pdf
│   ├── attendance/                  # attendance_sem6_cse.xlsx & .csv
│   ├── certificates/                # merit_award_certificate.pdf
│   └── circulars/                   # exam_schedule_circular_2026.docx
├── create_sample_files.py           # Fixture Generator
├── docker-compose.yml
└── README.md
```

---

## ⚡ Getting Started (Zero Docker Required)

### Prerequisites
- Python 3.11+
- Node.js v18+ & npm

### 🚀 1-Step Unified Runner (Recommended)
Simply run:
```bash
python run.py
```
This automatically initializes the backend, loads master student records, launches the Vite dev server, and opens **[http://localhost:5173](http://localhost:5173)** in your default browser!

---

### 🛠️ Individual Service Execution

If you prefer separate terminals:

#### Terminal 1 — FastAPI Backend:
```bash
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
*Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)*

#### Terminal 2 — React Vite Frontend:
```bash
cd frontend
npm run dev
```
*Frontend UI: [http://localhost:5173](http://localhost:5173)*

#### Or on Windows:
Double-click **`start_all.bat`** (or `start_backend.bat` & `start_frontend.bat`).

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@example.com` | `admin123` | Full administrative, approval, delete, & config access |
| **Verifier** | `verifier@example.com` | `verifier123` | Human-in-the-loop review & field correction |

*(One-click quick-login buttons are built into the Login screen for instant demonstration).*

---

## 🎯 Hackathon Live Demo Scenarios

### Scenario 1: Clean Marks Card $\rightarrow$ Auto-Approval
1. Go to **Upload** (`/upload`).
2. Upload `sample_documents/marks_card/clean_marks_card_22CS101.pdf`.
3. System triggers pipeline: Ingested $\rightarrow$ Classified as `MARKS_CARD` $\rightarrow$ Direct Text extraction $\rightarrow$ Subjects & marks parsed $\rightarrow$ Roll number `22CS101` verified against Student Master Registry $\rightarrow$ Confidence **96%** ($\ge 90\%$) $\rightarrow$ **AUTO APPROVED**.
4. View structured canonical model ready for institutional advising agents.

### Scenario 2: Noisy Scanned Marks Card $\rightarrow$ Guardrail Protection & Correction Learning
1. Upload `sample_documents/marks_card/scanned_marks_card_noisy_22CS10I.pdf`.
2. OCR extracts `22CS10I` (character $I$ instead of digit $1$).
3. Validation checks student registry $\rightarrow$ `22CS10I` is not found $\rightarrow$ Fuzzy OCR logic identifies `22CS101` (Rahul Kumar).
4. Guardrail enforces confidence **61%** ($< 90\%$) $\rightarrow$ Status set to **`VERIFICATION_REQUIRED`**.
5. Verifier navigates to **Verification Queue** (`/verification`) or **Split-Screen Inspector** (`/verification/:id`).
6. Verifier sees extracted `22CS10I` vs suggested `22CS101` with source bounding box highlight.
7. Click **"Accept Suggested Match"** $\rightarrow$ Status changes to **`VERIFIED`**, canonical data is committed, audit log is written, and the correction rule (`I -> 1`) is recorded in the Correction Learning Service.

### Scenario 3: Batch Attendance Spreadsheet Ingestion
1. Upload `sample_documents/attendance/attendance_sem6_cse.xlsx`.
2. Spreadsheet extractor normalizes columns $\rightarrow$ All 10 student roll numbers are verified $\rightarrow$ Auto-Approved with 99% confidence.

---

## 📡 API Specification for External AI Agents

External campus agents consume trusted canonical data directly via:

```http
GET /api/documents/{document_id}/canonical
Authorization: Bearer <JWT_TOKEN>
```

#### Sample Response:
```json
{
  "document_id": "DOC-1001",
  "document_type": "MARKS_CARD",
  "student": {
    "student_id": "STU1001",
    "name": "Rahul Kumar",
    "roll_number": "22CS101",
    "department": "CSE"
  },
  "academic": {
    "semester": 6,
    "academic_year": "2025-2026",
    "subjects": [
      {"subject_code": "CS301", "subject_name": "Cloud Computing & DevOps", "internal": 28, "external": 64, "total": 92, "grade": "A+"},
      {"subject_code": "CS302", "subject_name": "Artificial Intelligence & Agents", "internal": 27, "external": 63, "total": 90, "grade": "A+"}
    ],
    "total_marks": 351,
    "percentage": 87.75,
    "result": "DISTINCTION"
  },
  "metadata": {
    "confidence": 0.96,
    "verified": true,
    "verified_by": "SYSTEM_AUTO_APPROVE",
    "source_document": "clean_marks_card_22CS101.pdf",
    "source_page": 1,
    "document_type": "MARKS_CARD",
    "extracted_at": "2026-09-11T05:48:12.190Z"
  }
}
```

---

## 🏆 Hackathon Submission Details

- **Project**: Agent 64 — Institutional Document Intelligence Agent
- **Event**: Agentic AI Day 2026
- **Institution**: Vignan's University
- **Focus**: Autonomous Agents, Document OCR, Multimodal Guardrails, Human-in-the-Loop AI.
