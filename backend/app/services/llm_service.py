import os
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("agent64.llm_service")

class LLMService:
    """
    LLM extraction service supporting Gemini API with fallback to offline heuristics.
    Never accepts arbitrary prose — strictly enforces JSON structures.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.client = None
        self._setup_client()

    def _setup_client(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel("gemini-1.5-flash")
                logger.info("Gemini LLM client initialized successfully")
            except Exception as e:
                logger.warning("Could not initialize Gemini LLM client: %s", e)

    def is_available(self) -> bool:
        return self.client is not None and bool(self.api_key)

    async def generate_text(self, prompt: str) -> Optional[str]:
        if not self.is_available():
            return None
        try:
            response = self.client.generate_content(prompt)
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning("LLM text generation error: %s", e)
        return None
        if not self.is_available():
            return None
        prompt = f"""
You are an institutional document classification AI.
Classify the following text into exactly ONE of these types:
- MARKS_CARD
- ATTENDANCE_SHEET
- CERTIFICATE
- CIRCULAR
- UNKNOWN

Text:
\"\"\"{text_snippet}\"\"\"

Return ONLY a valid JSON object matching this schema:
{{
  "document_type": "MARKS_CARD",
  "confidence": 0.95,
  "reason": "Brief reason"
}}
"""
        try:
            response = self.client.generate_content(prompt)
            return self._parse_json(response.text)
        except Exception as e:
            logger.warning("LLM classification error: %s", e)
            return None

    def extract_fields(self, document_type: str, raw_text: str, tables: list = None) -> Optional[Dict[str, Any]]:
        """Extracts strictly structured fields from the document text via LLM."""
        if not self.is_available():
            return None

        prompt = f"""
You are an institutional document data extractor. Extract information from the provided document text into strict JSON.
Document Type: {document_type}

Text:
\"\"\"{raw_text[:4000]}\"\"\"

Tables:
{json.dumps(tables or [])[:2000]}

Extract the fields according to standard institutional format.
Return ONLY valid JSON with no markdown backticks, no markdown fence, no preamble, and no explanation.
"""
        try:
            response = self.client.generate_content(prompt)
            return self._parse_json(response.text)
        except Exception as e:
            logger.warning("LLM extraction error: %s", e)
            return None

    def _parse_json(self, response_text: str) -> Optional[Dict[str, Any]]:
        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning("Failed to parse LLM JSON output: %s", e)
            return None

llm_service = LLMService()
