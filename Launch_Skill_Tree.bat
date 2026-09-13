@echo off
title Academic Skill Tree Launcher
cd /d "%~dp0"

if exist "dist\Academic Skill Tree-win32-x64\Academic Skill Tree.exe" (
    start "" "dist\Academic Skill Tree-win32-x64\Academic Skill Tree.exe"
    exit
)

start "" npx electron .
exit
