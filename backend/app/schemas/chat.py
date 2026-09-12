from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    user_role: str = "admin"  # "admin" | "verifier"
    history: Optional[List[ChatMessage]] = []
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    suggestions: Optional[List[str]] = []
    action_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
