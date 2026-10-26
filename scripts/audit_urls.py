import os, re

files = ['index.html', 'app.js', 'widgets.html', 'auth_sync.js']
url_pattern = re.compile(r'https?://[^\s"\'<>()]+')

found_urls = set()
for fname in files:
    if not os.path.exists(fname):
        continue
    with open(fname, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    urls = url_pattern.findall(content)
    for u in urls:
        # filter out standard CDN / lib urls
        if any(lib in u.lower() for lib in ['cdnjs', 'jsdelivr', 'unpkg', 'google', 'gstatic', 'w3.org', 'tailwindcss', 'fontawesome', 'fonts']):
            continue
        found_urls.add((fname, u.rstrip(',;."\')')))

for fname, u in sorted(found_urls):
    print(f"[{fname}] {u}")
