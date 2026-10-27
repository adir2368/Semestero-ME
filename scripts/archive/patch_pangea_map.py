import os
import json

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_path = os.path.join(root, 'app.js')

from build_pangea_map import PANGEA_FULL_MAP

# Format PANGEA_FULL_MAP as JavaScript object literal
js_lines = ["const PANGEA_COURSE_MAP = {"]
for code, url in sorted(PANGEA_FULL_MAP.items()):
    js_lines.append(f"    '{code}': '{url}',")
js_lines.append("};")
new_pangea_js = "\n".join(js_lines)

with open(app_path, 'r', encoding='utf-8') as f:
    app_code = f.read()

# Target block
start_marker = "const PANGEA_COURSE_MAP = {"
end_marker = "};\n\n// Authoritative Moodle 26"
if "\r\n" in app_code:
    end_marker = "};\r\n\r\n// Authoritative Moodle 26"

start_idx = app_code.find(start_marker)
end_idx = app_code.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Error: Could not find PANGEA_COURSE_MAP block in app.js")
    exit(1)

old_block = app_code[start_idx : end_idx + 2]

if "\r\n" in app_code:
    new_pangea_js = new_pangea_js.replace("\n", "\r\n")

app_code = app_code[:start_idx] + new_pangea_js + app_code[end_idx + 2:]

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Updated app.js with exhaustive 34-course PANGEA_COURSE_MAP successfully!")
