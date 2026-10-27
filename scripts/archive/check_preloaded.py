import re

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

def search_in_file(filename):
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    print(f"=== {filename} ===")
    for m in re.finditer(r'(0394\d{4}|0324\d{4})', content):
        start = max(0, m.start() - 60)
        end = min(len(content), m.end() + 60)
        snippet = content[start:end].replace('\n', ' ')
        print(f"  {m.group(1)}: ...{snippet}...")

search_in_file(f"{ws}\\preloaded_user_state.js")
search_in_file(f"{ws}\\user_saved_state.json")
