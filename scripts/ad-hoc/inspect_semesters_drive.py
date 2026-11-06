import os, sys
sys.stdout.reconfigure(encoding='utf-8')

drive_dir = os.path.join(r"C:\Users\user\OneDrive - Technion", "Mechanichal Info TSA's files - Mechanical Engineering Drive", "General Drive")

for sem in ["סמסטר ג", "סמסטר ד", "סמסטר ב", "סמסטר א"]:
    sem_path = os.path.join(drive_dir, sem)
    if os.path.exists(sem_path):
        print(f"\n=== {sem} ===")
        for course in sorted(os.listdir(sem_path)):
            full = os.path.join(sem_path, course)
            if os.path.isdir(full):
                sub = [s for s in os.listdir(full) if os.path.isdir(os.path.join(full, s))]
                print(f"  📁 {course} (subfolders: {', '.join(sub)})")
