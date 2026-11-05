with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(7140, 0, -1):
    line = lines[i]
    if 'degreePlan' in line or 'AUTHENTIC' in line or 'PRELOADED' in line or 'SAMPLE' in line or 'customPlan' in line or 'degree_plan' in line:
        print(f"Line {i+1}: {line.strip()[:100]}")
        break
