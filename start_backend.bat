@echo off
title Agent 64 - FastAPI Backend
echo ===================================================
echo Starting Agent 64 Backend (FastAPI on Port 8000)...
echo ===================================================
cd /d "%~dp0"
python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
