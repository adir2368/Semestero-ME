import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

drive_path = r"C:\Users\user\OneDrive - Technion\Mechanichal Info TSA's files - Mechanical Engineering Drive\General Drive"

if os.path.exists(drive_path):
    for sem in sorted(os.listdir(drive_path)):
        sem_path = os.path.join(drive_path, sem)
        if os.path.isdir(sem_path) and "סמסטר" in sem:
            print(f"\n=== {sem} ===")
            for c in sorted(os.listdir(sem_path)):
                c_path = os.path.join(sem_path, c)
                if os.path.isdir(c_path):
                    sub = [s for s in os.listdir(c_path) if os.path.isdir(os.path.join(c_path, s))]
                    print(f"  📂 {c} -> {sub}")
