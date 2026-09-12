import fitz  # PyMuPDF
import os
import logging
from typing import Dict, Any, List, Tuple
from app.services.ocr_service import ocr_service

logger = logging.getLogger("agent64.pdf_extractor")

class PDFExtractor:
    """Extracts digital text, layouts, bounding boxes, or executes OCR for scanned PDFs."""

    def extract(self, file_path: str) -> Dict[str, Any]:
        """
        Parses a PDF file.
        Returns:
            {
                "is_scanned": bool,
                "num_pages": int,
                "raw_text": str,
                "pages": [
                    {
                        "page_number": int,
                        "text": str,
                        "words": [ {"text": str, "bbox": [x1,y1,x2,y2], "confidence": float} ],
                        "image_path": Optional[str]
                    }
                ],
                "extraction_method": "DIRECT_TEXT" or "OCR"
            }
        """
        doc = fitz.open(file_path)
        num_pages = len(doc)
        pages_data = []
        total_text_length = 0
        all_raw_text = []

        is_scanned = False
        
        # Check first page to assess digital vs scanned
        first_page = doc[0] if num_pages > 0 else None
        first_page_text = first_page.get_text().strip() if first_page else ""
        
        if len(first_page_text) < 30:
            is_scanned = True

        for page_idx in range(num_pages):
            page = doc[page_idx]
            page_text = page.get_text()
            total_text_length += len(page_text.strip())
            
            words_list = []
            
            # Extract word bounding boxes from PyMuPDF
            # page.get_text("words") -> (x0, y0, x1, y1, "word", block_no, line_no, word_no)
            words = page.get_text("words")
            if words and len(words) > 5:
                for w in words:
                    words_list.append({
                        "text": w[4],
                        "bbox": [round(w[0], 1), round(w[1], 1), round(w[2], 1), round(w[3], 1)],
                        "confidence": 0.98,
                        "page": page_idx + 1
                    })
            
            # Render page as image for preview and fallback OCR if needed
            pix = page.get_pixmap(dpi=150)
            preview_img_dir = os.path.join(os.path.dirname(file_path), "previews")
            os.makedirs(preview_img_dir, exist_ok=True)
            preview_img_path = os.path.join(
                preview_img_dir,
                f"{os.path.splitext(os.path.basename(file_path))[0]}_page_{page_idx+1}.png"
            )
            pix.save(preview_img_path)

            # If scanned, execute OCR on the rendered image
            if is_scanned or len(words_list) < 5:
                ocr_tokens = ocr_service.extract_from_image(preview_img_path, page_num=page_idx + 1)
                words_list = ocr_tokens
                page_text = " ".join([t["text"] for t in ocr_tokens])

            all_raw_text.append(page_text)
            pages_data.append({
                "page_number": page_idx + 1,
                "text": page_text,
                "words": words_list,
                "preview_image": preview_img_path
            })

        doc.close()

        extraction_method = "OCR" if is_scanned else "DIRECT_TEXT"

        return {
            "is_scanned": is_scanned,
            "num_pages": num_pages,
            "raw_text": "\n\n".join(all_raw_text),
            "pages": pages_data,
            "extraction_method": extraction_method
        }

pdf_extractor = PDFExtractor()
