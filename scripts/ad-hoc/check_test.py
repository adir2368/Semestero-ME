with open('tests/curriculum_isolation_and_recommended_tracks.test.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for i, line in enumerate(lines):
    if '125013' in line or 'Chem Lab' in line:
        print(f"{i+1}: {line}")
