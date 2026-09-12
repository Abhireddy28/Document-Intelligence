import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.schemas.extraction import ValidationStatus

logger = logging.getLogger("agent64.confidence_engine")

class ConfidenceEngine:
    """
    Computes multi-signal field-level confidence scores and enforces
    strict guardrails against unverified academic/institutional data entry.
    """

    def __init__(self, default_threshold: float = None):
        self.threshold = default_threshold or settings.CONFIDENCE_THRESHOLD

    def calculate_field_confidence(
        self,
        ocr_confidence: Optional[float],
        format_valid: bool,
        reference_valid: bool,
        extraction_method: str = "DIRECT_TEXT"
    ) -> float:
        """
        Calculates field confidence using weighted multi-signal criteria:
        - OCR confidence (60%)
        - Format validation (20%)
        - Reference validation (20%)
        """
        fmt_score = 1.0 if format_valid else 0.0
        ref_score = 1.0 if reference_valid else 0.0

        if extraction_method == "OCR" and ocr_confidence is not None:
            score = (ocr_confidence * 0.60) + (fmt_score * 0.20) + (ref_score * 0.20)
        elif extraction_method == "SPREADSHEET":
            score = 0.98 if (fmt_score and ref_score) else (0.60 if fmt_score else 0.40)
        else:
            # DIRECT_TEXT or DOCX
            base = 0.95 if (fmt_score and ref_score) else (0.65 if fmt_score else 0.40)
            score = base

        return round(max(0.1, min(0.99, score)), 2)

    def should_auto_approve(
        self,
        confidence: float,
        validation_status: str,
        is_critical: bool = True
    ) -> bool:
        """
        Centralized Guardrail:
        NEVER allow low-confidence (< threshold) or failed-validation fields to auto-approve.
        """
        if validation_status != ValidationStatus.PASSED.value:
            return False
        
        if confidence < self.threshold:
            return False

        return True

    def evaluate_document_approval(self, extracted_fields: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates all fields in a document to determine if the entire document
        can be AUTO_APPROVED or if it requires HUMAN_VERIFICATION.
        """
        critical_failed = []
        low_confidence_fields = []
        total_conf = 0.0
        field_count = 0

        for field_name, field_data in extracted_fields.items():
            if isinstance(field_data, dict) and "confidence" in field_data:
                conf = field_data.get("confidence", 0.0)
                v_status = field_data.get("validation_status", "PASSED")
                is_crit = field_data.get("is_critical", False)
                total_conf += conf
                field_count += 1

                auto_app = self.should_auto_approve(conf, v_status, is_crit)
                if not auto_app:
                    if is_crit:
                        critical_failed.append(field_name)
                    else:
                        low_confidence_fields.append(field_name)

        overall_conf = round(total_conf / max(1, field_count), 2)
        requires_verification = len(critical_failed) > 0 or overall_conf < self.threshold

        return {
            "overall_confidence": overall_conf,
            "requires_verification": requires_verification,
            "critical_failed_fields": critical_failed,
            "low_confidence_fields": low_confidence_fields,
            "status": "VERIFICATION_REQUIRED" if requires_verification else "APPROVED"
        }

confidence_engine = ConfidenceEngine()
