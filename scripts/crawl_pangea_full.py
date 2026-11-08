import urllib.request
import re
import sys
import json
import os

sys.stdout.reconfigure(encoding='utf-8')

print("Fetching all courses on Pangea...")
req = urllib.request.Request('https://idofangbentov.uk/Technion/', headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
except Exception as e:
    print("Failed to fetch root:", e)
    sys.exit(1)

# Find course links
courses = sorted(list(set(re.findall(r'href=[\'"]\.\./Technion/([A-Z0-9]+)/[\'"]', html))))
print(f"Found {len(courses)} courses: {', '.join(courses)}")

pangea_tree = {}

for c_code in courses:
    c_url = f"https://idofangbentov.uk/Technion/{c_code}/"
    try:
        c_req = urllib.request.Request(c_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(c_req, timeout=10) as c_resp:
            c_html = c_resp.read().decode('utf-8', errors='ignore')
            
            # Find title
            m_title = re.search(r'<title>(.*?)</title>', c_html, re.I)
            title = m_title.group(1).replace('תיקייה: Technion/', '') if m_title else c_code
            
            # Find all internal links inside this course folder
            links = re.findall(r'href=[\'"]\.\./\.\./Technion/' + c_code + r'/([^\'"]+)[\'"]', c_html)
            clean_links = sorted(list(set([l.split('"')[0].split('#')[0] for l in links if l and not l.startswith('static') and not l.startswith('index')])))
            
            course_entry = {
                "course_tag": c_code,
                "title": title,
                "url": c_url,
                "lectures": [],
                "homework": [],
                "exams": [],
                "projects": [],
                "other": []
            }
            
            for item in clean_links:
                item_url = f"https://idofangbentov.uk/Technion/{c_code}/{item}"
                # Categorize item
                item_decoded = urllib.parse.unquote(item)
                if '_HW' in item or 'תרגיל' in item_decoded or 'שיעורי' in item_decoded:
                    # Homework
                    course_entry["homework"].append({"slug": item, "name": item_decoded, "url": item_url})
                elif '_E20' in item or '_Exam' in item or 'מבחן' in item_decoded or '_EEQ' in item:
                    # Exam
                    course_entry["exams"].append({"slug": item, "name": item_decoded, "url": item_url})
                elif '_P0' in item or 'פרויקט' in item_decoded or 'project' in item_decoded.lower():
                    # Project
                    course_entry["projects"].append({"slug": item, "name": item_decoded, "url": item_url})
                elif re.search(r'_[0-9]{3}', item):
                    # Lecture note / chapter
                    course_entry["lectures"].append({"slug": item, "name": item_decoded, "url": item_url})
                else:
                    course_entry["other"].append({"slug": item, "name": item_decoded, "url": item_url})
            
            pangea_tree[c_code] = course_entry
            print(f"✓ {c_code}: {len(course_entry['lectures'])} lectures, {len(course_entry['homework'])} HW, {len(course_entry['exams'])} exams, {len(course_entry['projects'])} projects")
    except Exception as e:
        print(f"✗ Error {c_code}: {e}")

output_path = os.path.join(os.path.dirname(__file__), 'pangea_extracted_catalog.json')
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(pangea_tree, f, ensure_ascii=False, indent=2)

print(f"\nSaved full Pangea catalog with {len(pangea_tree)} courses to {output_path}")
