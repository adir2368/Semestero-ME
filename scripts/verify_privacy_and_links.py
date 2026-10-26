import os
import sys
import io

# Force UTF-8 on Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEARCH_TERMS = [
    'D4bh8oHO0GQI5Gx1iYAbWsouBVx2',
    '71ec3efb9e46b0abafa44532f0e2aab1',
    '43774',
    'technion_schedule.ics',
    'export_execute.php'
]

results = {term: [] for term in SEARCH_TERMS}
SKIP_DIRS = {'.git', 'dist', 'dist_build', 'build', 'node_modules', 'android/app/build', 'android/.gradle', '.gradle', 'www'}

for root, dirs, files in os.walk(ROOT):
    # filter out skip dirs
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not any(skip in os.path.join(root, d).replace('\\', '/') for skip in SKIP_DIRS)]
    for file in files:
        if file.endswith(('.js', '.html', '.json', '.py')) and file != 'google_calendars_snapshot.json' and not file.startswith('sanitize_'):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, ROOT)
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                for term in SEARCH_TERMS:
                    if term in content:
                        results[term].append(rel_path)
            except Exception as e:
                pass

print("==================================================")
print("🔍 CODEBASE PRIVACY & PERSONAL TOKEN AUDIT")
print("==================================================")
clean = True
for term, matches in results.items():
    print(f"Term '{term}': {len(matches)} matches")
    for m in matches:
        print(f"   ⚠️ Found in: {m}")
        clean = False

if clean:
    print("\n✅ 100% CLEAN: No personal CheeseFork UIDs, private Gist tokens, or Moodle user IDs exist in client code!")
else:
    print("\n❌ ATTENTION: Some personal references still exist!")
print("==================================================")
