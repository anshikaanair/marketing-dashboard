@echo off
set "NODE_PATH=C:\Program Files\nodejs"
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
    echo Added Node.js to temporary PATH.
) else (
    echo Node.js not found at %NODE_PATH%. Please install it or update the path in this script.
    pause
    exit /b 1
)

echo Starting development server...
npm run dev
pause
