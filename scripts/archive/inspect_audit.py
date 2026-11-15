import json

with open('audit_connections_results.json', encoding='utf-8') as f:
    items = json.load(f)

print("=== ALL JS FOLDER MATCHES ===")
for it in items:
    if it['file'].startswith('js'):
        print(f"{it['file']}:{it['line']} [{it['keyword']}] {it['snippet']}")
