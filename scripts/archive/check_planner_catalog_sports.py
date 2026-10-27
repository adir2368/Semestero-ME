import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_catalog.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

for target in ["03940800", "03940808", "3940800", "3940808"]:
    pos = 0
    while True:
        pos = text.find(target, pos)
        if pos == -1:
            break
        print(f"Found {target} at char {pos}:")
        sys.stdout.reconfigure(encoding='utf-8')
        print(text[max(0, pos-100):min(len(text), pos+400)])
        print("-" * 50)
        pos += len(target)
