import os, re

root = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
targets = ["03940800", "03940808", "3940800", "3940808", "03240269"]

for dirpath, dirnames, filenames in os.walk(root):
    # skip .git and node_modules
    if any(x in dirpath for x in [".git", "node_modules", "dist", ".cache"]):
        continue
    for fname in filenames:
        if not fname.endswith((".js", ".json", ".html")):
            continue
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
            for t in targets:
                if t in content:
                    print(f"Found {t} in {os.path.relpath(fpath, root)}")
        except Exception as e:
            pass
