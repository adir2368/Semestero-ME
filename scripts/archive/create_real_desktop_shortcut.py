import subprocess

ps_script = """
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktop "Academic Skill Tree.lnk"
$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = "C:\\Users\\user\\.gemini\\antigravity\\scratch\\academic-skill-tree\\Launch_Skill_Tree.bat"
$s.WorkingDirectory = "C:\\Users\\user\\.gemini\\antigravity\\scratch\\academic-skill-tree"
$s.Description = "Academic Skill Tree - RPG Tracker"
$s.Save()
Write-Host "SHORTCUT_SAVED: $shortcutPath"
"""

result = subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("Error:", result.stderr)
