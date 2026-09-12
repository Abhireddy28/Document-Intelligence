from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])
chatbot_service = ChatbotService()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Infer role from auth token if not provided or override
        user_role = current_user.get("role", request.user_role)
        response_data = await chatbot_service.process_chat(
            message=request.message,
            user_role=user_role,
            history=[h.dict() for h in request.history] if request.history else [],
            context=request.context
        )
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant processing error: {str(e)}")
