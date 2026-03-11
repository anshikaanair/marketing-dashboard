@echo off
set "NODE_PATH=C:\Program Files\nodejs"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
    echo Added Node.js to temporary PATH.
)

echo.
echo [1/2] Launching Python Backend (uvicorn)...
start "Backend" cmd /k "python -m uvicorn backend.main:app --reload --port 8000"

echo.
echo [2/2] Launching Vite Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting in new windows.
echo Keep this terminal open if you want to see this message, or close it.
pause
