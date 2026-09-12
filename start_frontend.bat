@echo off
title Agent 64 - React Vite Frontend
echo ===================================================
echo Starting Agent 64 Frontend (Vite on Port 5173)...
echo ===================================================
cd /d "%~dp0frontend"
npm run dev
pause
