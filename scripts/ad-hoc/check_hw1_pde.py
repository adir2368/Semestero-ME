import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

p = r"C:\Users\user\OneDrive - Technion\Mechanichal Info TSA's files - Mechanical Engineering Drive\General Drive\סמסטר ג\(104228) מדח מ\3. רפרנסים\1"
if os.path.exists(p):
    print(f"=== Files in {p} ===")
    for item in os.listdir(p):
        print(f"  - {item}")
