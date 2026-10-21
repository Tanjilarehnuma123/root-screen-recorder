@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "ROOT_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Install Node.js 22 or newer, then run Start.cmd again.
    pause
    exit /b 1
  )
) else (
  set "ROOT_NODE=node"
)
start "" "http://localhost:4783"
"%ROOT_NODE%" server.mjs
pause
