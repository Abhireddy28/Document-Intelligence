import asyncio
import sys
from app.services.chatbot_service import ChatbotService

async def main():
    sys.stdout.reconfigure(encoding='utf-8')
    bot = ChatbotService()
    questions = [
        "hi",
        "whole student data",
        "give me all student records",
        "tell me about 22CS101",
        "what is pass marks in R22?",
        "why was DOC-1002 flagged?"
    ]
    for q in questions:
        print("=" * 60)
        print("Q:", q)
        res = await bot.process_chat(q, "admin")
        print("A:", res['reply'][:300] + ("..." if len(res['reply']) > 300 else ""))
        print("Suggestions:", res.get("suggestions"))

if __name__ == "__main__":
    asyncio.run(main())
