import os
import re

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

app_text_new = re.sub(
    r'code:\s*"REV-[^"]+"',
    'code: "REV-2026.11.05-v2.10.2"',
    app_text
)
app_text_new = re.sub(
    r'version:\s*"2\.10\.1"',
    'version: "2.10.2"',
    app_text_new
)

if app_text != app_text_new:
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(app_text_new)
    print("app.js version bumped to 2.10.2 successfully!")
else:
    print("app.js pattern not matched.")

sw_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\sw.js"
with open(sw_path, "r", encoding="utf-8") as f:
    sw_text = f.read()

sw_text_new = re.sub(
    r"const CACHE_NAME = ['\"]semestero-me-v[^'\"]+['\"];",
    "const CACHE_NAME = 'semestero-me-v2.10.2';",
    sw_text
)
sw_text_new = re.sub(
    r"// Service Worker for Academic Skill Tree \(Semestero ME\) - v[^\r\n]+",
    "// Service Worker for Academic Skill Tree (Semestero ME) - v2.10.2",
    sw_text_new
)

if sw_text != sw_text_new:
    with open(sw_path, "w", encoding="utf-8") as f:
        f.write(sw_text_new)
    print("sw.js CACHE_NAME bumped to 2.10.2 successfully!")
else:
    print("sw.js pattern not matched.")
