import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import db_manager, get_db
from app.seed.seed_database import seed_data

from app.routers import auth, documents, extraction, verification, students, dashboard, reports, audit, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB and seed if empty
    await db_manager.connect()
    db = get_db()
    user_count = await db.get_collection("users").count_documents({})
    if user_count == 0:
        await seed_data()
    yield
    # Shutdown
    await db_manager.close()

app = FastAPI(
    title="Agent 64 — Document Intelligence API",
    description="Institutional Document Intelligence Agent: multi-format ingestion, OCR, validation, confidence scoring, human verification, source traceability, and canonical models for institutional AI agents.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", settings.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and previews
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(extraction.router, prefix=settings.API_V1_STR)
app.include_router(verification.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "Agent 64 — Document Intelligence Agent",
        "version": "1.0.0",
        "database": "CONNECTED" if not db_manager.use_memory else "RESILIENT_FALLBACK_STORE",
        "guardrail_threshold": settings.CONFIDENCE_THRESHOLD,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
