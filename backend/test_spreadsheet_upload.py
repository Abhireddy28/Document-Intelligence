import asyncio
import sys
from app.routers.documents import run_pipeline_for_document
from app.database import get_db
from app.services.chatbot_service import ChatbotService

async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    db = get_db()
    
    # 1. Reprocess the user's Excel file
    print("Reprocessing DOC-646CC2...")
    await run_pipeline_for_document('DOC-646CC2')
    
    doc = await db.get_collection('documents').find_one({'document_id': 'DOC-646CC2'})
    print("Document status:", doc.get("status") if doc else "Not found")
    print("Document type:", doc.get("document_type") if doc else "N/A")
    print("Confidence:", doc.get("overall_confidence") if doc else "N/A")
    
    # 2. Check registered students in DB
    stu_count = await db.get_collection('students').count_documents({})
    print(f"Total students registered in DB: {stu_count}")
    
    # Check sample student
    stu = await db.get_collection('students').find_one({'roll_number': '231FA04342'})
    print("Sample student 231FA04342 in DB:", stu.get("name") if stu else "None", "| Status:", stu.get("placement_status") if stu else "")
    
    # 3. Test AI Chatbot queries
    bot = ChatbotService()
    print("\n--- Testing AI Chatbot for 231FA04342 ---")
    res1 = await bot.process_chat("tell me about student 231FA04342", "admin")
    print("AI Response 1:\n", res1["reply"][:400])
    
    print("\n--- Testing AI Chatbot for Mandala Susmitha ---")
    res2 = await bot.process_chat("what is the details for Mandala Susmitha", "admin")
    print("AI Response 2:\n", res2["reply"][:400])

if __name__ == "__main__":
    asyncio.run(main())
