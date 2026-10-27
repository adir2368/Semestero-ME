import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_module.js"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

sys.stdout.reconfigure(encoding='utf-8')
print("--- Lines 700 to 735 ---")
for i in range(700, 735):
    print(f"{i+1}: {lines[i]}", end="")

print("\n--- Lines 800 to 845 ---")
for i in range(800, 845):
    print(f"{i+1}: {lines[i]}", end="")
