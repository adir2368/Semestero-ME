file_paths = [
    r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js",
    r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html",
    r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\auth_sync.js"
]

import os
for fp in file_paths:
    if os.path.exists(fp):
        with open(fp, "r", encoding="utf-8") as f:
            text = f.read()
        if "isAdirActive" in text:
            print(f"Found in {fp}")
            for line in text.split("\n"):
                if "isAdirActive" in line and ("function" in line or ":" in line):
                    print("  ", line.strip()[:140])
