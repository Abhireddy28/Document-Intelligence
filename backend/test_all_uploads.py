import asyncio
import os
import sys
from app.services.pdf_extractor import pdf_extractor
from app.services.spreadsheet_extractor import spreadsheet_extractor
from app.services.word_extractor import word_extractor
from app.services.ocr_service import ocr_service
from app.services.document_classifier import document_classifier
from app.services.field_extractor import field_extractor
from app.database import get_db

async def test_file(file_path):
    print(f"\n==========================================")
    print(f"Testing: {os.path.basename(file_path)}")
    ext = os.path.splitext(file_path)[1].lower()
    
    raw_text = ""
    tables = []
    ocr_tokens = []
    ext_method = "DIRECT_TEXT"
    
    try:
        if ext == ".pdf":
            data = pdf_extractor.extract(file_path)
            raw_text = data["raw_text"]
            ext_method = data["extraction_method"]
            for p in data.get("pages", []):
                ocr_tokens.extend(p.get("words", []))
            from app.services.table_extractor import table_extractor
            tables = table_extractor.extract_tables_from_pdf(file_path)
        elif ext in [".xlsx", ".xls", ".csv"]:
            sheet_data = spreadsheet_extractor.extract(file_path)
            raw_text = f"Spreadsheet data ({sheet_data['total_rows']} rows)"
            tables = [{"rows": sheet_data["records"]}]
            ext_method = "SPREADSHEET"
        elif ext in [".docx", ".doc"]:
            docx_data = word_extractor.extract(file_path)
            raw_text = docx_data["raw_text"]
            tables = docx_data["tables"]
            ext_method = "DOCX_TEXT"
        elif ext in [".jpg", ".png", ".jpeg"]:
            ocr_tokens = ocr_service.extract_from_image(file_path)
            raw_text = " ".join([t["text"] for t in ocr_tokens])
            ext_method = "OCR"
            
        print(f"Extraction Method: {ext_method}, Raw text len: {len(raw_text)}, Tables: {len(tables)}")
        
        # Classification
        classification = document_classifier.classify(os.path.basename(file_path), raw_text, tables)
        doc_type = classification["document_type"]
        print(f"Classified as: {doc_type} (conf: {classification['confidence']})")
        
        # Field extraction
        db = get_db()
        res = await field_extractor.extract_and_process(
            document_id="TEST-001",
            file_name=os.path.basename(file_path),
            document_type=doc_type,
            raw_text=raw_text,
            tables=tables,
            extraction_method=ext_method,
            ocr_tokens=ocr_tokens,
            db=db
        )
        print(f"Overall Confidence: {res.get('overall_confidence')}")
        print(f"Requires Verification: {res.get('requires_verification')}")
        print(f"SUCCESS!")
    except Exception as e:
        print(f"FAILED with error: {e}")
        import traceback
        traceback.print_exc()

async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_files = [
        os.path.join(root, "sample_documents", "marks_card", "clean_marks_card_22CS101.pdf"),
        os.path.join(root, "sample_documents", "marks_card", "scanned_marks_card_noisy_22CS10I.pdf"),
        os.path.join(root, "sample_documents", "attendance", "attendance_sem6_cse.xlsx"),
        os.path.join(root, "sample_documents", "certificates", "merit_award_certificate.pdf"),
        os.path.join(root, "sample_documents", "circulars", "exam_schedule_circular_2026.docx"),
        os.path.join(root, "uploads", "DOC-646CC2_Vignans Foundation for Science Technology and Research, Guntur - Copy.xlsx")
    ]
    for tf in test_files:
        if os.path.exists(tf):
            await test_file(tf)
        else:
            print(f"File not found: {tf}")

if __name__ == "__main__":
    asyncio.run(main())
