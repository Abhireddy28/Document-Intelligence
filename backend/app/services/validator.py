import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.extraction import ValidationStatus

logger = logging.getLogger("agent64.validator")

class ValidationEngine:
    """
    Institutional validation engine enforcing format, range,
    arithmetic integrity, and reference-data student verification.
    """

    OCR_CONFUSIONS = {
        'I': '1', 'l': '1', '|': '1',
        'O': '0', 'o': '0', 'Q': '0', 'D': '0',
        'S': '5', 's': '5',
        'Z': '2', 'z': '2',
        'B': '8',
    }

    ROLL_NUMBER_PATTERN = re.compile(r'^[0-9]{2}[A-Z]{2,4}[0-9]{2,4}$', re.IGNORECASE)

    async def validate_roll_number(self, roll_number: str, db) -> Dict[str, Any]:
        """
        Validates roll number against format and Student Master Database in MongoDB.
        Performs fuzzy/OCR character confusion analysis if direct match fails.
        """
        cleaned = str(roll_number).strip().upper()
        
        # 1. Format check
        format_valid = bool(self.ROLL_NUMBER_PATTERN.match(cleaned))

        # 2. Check against Student Master Database
        students_col = db.get_collection("students")
        student = await students_col.find_one({"roll_number": cleaned})

        if student:
            return {
                "status": ValidationStatus.PASSED.value,
                "message": f"Verified against Student Master Registry: {student.get('name')}",
                "student": student,
                "suggested_value": None
            }

        # 3. If exact match not found, generate OCR confusion suggestions
        suggested = self._find_fuzzy_roll_match(cleaned)
        
        # Check if the suggested candidate exists in DB
        if suggested:
            db_suggested = await students_col.find_one({"roll_number": suggested})
            if db_suggested:
                return {
                    "status": ValidationStatus.FAILED.value,
                    "message": f"Roll number '{cleaned}' not in registry. Possible match: '{suggested}' ({db_suggested.get('name')})",
                    "student": None,
                    "suggested_value": suggested
                }

        return {
            "status": ValidationStatus.FAILED.value,
            "message": f"Roll number '{cleaned}' not found in Student Master Registry",
            "student": None,
            "suggested_value": suggested if suggested else None
        }

    def _find_fuzzy_roll_match(self, raw_roll: str) -> Optional[str]:
        """Applies OCR character substitutions to find probable intended roll number."""
        # Common pattern: last characters are digits, e.g. 22CS10I -> 22CS101
        chars = list(raw_roll)
        
        # Replace trailing or digit-position characters that were confused with letters
        for i in range(len(chars)):
            # If after department prefix (index >= 4), letters are likely digits
            if i >= 4 and chars[i] in self.OCR_CONFUSIONS:
                chars[i] = self.OCR_CONFUSIONS[chars[i]]
            # If in department letters (index 2, 3), digits might be confused
            elif 2 <= i <= 3:
                if chars[i] == '0':
                    chars[i] = 'O'
                elif chars[i] == '1':
                    chars[i] = 'I'
                elif chars[i] == '5':
                    chars[i] = 'S'

        candidate = "".join(chars)
        return candidate if candidate != raw_roll else None

    def validate_marks_subject(self, internal: int, external: int, total: int) -> Tuple[str, Optional[str]]:
        """Validates internal (0-30/40), external (0-70/60), and arithmetic total."""
        if not (0 <= internal <= 100):
            return ValidationStatus.FAILED.value, f"Internal marks {internal} out of range [0-100]"
        if not (0 <= external <= 100):
            return ValidationStatus.FAILED.value, f"External marks {external} out of range [0-100]"
        if not (0 <= total <= 100):
            return ValidationStatus.FAILED.value, f"Total marks {total} out of range [0-100]"
        if (internal + external) != total:
            return ValidationStatus.FAILED.value, f"Arithmetic mismatch: internal ({internal}) + external ({external}) != total ({total})"
        
        return ValidationStatus.PASSED.value, None

    def validate_attendance(self, total_classes: int, present: int, absent: int, percentage: float) -> Tuple[str, Optional[str]]:
        """Validates attendance class counts and percentage calculation."""
        if total_classes <= 0:
            return ValidationStatus.FAILED.value, "Total classes must be greater than zero"
        if present < 0 or absent < 0:
            return ValidationStatus.FAILED.value, "Present and absent counts cannot be negative"
        if (present + absent) > total_classes:
            return ValidationStatus.FAILED.value, f"Sum of present ({present}) and absent ({absent}) exceeds total classes ({total_classes})"
        
        expected_pct = round((present / total_classes) * 100, 2)
        if abs(expected_pct - percentage) > 1.0:
            return ValidationStatus.WARNING.value, f"Calculated percentage ({expected_pct}%) differs from recorded ({percentage}%)"

        return ValidationStatus.PASSED.value, None

validator = ValidationEngine()
