import subprocess

ps_script = """
$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktop "Academic Skill Tree.lnk"
$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = "C:\\Users\\user\\.gemini\\antigravity\\scratch\\academic-skill-tree\\dist\\Academic Skill Tree-win32-x64\\Academic Skill Tree.exe"
$s.WorkingDirectory = "C:\\Users\\user\\.gemini\\antigravity\\scratch\\academic-skill-tree\\dist\\Academic Skill Tree-win32-x64"
$s.Description = "Academic Skill Tree - RPG Tracker"
$s.Save()
"""

subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], check=True)
print("Shortcut updated successfully to point directly to Academic Skill Tree.exe")
