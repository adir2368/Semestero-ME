import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(ROOT, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all href="..." from index.html
hrefs = re.findall(r'<a\s+[^>]*?href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)

report = []
report.append("==================================================")
report.append(f"TOTAL <A> LINKS FOUND IN index.html: {len(hrefs)}")
report.append("==================================================")

for href, inner in hrefs:
    clean_text = re.sub(r'<[^>]+>', '', inner).strip()
    clean_text = ' '.join(clean_text.split())[:50]
    report.append(f"HREF: {href}")
    report.append(f"TEXT: {clean_text}")
    report.append("---")

# Also search app.js for window.open( or fetch( or href assignments
with open(os.path.join(ROOT, 'app.js'), 'r', encoding='utf-8') as f:
    js = f.read()

open_calls = re.findall(r'window\.open\(["\']([^"\']+)["\']', js)
report.append("\n==================================================")
report.append(f"STATIC window.open(...) CALLS IN app.js: {len(open_calls)}")
report.append("==================================================")
for call in open_calls:
    report.append(f"URL: {call}")

out_path = os.path.join(ROOT, 'all_links_report.txt')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(report))

print(f"Report written to all_links_report.txt ({len(report)} lines)")
