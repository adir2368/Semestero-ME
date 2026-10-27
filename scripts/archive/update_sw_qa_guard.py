import os

INDEX_PATH = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    c = f.read()

target = "if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {"
replacement = "if ('serviceWorker' in navigator && window.location.protocol.startsWith('http') && !window.location.search.includes('qa_')) {"

if target in c:
    c = c.replace(target, replacement)
    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(c)
    print("index.html SW guard patched successfully!")
else:
    print("Target not found or already patched.")
