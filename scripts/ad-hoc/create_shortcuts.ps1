$wsh = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Semestero ME.lnk'
$targetExe = 'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\dist\Semestero ME-win32-x64\Semestero ME.exe'
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = $targetExe
$sc.WorkingDirectory = 'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\dist\Semestero ME-win32-x64'
$sc.IconLocation = 'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\icon.ico'
$sc.Description = 'Semestero ME - Academic Skill Tree v2.5.8'
$sc.Save()

$startMenu = [System.Environment]::GetFolderPath('Programs')
$startShortcutPath = Join-Path $startMenu 'Semestero ME.lnk'
$scStart = $wsh.CreateShortcut($startShortcutPath)
$scStart.TargetPath = $targetExe
$scStart.WorkingDirectory = 'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\dist\Semestero ME-win32-x64'
$scStart.IconLocation = 'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\icon.ico'
$scStart.Description = 'Semestero ME - Academic Skill Tree v2.5.8'
$scStart.Save()

Write-Output "Shortcuts created successfully: $shortcutPath and $startShortcutPath"
