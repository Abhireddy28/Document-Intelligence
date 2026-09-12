@echo off
title Launch Agent 64 Full Stack
echo ===================================================
echo Launching Agent 64 Document Intelligence Agent...
echo ===================================================

start "Agent 64 - Backend" "%~dp0start_backend.bat"
timeout /t 2 >nul
start "Agent 64 - Frontend" "%~dp0start_frontend.bat"

echo.
echo ===================================================
echo Services launched!
echo - Frontend: http://localhost:5173
echo - Backend Swagger Docs: http://localhost:8000/docs
echo ===================================================
timeout /t 5
