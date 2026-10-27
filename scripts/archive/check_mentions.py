file_paths = [
    r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js",
    r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_module.js"
]

for fp in file_paths:
    print(f"=== {fp} ===")
    with open(fp, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            if any(t in line for t in ["03940800", "03940808", "3940800", "3940808", "03240269"]):
                print(f"Line {idx+1}: {line.strip()[:140]}")
