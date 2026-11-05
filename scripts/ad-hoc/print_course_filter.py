import sys

sys.stdout.reconfigure(encoding="utf-8")

with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('id="filter-course"')
start = text.rfind('<div class="filter-group">', 0, idx)
end = text.find('</div>', idx) + 6
print(f"Start={start}, End={end}")
print(repr(text[start:end]))
