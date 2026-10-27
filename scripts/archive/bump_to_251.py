import json

# package.json
p = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\package.json"
with open(p, "r", encoding="utf-8") as f:
    d = json.load(f)
d["version"] = "2.5.1"
with open(p, "w", encoding="utf-8") as f:
    json.dump(d, f, indent=2)

# index.html
idx_p = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(idx_p, "r", encoding="utf-8") as f:
    text = f.read()
text = text.replace("v=2.5.0", "v=2.5.1")
text = text.replace("v2.5.0", "v2.5.1")
with open(idx_p, "w", encoding="utf-8") as f:
    f.write(text)

# app.js
app_p = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_p, "r", encoding="utf-8") as f:
    app_text = f.read()
app_text = app_text.replace('version: "2.5.0"', 'version: "2.5.1"')
app_text = app_text.replace('REV-2026.10.20-v2.5.0', 'REV-2026.10.24-v2.5.1')
with open(app_p, "w", encoding="utf-8") as f:
    f.write(app_text)

# README.md
readme_p = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\README.md"
with open(readme_p, "r", encoding="utf-8") as f:
    rm_text = f.read()
rm_text = rm_text.replace("version-2.5.0", "version-2.5.1")
with open(readme_p, "w", encoding="utf-8") as f:
    f.write(rm_text)

print("Bumped version to 2.5.1 successfully!")
