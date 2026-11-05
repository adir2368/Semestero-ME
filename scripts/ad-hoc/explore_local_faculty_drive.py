import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

drive_path = r"C:\Users\user\OneDrive - Technion\Mechanichal Info TSA's files - Mechanical Engineering Drive\General Drive\סמסטר ג"

targets = [
    ("104228 מדח", os.path.join(drive_path, "(104228) מדח מ", "3. רפרנסים")),
    ("034029 מוצקים 2", os.path.join(drive_path, "(034029) מכניקת מוצקים 2", "3. רפרנסים")),
    ("034035 תרמו 1", os.path.join(drive_path, "(034035) תרמודינמיקה 1", "רפרנסים")),
    ("034056 חישוב מדעי", os.path.join(drive_path, "מבוא לחישוב מדעי והנדסי  34056", "3. רפרנסים"))
]

for label, t in targets:
    if os.path.exists(t):
        print(f"\n=== Inside {label} / רפרנסים ===")
        for item in sorted(os.listdir(t))[:15]:
            full = os.path.join(t, item)
            is_dir = os.path.isdir(full)
            print(f"  [{'DIR' if is_dir else 'FILE'}] {item}")
