import re

root = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"

# 1. package.json
pkg_path = f"{root}\\package.json"
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = f.read()
pkg = re.sub(r'"version":\s*"2\.7\.\d+"', '"version": "2.7.3"', pkg)
with open(pkg_path, "w", encoding="utf-8") as f:
    f.write(pkg)
print("Updated package.json to 2.7.3")

# 2. sw.js
sw_path = f"{root}\\sw.js"
with open(sw_path, "r", encoding="utf-8") as f:
    sw = f.read()
sw = re.sub(r"const CACHE_NAME = 'semestero-me-v2\.7\.\d+';", "const CACHE_NAME = 'semestero-me-v2.7.3';", sw)
sw = re.sub(r"- v2\.7\.\d+", "- v2.7.3", sw)
with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw)
print("Updated sw.js to 2.7.3")

# 3. index.html
html_path = f"{root}\\index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()
html = html.replace("?v=2.7.2", "?v=2.7.3")
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
print("Updated index.html to ?v=2.7.3")
