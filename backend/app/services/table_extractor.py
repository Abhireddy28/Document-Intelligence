import pdfplumber
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("agent64.table_extractor")

class TableExtractor:
    """Extracts and normalizes tables from PDF documents using pdfplumber."""

    def extract_tables_from_pdf(self, file_path: str) -> List[Dict[str, Any]]:
        extracted_tables = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_idx, page in enumerate(pdf.pages):
                    tables = page.extract_tables()
                    for t_idx, table in enumerate(tables):
                        if not table or len(table) < 2:
                            continue
                        
                        # Clean headers and rows
                        raw_headers = [str(col).strip() if col else f"col_{i}" for i, col in enumerate(table[0])]
                        cleaned_rows = []
                        for row in table[1:]:
                            if any(cell is not None and str(cell).strip() != "" for cell in row):
                                row_dict = {}
                                for i, cell in enumerate(row):
                                    col_name = raw_headers[i] if i < len(raw_headers) else f"col_{i}"
                                    row_dict[col_name] = str(cell).strip() if cell is not None else ""
                                cleaned_rows.append(row_dict)

                        extracted_tables.append({
                            "page": page_idx + 1,
                            "table_index": t_idx + 1,
                            "headers": raw_headers,
                            "rows": cleaned_rows,
                            "raw_matrix": table
                        })
        except Exception as e:
            logger.warning("Error extracting tables from %s: %s", file_path, e)

        return extracted_tables

table_extractor = TableExtractor()
