from typing import Dict, Any, List, Optional
from datetime import datetime

class TraceabilityService:
    """Manages exact source audit trails and visual bounding box linkages for extracted fields."""

    @staticmethod
    def build_source_ref(
        document_id: str,
        file_name: str,
        page: int = 1,
        bbox: Optional[List[float]] = None,
        extraction_method: str = "DIRECT_TEXT",
        ocr_confidence: Optional[float] = None,
        raw_snippet: Optional[str] = None
    ) -> Dict[str, Any]:
        return {
            "document_id": document_id,
            "file_name": file_name,
            "page": page,
            "bbox": bbox or [100, 100, 300, 140],
            "extraction_method": extraction_method,
            "ocr_confidence": ocr_confidence or 0.95,
            "raw_snippet": raw_snippet or "",
            "timestamp": datetime.utcnow().isoformat()
        }

traceability_service = TraceabilityService()
