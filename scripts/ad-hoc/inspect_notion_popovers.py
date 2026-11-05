import sys

sys.stdout.reconfigure(encoding="utf-8")

with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('id="notion-status-filter-btn"')
print(text[idx-200:idx+2500])
