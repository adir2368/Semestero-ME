js_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"

with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

target = '''    "104131": { moedA: "2026-10-17", moedB: "2026-11-12", name: "מד"ר" },
    "104043": { moedA: "2026-10-20", moedB: "2026-11-15", name: "חדו"א 2" },'''

replacement = '''    "104131": { moedA: "2026-10-17", moedB: "2026-11-12", name: "מד\\"ר" },
    "104043": { moedA: "2026-10-20", moedB: "2026-11-15", name: "חדו\\"א 2" },'''

if target in js:
    js = js.replace(target, replacement, 1)
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print("Quotes fixed successfully.")
else:
    print("Target not found, inspecting line...")
    for line in js.splitlines():
        if "104131" in line:
            print("Found line:", line)
