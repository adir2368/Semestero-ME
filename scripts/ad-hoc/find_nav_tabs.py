import sys

sys.stdout.reconfigure(encoding="utf-8")

with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('class="hud-nav-tabs"')
if idx == -1:
    idx = text.find("hud-nav-tabs")
print(text[idx-50:idx+800])
