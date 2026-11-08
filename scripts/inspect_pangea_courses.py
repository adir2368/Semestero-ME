import urllib.request
import re
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

req = urllib.request.Request('https://idofangbentov.uk/Technion/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Find all course folder links
courses = re.findall(r'href=[\'"](\.\./Technion/([A-Z0-9]+)/)[\'"]', html)
print(f"Total course folders found: {len(courses)}")

course_details = {}
for rel_path, code in sorted(set(courses))[:12]:
    c_url = f"https://idofangbentov.uk/Technion/{code}/"
    try:
        c_req = urllib.request.Request(c_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(c_req, timeout=10) as c_resp:
            c_html = c_resp.read().decode('utf-8', errors='ignore')
            items = re.findall(r'href=[\'"](\.\./\.\./Technion/[^/]+/([^/]+))[\'"]', c_html)
            # Filter out index/static
            clean_items = []
            for item_path, item_name in items:
                if not item_name.startswith('index') and not item_name.startswith('static'):
                    clean_items.append(item_name)
            course_details[code] = clean_items
            print(f"Course {code} ({c_url}) has {len(clean_items)} notes/items:")
            for it in clean_items[:6]:
                print(f"   - {it}")
    except Exception as e:
        print(f"Error for {code}: {e}")
