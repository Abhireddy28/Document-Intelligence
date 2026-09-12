from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime
from app.schemas.auth import UserLogin, Token, UserOut, UserRole
from app.utils.auth import verify_password, create_access_token, decode_access_token, hash_password
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# Seed fallback users
DEMO_USERS = {
    "admin@example.com": {
        "_id": "user-admin-01",
        "email": "admin@example.com",
        "name": "Dr. Ramesh Varma (Admin)",
        "password": hash_password("admin123"),
        "role": UserRole.ADMIN.value
    },
    "verifier@example.com": {
        "_id": "user-verifier-01",
        "email": "verifier@example.com",
        "name": "Prof. Anita Sharma (Verifier)",
        "password": hash_password("verifier123"),
        "role": UserRole.VERIFIER.value
    }
}

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if not credentials:
        # For seamless demo accessibility, fallback to default admin if no header provided
        return DEMO_USERS["admin@example.com"]
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    email = payload.get("sub")
    db = get_db()
    user = await db.get_collection("users").find_one({"email": email})
    if not user:
        if email in DEMO_USERS:
            return DEMO_USERS[email]
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    email = credentials.email.lower().strip()
    db = get_db()
    users_col = db.get_collection("users")
    user = await users_col.find_one({"email": email})

    if not user and email in DEMO_USERS:
        user = DEMO_USERS[email]

    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Use demo accounts: admin@example.com or verifier@example.com",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.get("_id", "1"),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user.get("_id", "1")),
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }
