with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'SAMPLE_ME_DEGREE' in line or 'trackGroup' in line or '114071' in line or '114075' in line or 'selectPhysicsVariant' in line:
        print(f"{i+1}: {line.strip()[:100]}")
