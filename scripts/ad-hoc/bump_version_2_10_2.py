import os
import json
import re

BASE_DIR = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
os.chdir(BASE_DIR)

NEW_VERSION = "2.10.2"
NEW_VERSION_CODE = 56

print(f"Bumping project to {NEW_VERSION} (code {NEW_VERSION_CODE})...")

# 1. package.json
pkg_path = "package.json"
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = json.load(f)
old_pkg_v = pkg.get("version")
pkg["version"] = NEW_VERSION
with open(pkg_path, "w", encoding="utf-8") as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
    f.write("\n")
print(f"package.json: {old_pkg_v} -> {NEW_VERSION}")

# 2. app.js
app_path = "app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

# Replace APP_CURRENT_REVISION = '2.10.1' or similar
app_text_new = re.sub(
    r"const APP_CURRENT_REVISION = ['\"][^'\"]+['\"];",
    f"const APP_CURRENT_REVISION = '{NEW_VERSION}';",
    app_text
)
# Also check APP_VERSION in app.js if any
app_text_new = re.sub(
    r"const APP_VERSION = ['\"][^'\"]+['\"];",
    f"const APP_VERSION = '{NEW_VERSION}';",
    app_text_new
)
if app_text != app_text_new:
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(app_text_new)
    print("app.js revision updated.")
else:
    print("app.js revision match not found or already up to date.")

# 3. index.html (headers, script query strings v=...)
index_path = "index.html"
with open(index_path, "r", encoding="utf-8") as f:
    index_text = f.read()

# Replace ?v=2.10.1 or similar
index_text_new = re.sub(r"\?v=2\.[0-9]+\.[0-9]+", f"?v={NEW_VERSION}", index_text)
# Also check for static version tag in header if any, e.g., v2.10.1
index_text_new = re.sub(r"v2\.[0-9]+\.[0-9]+", f"v{NEW_VERSION}", index_text_new)
if index_text != index_text_new:
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_text_new)
    print("index.html query strings and version tags updated.")
else:
    print("index.html already up to date or pattern mismatch.")

# 4. sw.js
sw_path = "sw.js"
with open(sw_path, "r", encoding="utf-8") as f:
    sw_text = f.read()

sw_text_new = re.sub(
    r"const CACHE_NAME = ['\"]semestero-cache-v[^'\"]+['\"];",
    f"const CACHE_NAME = 'semestero-cache-v{NEW_VERSION}';",
    sw_text
)
if sw_text != sw_text_new:
    with open(sw_path, "w", encoding="utf-8") as f:
        f.write(sw_text_new)
    print("sw.js CACHE_NAME updated.")
else:
    print("sw.js CACHE_NAME already up to date.")

# 5. android build.gradle (app & wear)
for gradle_path in ["android/app/build.gradle", "android/wear/build.gradle"]:
    if os.path.exists(gradle_path):
        with open(gradle_path, "r", encoding="utf-8") as f:
            gradle_text = f.read()
        g_new = re.sub(r"versionCode\s+\d+", f"versionCode {NEW_VERSION_CODE}", gradle_text)
        g_new = re.sub(r'versionName\s+["\'][^"\']+["\']', f'versionName "{NEW_VERSION}"', g_new)
        with open(gradle_path, "w", encoding="utf-8") as f:
            f.write(g_new)
        print(f"{gradle_path} updated to code {NEW_VERSION_CODE}, name {NEW_VERSION}")

print("Version bump complete.")
