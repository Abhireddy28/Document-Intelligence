import re
import logging
from typing import Dict, Any, Tuple
from app.schemas.document import DocumentType

logger = logging.getLogger("agent64.classifier")

class DocumentClassifier:
    """
    Multi-stage intelligent document classifier:
    1. Metadata / Filename heuristics
    2. Rule-based keyword density analysis
    3. Structural regex patterns
    4. LLM classification fallback
    """

    def classify(self, filename: str, text: str, tables: list = None, llm_service=None) -> Dict[str, Any]:
        filename_lower = filename.lower()
        text_lower = text.lower() if text else ""
        
        # 1. Filename & Extension heuristics
        if any(k in filename_lower for k in ["marks", "memo", "grade_sheet", "result", "transcript", "grade_card"]):
            return {"document_type": DocumentType.MARKS_CARD.value, "confidence": 0.98, "reason": "Filename pattern match"}
        if any(k in filename_lower for k in ["attendance", "present", "absent", "att_", ".xlsx", ".xls", ".csv", "vignan", "student", "select", "placement"]):
            return {"document_type": DocumentType.ATTENDANCE_SHEET.value, "confidence": 0.98, "reason": "Spreadsheet / Institutional student roster match"}
        if any(k in filename_lower for k in ["cert", "certificate", "merit", "completion"]):
            return {"document_type": DocumentType.CERTIFICATE.value, "confidence": 0.98, "reason": "Filename pattern match"}
        if any(k in filename_lower for k in ["circular", "notice", "office_order", "memo_office", "announcement"]):
            return {"document_type": DocumentType.CIRCULAR.value, "confidence": 0.98, "reason": "Filename pattern match"}

        # 2. Text Keyword Scoring
        marks_keywords = ["marks", "subject", "grade", "semester", "internal", "external", "total marks", "cgpa", "sgpa", "credits", "result", "marks memo", "grade report"]
        attendance_keywords = ["attendance", "present", "absent", "classes held", "classes attended", "percentage of attendance", "attendance sheet", "total classes"]
        cert_keywords = ["certificate", "this is to certify", "certified that", "is hereby awarded", "has successfully completed", "merit certificate", "participation"]
        circular_keywords = ["circular", "notice", "office order", "all students", "all departments", "reference no", "notification", "registrar", "controller of examinations", "memorandum"]

        scores = {
            DocumentType.MARKS_CARD.value: sum(2 for k in marks_keywords if k in text_lower),
            DocumentType.ATTENDANCE_SHEET.value: sum(2 for k in attendance_keywords if k in text_lower),
            DocumentType.CERTIFICATE.value: sum(2 for k in cert_keywords if k in text_lower),
            DocumentType.CIRCULAR.value: sum(2 for k in circular_keywords if k in text_lower),
        }

        # Check for specific structural markers
        if re.search(r'\b(internal|external|grade\s*point|sgpa|cgpa)\b', text_lower):
            scores[DocumentType.MARKS_CARD.value] += 4
        if re.search(r'\b(present\s*count|absent\s*count|attended\s*classes)\b', text_lower):
            scores[DocumentType.ATTENDANCE_SHEET.value] += 4
        if re.search(r'\b(certif(y|icate)|awarded\s*to)\b', text_lower):
            scores[DocumentType.CERTIFICATE.value] += 4
        if re.search(r'\b(ref\s*no|circular\s*no|office\s*of\s*the\s*dean)\b', text_lower):
            scores[DocumentType.CIRCULAR.value] += 4

        best_type, best_score = max(scores.items(), key=lambda x: x[1])

        if best_score >= 4:
            conf = min(0.99, 0.70 + (best_score * 0.05))
            return {
                "document_type": best_type,
                "confidence": round(conf, 2),
                "reason": f"High keyword and structural pattern score ({best_score})"
            }

        # 3. LLM classification if ambiguous and LLM is available
        if llm_service and llm_service.is_available():
            llm_result = llm_service.classify_document(text[:2000])
            if llm_result:
                return llm_result

        # Fallback
        if best_score > 0:
            return {
                "document_type": best_type,
                "confidence": 0.75,
                "reason": "Moderate keyword match"
            }

        return {
            "document_type": DocumentType.UNKNOWN.value,
            "confidence": 0.40,
            "reason": "No conclusive pattern detected"
        }

document_classifier = DocumentClassifier()
