@echo off
setlocal
cd /d "%~dp0"

set "TARGET=%~dp0Launch_Skill_Tree.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Academic Skill Tree.lnk"

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Academic Skill Tree - RPG Tracker'; $s.Save()"

echo.
echo [Success] Desktop shortcut created successfully on your Windows Desktop!
echo File: %SHORTCUT%
echo.
pause
