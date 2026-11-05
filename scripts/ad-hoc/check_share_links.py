import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

drive_path = r"C:\Users\user\OneDrive - Technion\Mechanichal Info TSA's files - Mechanical Engineering Drive"

# Check clipboard.txt
clip = os.path.join(drive_path, "clipboard.txt")
if os.path.exists(clip):
    print("=== clipboard.txt ===")
    with open(clip, "r", encoding="utf-8", errors="ignore") as f:
        print(f.read())

# Check .url files in the drive
for root, dirs, files in os.walk(drive_path):
    for f in files:
        if f.endswith(".url") or f.endswith(".txt"):
            full = os.path.join(root, f)
            try:
                with open(full, "r", encoding="utf-8", errors="ignore") as u:
                    content = u.read()
                    if "http" in content or "sharepoint" in content or "drive" in content:
                        print(f"=== {f} ({full}) ===")
                        print(content[:500])
            except Exception as e:
                pass
