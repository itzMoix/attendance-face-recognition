@echo off
echo Starting FaceAttend Frontend...
cd frontend
:: Ensure Node is in PATH just in case
set PATH=C:\Program Files\nodejs;%PATH%
echo Running npm run dev...
call npm run dev
pause
