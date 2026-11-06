import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

drive_dir = os.path.join(r"C:\Users\user\OneDrive - Technion", "Mechanichal Info TSA's files - Mechanical Engineering Drive")
print("Listing folders in Faculty Drive:")
for item in sorted(os.listdir(drive_dir)):
    full = os.path.join(drive_dir, item)
    if os.path.isdir(full):
        print(f"[DIR] {item}")
        # check subdirs
        subdirs = [s for s in os.listdir(full) if os.path.isdir(os.path.join(full, s))]
        for s in sorted(subdirs)[:10]:
            print(f"    └─ {s}")
