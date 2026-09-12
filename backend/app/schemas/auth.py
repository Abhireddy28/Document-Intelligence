from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    VERIFIER = "verifier"
    VIEWER = "viewer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
