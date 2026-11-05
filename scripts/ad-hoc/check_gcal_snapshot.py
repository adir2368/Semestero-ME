with open('google_calendars_snapshot.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '104043' in line or '104131' in line or '034061' in line:
        if '2026-11' in line or '2026-12' in line or '2027' in line or 'מועד' in line or 'exam' in line:
            print(f"Line {i+1}: {line.strip()[:100]}")
