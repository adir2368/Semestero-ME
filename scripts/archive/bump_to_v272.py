import json
import re
import os
import shutil

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
os.chdir(ws)

print("Starting bump to v2.7.2...")

# 1. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

# Update PURGED_FLOWCHART_CODES in renderFlowchartTree()
old_purged = "const PURGED_FLOWCHART_CODES = new Set(['035026', '35026', '035044', '01140071', '114071']);"
new_purged = """const PURGED_FLOWCHART_CODES = new Set([
        '035026', '35026', '035044', '01140071', '114071',
        '03240269', '3240269', '03940800', '3940800', '03940808', '3940808'
    ]);"""
if old_purged in app_text:
    app_text = app_text.replace(old_purged, new_purged, 1)
    print("Updated PURGED_FLOWCHART_CODES in app.js")
else:
    print("Warning: old PURGED_FLOWCHART_CODES not found in app.js!")

# Also check course.altCode against PURGED_FLOWCHART_CODES
old_check = "if (PURGED_FLOWCHART_CODES.has(course.code)) return;"
new_check = "if (PURGED_FLOWCHART_CODES.has(course.code) || (course.altCode && PURGED_FLOWCHART_CODES.has(course.altCode))) return;"
if old_check in app_text:
    app_text = app_text.replace(old_check, new_check, 1)
    print("Updated PURGED_FLOWCHART_CODES check in app.js")

# Upgrade comprehensive localStorage scanner in loadSavedState()
old_scanner = """    // Self-healing cleanup for accidental QA test courses in Adir's local storage
    try {
        ['ast_custom_degree_plan_v2_adir', 'ast_custom_degree_plan_v2', 'academic_skill_tree_save'].forEach(k => {
            const raw = localStorage.getItem(k);
            if (raw && (raw.includes('03240269') || raw.includes('03940800') || raw.includes('03940808'))) {
                const parsed = JSON.parse(raw);
                let touched = false;
                if (Array.isArray(parsed.semesters)) {
                    parsed.semesters.forEach(s => {
                        if (s.semester === 4 && Array.isArray(s.courses)) {
                            s.courses = s.courses.filter(c => !['03240269', '03940800', '03940808'].includes(c.code) && !['03240269', '03940800', '03940808'].includes(c.altCode));
                            touched = true;
                        }
                    });
                }
                if (parsed.courses) {
                    ['03240269', '03940800', '03940808'].forEach(c => {
                        if (parsed.courses[c] && !parsed.courses[c].grade) {
                            delete parsed.courses[c];
                            touched = true;
                        }
                    });
                }
                if (touched) {
                    localStorage.setItem(k, JSON.stringify(parsed));
                }
            }
        });
    } catch (e) {}"""

new_scanner = """    // Comprehensive self-healing cleanup for accidental QA test courses across ALL storage keys
    try {
        const INFILTRATORS = ['03240269', '3240269', '03940800', '3940800', '03940808', '3940808'];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            const raw = localStorage.getItem(k);
            if (raw && (raw.includes('03240269') || raw.includes('03940800') || raw.includes('03940808'))) {
                try {
                    const parsed = JSON.parse(raw);
                    let touched = false;
                    if (Array.isArray(parsed.semesters)) {
                        parsed.semesters.forEach(s => {
                            if (s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !INFILTRATORS.includes(c.code) && !INFILTRATORS.includes(c.altCode));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }
                    if (Array.isArray(parsed.degreePlan)) {
                        parsed.degreePlan.forEach(s => {
                            if (s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !INFILTRATORS.includes(c.code) && !INFILTRATORS.includes(c.altCode));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }
                    if (parsed.courses) {
                        INFILTRATORS.forEach(c => {
                            if (parsed.courses[c] && !parsed.courses[c].grade) {
                                delete parsed.courses[c];
                                touched = true;
                            }
                        });
                    }
                    if (touched) {
                        localStorage.setItem(k, JSON.stringify(parsed));
                    }
                } catch (e) {}
            }
        }
    } catch (e) {}"""

if old_scanner in app_text:
    app_text = app_text.replace(old_scanner, new_scanner, 1)
    print("Updated comprehensive localStorage scanner in app.js")

# Version string in app.js
app_text = re.sub(r'code:\s*"REV-[^"]+"', 'code: "REV-2026.10.27-v2.7.2"', app_text)
app_text = re.sub(r'version:\s*"[^"]+"', 'version: "2.7.2"', app_text, count=1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_text)
print("Updated app.js -> v2.7.2")

# 2. Update package.json
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)
pkg['version'] = '2.7.2'
with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
print("Updated package.json -> 2.7.2")

# 3. Update sw.js
with open('sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()
sw = re.sub(r"const CACHE_NAME = 'semestero-me-v[^']+';", "const CACHE_NAME = 'semestero-me-v2.7.2';", sw)
with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw)
print("Updated sw.js -> semestero-me-v2.7.2")

# 4. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace all ?v=2.7.0 and ?v=2.7.1 with ?v=2.7.2
html = re.sub(r'(\.(?:js|css))\?v=2\.7\.[01]', r'\1?v=2.7.2', html)

# Add changelog entry
crlf = '\r\n' in html
target_ul = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">\n'
v272_entry = '''<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">
                            <li><strong>v2.7.2 (27/10/2026):</strong> טיהור מלא של קורסי בדיקות מסמסטר 4 (אתיקה בפעולה, כושר גופני ופילאטיס ומתיחות) מעץ הזרימה ומכל מפתחות ה-LocalStorage, חסימת רינדור הרמטית ב-DAG Flowchart, ועדכון גרסת Service Worker עם ניקוי מטמון כפוי.</li>\n'''

if crlf:
    target_ul = target_ul.replace('\n', '\r\n')
    v272_entry = v272_entry.replace('\n', '\r\n')

if target_ul in html:
    html = html.replace(target_ul, v272_entry, 1)
    print("Updated index.html changelog with v2.7.2 entry")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html -> asset versions ?v=2.7.2")

# 5. Update android/app/build.gradle
if os.path.exists('android/app/build.gradle'):
    with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
        gradle = f.read()
    gradle = re.sub(r'versionCode\s+\d+', 'versionCode 28', gradle)
    gradle = re.sub(r'versionName\s+"[^"]+"', 'versionName "2.7.2"', gradle)
    with open('android/app/build.gradle', 'w', encoding='utf-8') as f:
        f.write(gradle)
    print("Updated android/app/build.gradle -> versionCode 28, versionName 2.7.2")

# 6. Copy to dist/Semestero ME-win32-x64/resources/app/
dist_app = r'dist\Semestero ME-win32-x64\resources\app'
if os.path.exists(dist_app):
    for fn in ['app.js', 'planner_module.js', 'sw.js', 'index.html', 'package.json']:
        shutil.copy2(fn, os.path.join(dist_app, fn))
    print(f"Synchronized updated files to {dist_app}")

print("Version bump to v2.7.2 completed successfully!")
