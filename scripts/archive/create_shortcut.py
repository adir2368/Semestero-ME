import os
import subprocess

desktop = os.path.join(os.path.expanduser("~"), "Desktop")
shortcut_path = os.path.join(desktop, "Academic Skill Tree.lnk")
target_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\Launch_Skill_Tree.bat"
work_dir = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"

vbs_content = f'''Set ws = CreateObject("WScript.Shell")
Set s = ws.CreateShortcut("{shortcut_path}")
s.TargetPath = "{target_path}"
s.WorkingDirectory = "{work_dir}"
s.Description = "Academic Skill Tree - RPG Tracker"
s.Save
'''

vbs_file = os.path.join(work_dir, "temp_shortcut.vbs")
with open(vbs_file, "w", encoding="utf-8") as f:
    f.write(vbs_content)

subprocess.run(["cscript", "//nologo", vbs_file], check=True)
if os.path.exists(vbs_file):
    os.remove(vbs_file)

print(f"Desktop shortcut successfully created at: {shortcut_path}")
